from fastapi import APIRouter, HTTPException, Body, Query
from typing import Dict, Any, Optional
from backend_db import fetch_manager_by_owner, fetch_all_managers, update_manager_fields

router = APIRouter()

@router.get("/managers")
def managers(owner: Optional[str] = Query(default=None)):
    if owner:
        row = fetch_manager_by_owner(owner)
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        return row
    return fetch_all_managers()

@router.post("/managers/update")
def update_manager(owner: str = Query(...), updates: Dict[str, Any] = Body(...)):
    ok = update_manager_fields(owner, updates)
    if not ok:
        raise HTTPException(status_code=400, detail="No valid fields to update or owner not found")
    return { "ok": True }
