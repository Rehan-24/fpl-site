from fastapi import FastAPI, Query, Header, HTTPException, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from managers.index import router as managers_router
from news.index import router as news_router

import os
import json
import subprocess
import time
from typing import Optional
import hashlib, re, requests, datetime
import pandas as pd
import math
import pandas as pd

def _to_json_safe(v):
    # Treat pandas/float NaN/inf as None; stringify other weirds
    try:
        if v is None:
            return None
        # pandas-friendly check
        if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
            return None
        if pd.isna(v):  # catches numpy/pandas NaN
            return None
        return v
    except Exception:
        return None

app = FastAPI()

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Static ---
app.mount("/static", StaticFiles(directory="static"), name="static")

# --- Config ---
BASE_DIR = os.path.dirname(__file__)
RESULTS_DIR = os.path.join(BASE_DIR, "results")
LATEST_DIR = os.path.join(RESULTS_DIR, "latest")
os.makedirs(LATEST_DIR, exist_ok=True)

ADMIN_KEY = os.environ.get("API_KEY", "")
SCRIPT_PATH = os.path.join(BASE_DIR, "src", "fpl_management.py")
# The script is expected to write this Excel file per league:
EXCEL_NAME_TEMPLATE = "{league}_results_v3.xlsx"

# --- Routers ---
app.include_router(managers_router, prefix="/api")
app.include_router(news_router, prefix="/api")


# --- Auth helper ---
def require_admin(x_api_key: str = Header("")):
    if not ADMIN_KEY or x_api_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="forbidden")


# --- Helpers ---
def excel_path_for_league(league: str) -> str:
    # Prefer backend/results, fall back to backend/src/results
    primary = os.path.join(RESULTS_DIR, EXCEL_NAME_TEMPLATE.format(league=league))
    fallback = os.path.join(BASE_DIR, "src", "results", EXCEL_NAME_TEMPLATE.format(league=league))
    return primary if os.path.exists(primary) else fallback

def latest_json_path_for_league(league: str) -> str:
    return os.path.join(LATEST_DIR, f"{league}.json")

def run_management_script(league: str, gw: Optional[int] = None) -> None:
    # Calls the fpl_management.py script.
    # - If gw is provided: python src/fpl_management.py <league> <gw> -o
    # - Else:               python src/fpl_management.py <league> -o
    
    if not os.path.isfile(SCRIPT_PATH):
        raise RuntimeError(f"Script not found at {SCRIPT_PATH}")

    # Run from src/ so relative imports/paths resolve
    cmd = ["python", "fpl_management.py", league]
    if gw is not None:
        cmd.append(str(gw))
    cmd.append("-o")

    subprocess.run(cmd, check=True, cwd=os.path.join(BASE_DIR, "src"))


def excel_to_latest_json(league: str, preferred_sheet: Optional[str] = None) -> dict:
    xlsx = excel_path_for_league(league)
    if not os.path.exists(xlsx):
        raise FileNotFoundError(f"Excel not found: {xlsx}")

    xls = pd.ExcelFile(xlsx)

    # If a preferred sheet is provided and exists, use it first
    if preferred_sheet and preferred_sheet in xls.sheet_names:
        sheet_name = preferred_sheet
    else:
        # choose the highest-numbered GW sheet
        gw_sheets = []
        for name in xls.sheet_names:
            m = re.fullmatch(r"GW(\d+)", str(name).strip())
            if m:
                gw_sheets.append((int(m.group(1)), name))
        sheet_name = sorted(gw_sheets, key=lambda t: t[0])[-1][1] if gw_sheets else xls.sheet_names[-1]

    # Your sheet is written starting at row 2 (header row index 1); drop Unnamed cols
    df = pd.read_excel(xlsx, sheet_name=sheet_name, header=1, engine="openpyxl")
    df = df.loc[:, ~df.columns.astype(str).str.startswith("Unnamed")]

    # Sort like the sheet, then add Position
    df_sorted = df.sort_values(by=["Points", "Score"], ascending=[False, False]).reset_index(drop=True)
    df_sorted.insert(0, "Position", range(1, len(df_sorted) + 1))
    
    rows = []
    for rec in df_sorted.to_dict(orient="records"):
        rows.append({k: _to_json_safe(v) for k, v in rec.items()})

    out_path = latest_json_path_for_league(league)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump({
            "league": league,
            "sheet": sheet_name,
            "generated_at": time.time(),
            "rows": rows
        }, f, ensure_ascii=False)


    def _to_native(v):
        try:
            s = str(v)
            if s.strip() == "":
                return ""
            if s.replace(".", "", 1).replace("-", "", 1).isdigit():
                return float(s) if "." in s else int(s)
            return v
        except Exception:
            return v

    rows = [{k: _to_native(v) for k, v in rec.items()} for rec in df_sorted.to_dict(orient="records")]

    out_path = latest_json_path_for_league(league)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump({
            "league": league,
            "sheet": sheet_name,
            "generated_at": time.time(),
            "rows": rows
        }, f, ensure_ascii=False)

    return {"league": league, "sheet": sheet_name, "rows": rows}


    out_path = latest_json_path_for_league(league)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)

    return data

