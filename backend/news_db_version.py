# backend/news_db_version.py
import os, re, html
from fastapi import APIRouter, HTTPException, Header, Body
from backend_db import list_news, get_news_detail, list_news_tags
from psycopg import connect
from typing import Any, Dict, Mapping

router = APIRouter()

NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")
DB_URL = os.getenv("SUPABASE_DB_URL")

def _slug(s: str) -> str:
    return re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()[:80]

def _coerce_html(value: Any) -> str:
    """
    Accepts either HTML or plain text.
    - If it looks like HTML (has '<' and '>'), we keep it as-is.
    - Otherwise we escape and convert newlines to <p> / <br>.
    """
    if value is None:
        return ""
    v = str(value).strip()
    if "<" in v and ">" in v:  # very light heuristic for "already HTML"
        return v

    # Treat blank line(s) as paragraph breaks; single newlines as <br>
    paras = [html.escape(p.strip()) for p in re.split(r"\n\s*\n", v) if p.strip()]
    if not paras:
        return "<p></p>"
    return "".join(f"<p>{p.replace('\n', '<br>')}</p>" for p in paras)

def _coerce_tags(value: Any) -> list[str]:
    """
    Accept list or comma-separated string; normalize to list[str].
    """
    if value is None:
        return []
    if isinstance(value, (list, tuple)):
        return [str(t).strip() for t in value if str(t).strip()]
    # comma or newline separated
    parts = re.split(r"[,\n]+", str(value))
    return [p.strip() for p in parts if p.strip()]


def _slug(s: str) -> str:
    return re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()[:80]

@router.get("/news")
def get_news_list():
    return list_news()

@router.get("/news/{article_id}")
def get_news_item(article_id: str):
    row = get_news_detail(article_id)
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    return row

@router.get("/news/tags")
def get_tags():
    return {"tags": list_news_tags()}

@router.post("/news", status_code=201)
def create_news(
    payload: Dict[str, Any] = Body(...),
    x_api_key: str = Header(..., alias="X-Api-Key"),
):
    # Auth: keep NEWS_API_KEY, but allow fallback to API_KEY if desired
    expected = NEWS_API_KEY or os.getenv("API_KEY", "")
    if x_api_key != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")
    if not DB_URL:
        raise HTTPException(status_code=500, detail="DB not configured")

    if not isinstance(payload, Mapping):
        raise HTTPException(status_code=400, detail="Body must be a JSON object")

    title = str(payload.get("title", "")).strip()
    if not title:
        raise HTTPException(status_code=422, detail="title is required")

    # Accept either 'content_html' (raw HTML) or a plain text alternative 'content'/'body'
    raw_content = payload.get("content_html") or payload.get("content") or payload.get("body") or ""
    content_html = _coerce_html(raw_content)

    excerpt   = str(payload.get("excerpt", "") or "")
    image_url = payload.get("image_url") or payload.get("image") or None
    tags      = _coerce_tags(payload.get("tags") or payload.get("tag"))
    published = bool(payload.get("published", True))
    author    = payload.get("author")

    article_id = f"{_slug(title)}"

    sql = """
      insert into public.news_article
        (id, title, date, image_url, excerpt, content_html, tags, published)
      values
        (%s, %s, current_date, %s, %s, %s, %s, %s)
      on conflict (id) do update set
        title        = excluded.title,
        image_url    = excluded.image_url,
        excerpt      = excluded.excerpt,
        content_html = excluded.content_html,
        tags         = excluded.tags,
        published    = excluded.published,
        updated_at   = now()
    """
    with connect(DB_URL) as conn, conn.cursor() as cur:
        cur.execute(sql, (article_id, title, image_url, excerpt, content_html, tags, published))
        conn.commit()
    return {"ok": True, "id": article_id}


@router.put("/news/{article_id}")
def update_news(
    article_id: str,
    payload: Dict[str, Any] = Body(...),
    x_api_key: str = Header(..., alias="X-Api-Key"),
):
    expected = NEWS_API_KEY or os.getenv("API_KEY", "")
    if x_api_key != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")
    if not DB_URL:
        raise HTTPException(status_code=500, detail="DB not configured")

    if not isinstance(payload, Mapping):
        raise HTTPException(status_code=400, detail="Body must be a JSON object")

    title = str(payload.get("title", "")).strip()
    if not title:
        raise HTTPException(status_code=422, detail="title is required")

    raw_content = payload.get("content_html") or payload.get("content") or payload.get("body") or ""
    content_html = _coerce_html(raw_content)

    excerpt   = str(payload.get("excerpt", "") or "")
    image_url = payload.get("image_url") or payload.get("image") or None
    tags      = _coerce_tags(payload.get("tags") or payload.get("tag"))
    published = bool(payload.get("published", True))

    sql = """
      update public.news_article
      set title = %s,
          image_url = %s,
          excerpt = %s,
          content_html = %s,
          tags = %s,
          published = %s,
          updated_at = now()
      where id = %s
    """
    with connect(DB_URL) as conn, conn.cursor() as cur:
        cur.execute(sql, (title, image_url, excerpt, content_html, tags, published, article_id))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Not found")
        conn.commit()
    return {"ok": True, "id": article_id}
