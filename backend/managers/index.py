# backend/managers/index.py
from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any
import os, json

router = APIRouter()

DATA_FILE = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "data", "managers.json")
)

ALLOWED_FIELDS = {"bio", "favorite_club", "social_url", "image_url"}

def _load_all():
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not load managers.json: {e}")

def _save_all(all_rows):
    try:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(all_rows, f, ensure_ascii=False, indent=2)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save managers.json: {e}")

@router.get("/managers")
def get_managers(owner: str = None):
    managers = _load_all()
    if owner:
        owner_lc = owner.lower()
        match = next((m for m in managers if str(m.get("name", "")).lower() == owner_lc), None)
        if not match:
            raise HTTPException(status_code=404, detail="Manager not found")
        return match
    return managers

@router.get("/user/{id}")
def get_user(id: str):
    managers = _load_all()
    id = id.strip()
    
    user = next(
        (
            m for m in managers 
            if str(m.get("discord_id", "")).strip() == id
            or str(m.get("name", "")).strip().lower() == id.lower()
        ),
        None
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/user/{id}")
def update_user(id: str, updates: Dict[str, Any] = Body(...)):
    """
    Update a manager by discord_id.
    Allowed fields: bio, favorite_club, social_url, image_url.
    """
    if not isinstance(updates, dict):
        raise HTTPException(status_code=400, detail="Payload must be a JSON object")

    filtered = {k: v for k, v in updates.items() if k in ALLOWED_FIELDS}
    if not filtered:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    managers = _load_all()
    id = id.strip()

    idx = next(
        (
            i for i, m in enumerate(managers)
            if str(m.get("discord_id", "")).strip() == id
            or str(m.get("name", "")).strip().lower() == id.lower()
        ),
        None
    )
    if idx is None:
        raise HTTPException(status_code=404, detail="User not found")

    managers[idx].update(filtered)
    _save_all(managers)

    return {"ok": True, "updated": filtered, "user": managers[idx]}

@router.get("/username/{name}")
def get_user(name: str):
    managers = _load_all()
    name_str = str(name).strip()
    user = next(
        (m for m in managers if str(m.get("name", "")).strip() == name_str),
        None
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/username/{name}")
def update_user(name: str, updates: Dict[str, Any] = Body(...)):
    """
    Update a manager by name.
    Allowed fields: bio, favorite_club, social_url, image_url.
    """
    if not isinstance(updates, dict):
        raise HTTPException(status_code=400, detail="Payload must be a JSON object")

    filtered = {k: v for k, v in updates.items() if k in ALLOWED_FIELDS}
    if not filtered:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    managers = _load_all()
    name_str = str(name).strip()
    idx = next(
        (i for i, m in enumerate(managers)
         if str(m.get("name", "")).strip() == name_str),
        None
    )
    if idx is None:
        raise HTTPException(status_code=404, detail="User not found")

    managers[idx].update(filtered)
    _save_all(managers)

    return {"ok": True, "updated": filtered, "user": managers[idx]}