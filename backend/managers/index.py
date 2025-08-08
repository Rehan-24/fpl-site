# backend/managers/index.py
from fastapi import APIRouter, HTTPException
import os, json

router = APIRouter()

@router.get("/managers")
def get_managers(owner: str = None):
    managers_file = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "data", "managers.json")
    )
    print("Loading managers from:", managers_file)
    try:
        with open(managers_file, "r", encoding="utf-8") as f:
            managers = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not load managers.json: {e}")

    if owner:
        owner_lc = owner.lower()
        match = next((m for m in managers if m["name"].lower() == owner_lc), None)
        if not match:
            raise HTTPException(status_code=404, detail="Manager not found")
        return match

    return managers
