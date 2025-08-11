from fastapi import APIRouter, HTTPException
import os, json

router = APIRouter()

DATA_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "news.json"))

def _load_all():
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed loading news: {e}")

@router.get("/news")
def list_news():
    # newest first
    rows = sorted(_load_all(), key=lambda r: r.get("date",""), reverse=True)
    # list endpoint returns a lighter payload for performance
    return [
        {
            "id": r.get("id"),
            "title": r.get("title"),
            "date": r.get("date"),
            "image_url": r.get("image_url"),
            "excerpt": r.get("excerpt"),
            "tags": r.get("tags", [])
        } for r in rows
    ]

@router.get("/news/{news_id}")
def get_news(news_id: str):
    rows = _load_all()
    match = next((r for r in rows if str(r.get("id")) == news_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Article not found")
    return match
