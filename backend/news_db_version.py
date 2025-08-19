# backend/news_db_version.py
import os, re
from fastapi import APIRouter, HTTPException, Header, Body
from backend_db import list_news, get_news_detail, list_news_tags
from psycopg import connect

router = APIRouter()

NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")
DB_URL = os.getenv("SUPABASE_DB_URL")

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
    title: str = Body(...),
    content_html: str = Body(...),
    excerpt: str = Body(default=""),
    image_url: str | None = Body(default=None),
    tags: list[str] = Body(default=[]),
    author: str | None = Body(default=None),
    x_api_key: str = Header(default="")
):
    if x_api_key != NEWS_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")
    if not DB_URL:
        raise HTTPException(status_code=500, detail="DB not configured")

    article_id = f"{_slug(title)}"
    sql = """
      insert into public.news_article (id, title, date, image_url, excerpt, content_html, tags, published)
      values (%s,%s,current_date,%s,%s,%s,%s,true)
      on conflict (id) do update set
        title = excluded.title,
        image_url = excluded.image_url,
        excerpt = excluded.excerpt,
        content_html = excluded.content_html,
        tags = excluded.tags,
        published = true,
        updated_at = now()
    """
    with connect(DB_URL) as conn, conn.cursor() as cur:
        cur.execute(sql, (article_id, title, image_url, excerpt, content_html, tags))
        conn.commit()
    return {"ok": True, "id": article_id}

@router.put("/news/{article_id}")
def update_news(
    article_id: str,
    title: str = Body(...),
    content_html: str = Body(...),
    excerpt: str = Body(default=""),
    image_url: str | None = Body(default=None),
    tags: list[str] = Body(default=[]),
    x_api_key: str = Header(default="")
):
    if x_api_key != NEWS_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")
    if not DB_URL:
        raise HTTPException(status_code=500, detail="DB not configured")

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
    with connect(DB_URL) as conn, conn.cursor() as cur:
        cur.execute(sql, (title, image_url, excerpt, content_html, tags, article_id))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Not found")
        conn.commit()
    return {"ok": True, "id": article_id}