def fetch_current_gw() -> int:
    
    # Ask FPL for the current GW. Prefer `is_current`, then `is_next`,
    # else fallback to the highest event whose deadline has passed.
    
    r = requests.get("https://fantasy.premierleague.com/api/bootstrap-static/", timeout=10)
    r.raise_for_status()
    j = r.json()
    events = j.get("events", [])
    # 1) is_current
    for e in events:
        if e.get("is_current"):
            return int(e["id"])
    # 2) is_next
    for e in events:
        if e.get("is_next"):
            return int(e["id"])
    # 3) fallback by deadline time
    now = datetime.datetime.utcnow()
    past = []
    for e in events:
        dt = e.get("deadline_time")
        if not dt:
            continue
        try:
            # deadline_time is ISO8601 in UTC, e.g. "2025-08-15T17:30:00Z"
            # strip 'Z' if present
            if dt.endswith("Z"):
                dt = dt[:-1]
            dtu = datetime.datetime.fromisoformat(dt)
            if dtu <= now:
                past.append((int(e["id"]), dtu))
        except Exception:
            continue
    if past:
        return sorted(past, key=lambda t: t[0])[-1][0]
    # worst case
    return 1

def resolve_gw_param(gw_param: Optional[str]) -> int:
    """
    Accepts None / "auto" / "current" / "" to mean current GW.
    Accepts a numeric string like "1" -> 1.
    """
    if gw_param is None:
        return fetch_current_gw()
    s = str(gw_param).strip().lower()
    if s in {"", "auto", "current"}:
        return fetch_current_gw()
    if not s.isdigit():
        raise HTTPException(status_code=400, detail="gw must be an integer, 'auto', or 'current'")
    return int(s)

def _sanitize(obj):
    if isinstance(obj, dict):
        return {k: _sanitize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize(x) for x in obj]
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
    try:
        if pd.isna(obj):
            return None
    except Exception:
        pass
    return obj

# --- API: Standings (serve prebuilt JSON) ---
@app.get("/api/standings")
def get_standings(request: Request, league: str = Query("premier")):
    path = os.path.join(LATEST_DIR, f"{league}.json")
    if not os.path.exists(path):
        return {"error": f"missing {league}.json"}

    mtime = os.path.getmtime(path)
    last_modified_http = time.strftime("%a, %d %b %Y %H:%M:%S GMT", time.gmtime(mtime))
    stat = os.stat(path)
    etag = f'W/"{hashlib.md5(f"{stat.st_mtime_ns}-{stat.st_size}".encode()).hexdigest()}"'

    inm = request.headers.get("If-None-Match")
    ims = request.headers.get("If-Modified-Since")
    if inm == etag or (ims and ims == last_modified_http):
        return Response(status_code=304)

    with open(path, "r", encoding="utf-8") as f:
        payload = json.load(f)

    payload = _sanitize(payload)  # <-- sanitize here

    resp = JSONResponse({"updated_at": mtime, "league": league, "data": payload})
    resp.headers["ETag"] = etag
    resp.headers["Last-Modified"] = last_modified_http
    resp.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=120"
    return resp



# --- API: Generate Excel on demand (legacy) ---
@app.get("/api/generate")
def generate_excel(league: str = Query("premier"), gw: int = Query(38)):
    try:
        run_management_script(league, gw)
        xlsx = excel_path_for_league(league)
        if os.path.exists(xlsx):
            return {"message": "Excel generated", "file": os.path.basename(xlsx)}
        return {"error": "Excel file not generated"}
    except subprocess.CalledProcessError as e:
        return {"error": f"Script failed: {str(e)}"}
    except Exception as e:
        return {"error": str(e)}


