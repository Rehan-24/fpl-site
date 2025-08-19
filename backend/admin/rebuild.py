# backend/admin/rebuild.py
import os, sys, subprocess
from fastapi import APIRouter, Header, HTTPException, Query

router = APIRouter()
ADMIN_KEY = os.getenv("API_KEY", "")

@router.post("/admin/rebuild")
def admin_rebuild(
    api_key: str = Header(default=""),
    league: str | None = Query(default=None)   # e.g. "premier" or "championship" if you support per-league rebuilds
):
    if ADMIN_KEY and api_key != ADMIN_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Pick the script that does the rebuild. Replace with your real script if different.
    here = os.path.dirname(__file__)
    # example #1: your ingest script (keeps history, etc.)
    candidate_1 = os.path.abspath(os.path.join(here, "..", "scripts", "ingest_h2h.py"))
    # example #2: fallback to seeder (if you still rebuild from JSON)
    candidate_2 = os.path.abspath(os.path.join(here, "..", "tools", "seed_from_json_final.py"))
    script = candidate_1 if os.path.exists(candidate_1) else candidate_2

    if not os.path.exists(script):
        raise HTTPException(status_code=500, detail="No rebuild script found")

    if not os.getenv("SUPABASE_DB_URL"):
        raise HTTPException(status_code=500, detail="SUPABASE_DB_URL not configured")

    cmd = [sys.executable, script]
    if league:
        cmd += ["--league", league]  # only if your script supports it

    try:
        out = subprocess.check_output(cmd, stderr=subprocess.STDOUT, text=True, timeout=300)
        return {"ok": True, "log": out[-4000:]}  # return tail of logs for UI
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Rebuild failed: {e.output[-4000:]}")
