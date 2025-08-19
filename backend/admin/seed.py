# backend/admin/seed.py
import os, json
from fastapi import APIRouter, Header, HTTPException
from seed_from_json_patched import main as run_seed

router = APIRouter()
ADMIN_KEY = os.getenv("API_KEY","")

@router.post("/admin/seed")
def admin_seed(api_key: str = Header(default="")):
    if api_key != ADMIN_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")
    run_seed()
    return {"ok": True}