# --- API: Download Excel ---
@app.get("/api/download")
def download_excel(file: str = Query(...)):
    path = os.path.join(RESULTS_DIR, file)
    if not os.path.isfile(path):
        return JSONResponse(status_code=404, content={"error": "File not found"})
    return FileResponse(path, filename=file)


# --- API: Admin rebuild (runs script -> writes latest JSON) ---
@app.post("/api/admin/rebuild")
def admin_rebuild(
    league: str = Query("premier"),
    gw: Optional[str] = Query(None),  # accept "auto", "current", or a number as string
    _: None = Depends(require_admin),
):
    try:
        # Resolve GW
        resolved_gw: Optional[int]
        if gw is None or str(gw).lower() in {"auto", "current", ""}:
            resolved_gw = fetch_current_gw()
        else:
            # numeric string -> int
            if not str(gw).isdigit():
                raise HTTPException(status_code=400, detail="gw must be an integer, 'auto', or 'current'")
            resolved_gw = int(gw)

        # 1) Run script for that GW
        run_management_script(league, resolved_gw)

        # 2) Convert the specific GW sheet to JSON (so UI matches the run)
        data = excel_to_latest_json(league, preferred_sheet=f"GW{resolved_gw}")

        return {
            "status": "ok",
            "league": league,
            "gw": resolved_gw,
            "json_path": f"/backend/results/latest/{league}.json",
            "rows": len(data.get("rows", [])),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/api/admin/rebuild-all")
def admin_rebuild_all(
    leagues: str = Query("premier,championship"),
    gw: Optional[str] = Query(None),  # accepts None/"auto"/"current"/""
    _: None = Depends(require_admin),
):
    """
    Rebuild multiple leagues for a specific GW or the current GW.
    - leagues: comma-separated list, e.g. "premier,championship"
    - gw: int as string OR 'auto'/'current'/'' (defaults to current GW)
    """
    try:
        resolved_gw = resolve_gw_param(gw)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"invalid gw: {e}")

    leagues_list = [l.strip() for l in leagues.split(",") if l.strip()]
    if not leagues_list:
        raise HTTPException(status_code=400, detail="no leagues provided")

    results = {}
    for lg in leagues_list:
        try:
            # 1) Run the script for that GW
            run_management_script(lg, resolved_gw)

            # 2) Convert specifically the GW sheet we just built (e.g., "GW7")
            data = excel_to_latest_json(lg, preferred_sheet=f"GW{resolved_gw}")

            results[lg] = {
                "status": "ok",
                "gw": resolved_gw,
                "rows": len(data.get("rows", [])),
            }
        except Exception as e:
            results[lg] = {"status": "error", "gw": resolved_gw, "error": str(e)}

    return {
        "status": "ok",
        "gw": resolved_gw,
        "results": results,
    }
    
# PUBLIC rebuild: no API key, optional gw; omitting gw lets script choose "current"
@app.post("/api/rebuild")
def public_rebuild(league: str = Query("premier"), gw: Optional[int] = Query(None)):
    try:
        # Resolve GW
        resolved_gw: Optional[int]
        if gw is None or str(gw).lower() in {"auto", "current", ""}:
            resolved_gw = fetch_current_gw()
        else:
            # numeric string -> int
            if not str(gw).isdigit():
                raise HTTPException(status_code=400, detail="gw must be an integer, 'auto', or 'current'")
            resolved_gw = int(gw)

        # 1) Run script for that GW
        run_management_script(league, resolved_gw)

        # 2) Convert the specific GW sheet to JSON (so UI matches the run)
        data = excel_to_latest_json(league, preferred_sheet=f"GW{resolved_gw}")

        return {
            "status": "ok",
            "league": league,
            "gw": resolved_gw,
            "json_path": f"/backend/results/latest/{league}.json",
            "rows": len(data.get("rows", [])),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
def health():
    payload = {}
    for lg in ["premier", "championship"]:
        p = latest_json_path_for_league(lg)
        payload[lg] = {
            "exists": os.path.exists(p),
            "updated_at": os.path.getmtime(p) if os.path.exists(p) else None,
        }
    # NEW: show if admin key is present (length only)
    payload["admin_key_set"] = bool(ADMIN_KEY)
    payload["admin_key_len"] = len(ADMIN_KEY or "")
    return payload
