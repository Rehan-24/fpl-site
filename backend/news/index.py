# backend/news/index.py
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, field_validator
from typing import List, Optional
from datetime import datetime
import os, json, re
import markdown as md

router = APIRouter()
DATA_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "news.json"))
API_KEY = os.getenv("NEWS_API_KEY", "")  # set this in your env on Render

# ---------- models ----------
class NewsCreate(BaseModel):
  title: str
  date: Optional[str] = None            # ISO date; default = today (UTC)
  image_url: Optional[str] = None
  excerpt: Optional[str] = ""
  content_markdown: str
  tags: List[str] = []
  author: Optional[str] = None          # e.g., "User#1234 (1234567890)"

  @field_validator("tags", mode="before")
  @classmethod
  def norm_tags(cls, v):
    if isinstance(v, str):
      v = [t.strip() for t in v.split(",")]
    return [t for t in (v or []) if t]

# ---------- helpers ----------
def load_all():
  try:
    with open(DATA_FILE, "r", encoding="utf-8") as f:
      return json.load(f)
  except FileNotFoundError:
    return []

def save_all(rows):
  os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
  with open(DATA_FILE, "w", encoding="utf-8") as f:
    json.dump(rows, f, ensure_ascii=False, indent=2)

def slugify(s: str) -> str:
  s = s.lower()
  s = re.sub(r"[^\w\s-]", "", s)
  s = re.sub(r"\s+", "-", s).strip("-")
  return s[:80]

def md_to_html(text: str) -> str:
  return md.markdown(text, extensions=["extra", "sane_lists", "tables"])

def require_api_key(x_api_key: str = Header(default="")):
  if not API_KEY or x_api_key != API_KEY:
    raise HTTPException(status_code=401, detail="Unauthorized")

# ---------- public GET endpoints (frontend uses these) ----------
@router.get("/news")
def list_news():
  rows = sorted(load_all(), key=lambda r: r.get("date", ""), reverse=True)
  # return lightweight items for list page
  return [
    {
      "id": r.get("id"),
      "title": r.get("title"),
      "date": r.get("date"),
      "image_url": r.get("image_url"),
      "excerpt": r.get("excerpt"),
      "tags": r.get("tags", []),
      "author": r.get("author"),
    }
    for r in rows
  ]

@router.get("/news/{news_id}")
def get_news(news_id: str):
  rows = load_all()
  item = next((r for r in rows if r.get("id") == news_id), None)
  if not item:
    raise HTTPException(status_code=404, detail="Article not found")
  return item

@router.get("/news/tags")
def list_tags():
  rows = load_all()
  tags = sorted({t for r in rows for t in r.get("tags", [])})
  return {"tags": tags}

# ---------- secured write endpoints (used by your Discord bot) ----------
@router.post("/news", status_code=201)
def create_news(payload: NewsCreate, x_api_key: str = Header(default="")):
  require_api_key(x_api_key)
  rows = load_all()
  when = payload.date or datetime.utcnow().strftime("%Y-%m-%d")
  new_id = f"{slugify(payload.title)}-{when}"
  if any(r.get("id") == new_id for r in rows):
    raise HTTPException(status_code=409, detail="Duplicate article id")

  row = {
    "id": new_id,
    "title": payload.title,
    "date": when,
    "image_url": payload.image_url,
    "excerpt": payload.excerpt or payload.content_markdown[:160],
    "content": md_to_html(payload.content_markdown),
    "tags": payload.tags,
    "author": payload.author,
  }
  rows.append(row)
  rows.sort(key=lambda r: r.get("date", ""), reverse=True)
  save_all(rows)
  return {"ok": True, "id": new_id}

@router.put("/news/{news_id}")
def update_news(news_id: str, payload: NewsCreate, x_api_key: str = Header(default="")):
  require_api_key(x_api_key)
  rows = load_all()
  idx = next((i for i, r in enumerate(rows) if r.get("id") == news_id), None)
  if idx is None:
    raise HTTPException(status_code=404, detail="Not found")
  when = payload.date or rows[idx].get("date")
  rows[idx] = {
    "id": news_id,
    "title": payload.title,
    "date": when,
    "image_url": payload.image_url,
    "excerpt": payload.excerpt or payload.content_markdown[:160],
    "content": md_to_html(payload.content_markdown),
    "tags": payload.tags,
    "author": payload.author,
  }
  rows.sort(key=lambda r: r.get("date", ""), reverse=True)
  save_all(rows)
  return {"ok": True, "id": news_id}
