from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from backend_db import list_news, get_news_detail

router = APIRouter()
API_KEY = os.getenv("NEWS_API_KEY", "")

@router.get("/news")
def list_news_api():
    return list_news()

@router.get("/news/{id}")
def detail_news_api(id: str):
    row = get_news_detail(id)
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    return row
