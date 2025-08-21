# backend/news_db_version.py
import os, re
import html as _html
from fastapi import APIRouter, HTTPException, Header, Body
from backend_db import list_news, get_news_detail, list_news_tags
from psycopg import connect
from typing import Any, Dict, Mapping

router = APIRouter()

NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")
DB_URL = os.getenv("SUPABASE_DB_URL")

def _slug(s: str) -> str:
    return re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()[:80]

def _split_tags(val):
    if isinstance(val, list):
        return [str(t).strip() for t in val if str(t).strip()]
    if val is None:
        return []
    # allow comma/space/# separated strings
    return [s.strip() for s in re.split(r"[,\s#]+", str(val)) if s.strip()][:12]

def _to_html(content_html: str | None, content_markdown: str | None, content_text: str | None) -> str:
    """
    Prefer explicit HTML if provided; else render a simple HTML fragment
    from markdown/plaintext (no external deps).
    """
    if content_html and content_html.strip():
        return content_html.strip()

    src = (content_markdown or content_text or "").strip()
    if not src:
        return ""

    # Escape HTML, preserve paragraphs & line breaks, very light linkify.
    esc = _html.escape(src)
    esc = re.sub(r"(https?://[^\s<>]+)", r'<a href="\1" target="_blank" rel="noopener">\1</a>', esc)
    paras = [p.replace("\n", "<br>") for p in esc.split("\n\n")]
    return "<p>" + "</p><p>".join(paras) + "</p>"


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
    paras = [_html.escape(p.strip()) for p in re.split(r"\n\s*\n", v) if p.strip()]
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
    title: str = Body(...),
    excerpt: str = Body(default=""),
    image_url: str | None = Body(default=None),
    tags = Body(default=[]),  # accept list or string
    content_html: str | None = Body(default=None),
    content_markdown: str | None = Body(default=None),
    content: str | None = Body(default=None),  # allow plain 'content'
    x_api_key: str = Header(default="")
):
    if x_api_key != NEWS_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")
    if not DB_URL:
        raise HTTPException(status_code=500, detail="DB not configured")

    body_html = _to_html(content_html, content_markdown, content)
    tag_list = _split_tags(tags)
    article_id = f"{_slug(title)}"
    sql = """
      insert into public.news_article
        (id, title, date, image_url, excerpt, content_html, tags, published)
      values
        (%s,%s,current_date,%s,%s,%s,%s,true)
      on conflict (id) do update set
        title = excluded.title,
        image_url = excluded.image_url,
        excerpt = excluded.excerpt,
        content_html = excluded.content_html,
        tags = excluded.tags,
        published = true,
        updated_at = now()
    """
    from psycopg import connect
    with connect(DB_URL) as conn, conn.cursor() as cur:
        cur.execute(sql, (article_id, title, image_url, excerpt, body_html, tag_list))
        conn.commit()
    return {"ok": True, "id": article_id}


@router.put("/news/{article_id}")
def update_news(
    article_id: str,
    title: str = Body(...),
    excerpt: str = Body(default=""),
    image_url: str | None = Body(default=None),
    tags = Body(default=[]),
    content_html: str | None = Body(default=None),
    content_markdown: str | None = Body(default=None),
    content: str | None = Body(default=None),
    x_api_key: str = Header(default="")
):
    if x_api_key != NEWS_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")
    if not DB_URL:
        raise HTTPException(status_code=500, detail="DB not configured")

    body_html = _to_html(content_html, content_markdown, content)
    tag_list = _split_tags(tags)

    sql = """
      update public.news_article
      set title = %s,
          image_url = %s,
          excerpt = %s,
          content_html = %s,
          tags = %s,
          updated_at = now()
      where id = %s
    """
    from psycopg import connect
    with connect(DB_URL) as conn, conn.cursor() as cur:
        cur.execute(sql, (title, image_url, excerpt, body_html, tag_list, article_id))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Not found")
        conn.commit()
    return {"ok": True, "id": article_id}
