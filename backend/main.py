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
import hashlib, re
import pandas as pd

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


def excel_to_latest_json(league: str) -> dict:
    xlsx = excel_path_for_league(league)
    if not os.path.exists(xlsx):
        raise FileNotFoundError(f"Excel not found: {xlsx}")

    xls = pd.ExcelFile(xlsx)
    sheet_name = None

    # Prefer the highest-numbered GW sheet
    gw_sheets = []
    for name in xls.sheet_names:
        m = re.fullmatch(r"GW(\d+)", str(name).strip())
        if m:
            gw_sheets.append((int(m.group(1)), name))
    if gw_sheets:
        sheet_name = sorted(gw_sheets, key=lambda t: t[0])[-1][1]
    else:
        # fall back to last sheet if no GW sheets
        sheet_name = xls.sheet_names[-1] if xls.sheet_names else None

    if not sheet_name:
        raise RuntimeError("No usable sheets found in Excel output")

    df = pd.read_excel(xlsx, sheet_name=sheet_name)

    data = {
        "league": league,
        "sheet": sheet_name,
        "rows": df.to_dict(orient="records"),
        "generated_at": time.time(),
    }

    out_path = latest_json_path_for_league(league)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)

    return data

# --- API: Standings (serve prebuilt JSON) ---
@app.get("/api/standings")
def get_standings(request: Request, league: str = Query("premier")):
    path = os.path.join(LATEST_DIR, f"{league}.json")
    if not os.path.exists(path):
        return {"error": f"missing {league}.json"}

    mtime = os.path.getmtime(path)
    last_modified_http = time.strftime("%a, %d %b %Y %H:%M:%S GMT", time.gmtime(mtime))

    # cheap etag = md5(file mtime + size)
    stat = os.stat(path)
    etag = f'W/"{hashlib.md5(f"{stat.st_mtime_ns}-{stat.st_size}".encode()).hexdigest()}"'

    # Conditional headers
    inm = request.headers.get("If-None-Match")
    ims = request.headers.get("If-Modified-Since")
    if inm == etag or (ims and ims == last_modified_http):
        return Response(status_code=304)

    with open(path, "r", encoding="utf-8") as f:
        payload = json.load(f)

    resp = JSONResponse({
        "updated_at": mtime,
        "league": league,
        "data": payload
    })
    # cache headers (frontends can recheck; CDNs can hold briefly)
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
    gw: Optional[int] = Query(None),
    _: None = Depends(require_admin),
):
    try:
        # 1) Run script to refresh Excel
        run_management_script(league, gw)

        # 2) Convert Excel -> latest JSON
        data = excel_to_latest_json(league)

        return {
            "status": "ok",
            "league": league,
            "gw": gw,
            "json_path": f"/backend/results/latest/{league}.json",
            "rows": len(data.get("rows", [])),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/admin/rebuild-all")
def admin_rebuild_all(
    leagues: str = Query("premier,championship"),
    gw: Optional[int] = Query(None),
    _: None = Depends(require_admin),
):
    """
    leagues: comma-separated list, e.g. "premier,championship"
    """
    leagues_list = [l.strip() for l in leagues.split(",") if l.strip()]
    results = {}
    for lg in leagues_list:
        try:
            run_management_script(lg, gw)
            data = excel_to_latest_json(lg)
            results[lg] = {"status": "ok", "rows": len(data.get("rows", []))}
        except Exception as e:
            results[lg] = {"status": "error", "error": str(e)}
    return results


# --- API: Health/meta ---
@app.get("/api/health")
def health():
    payload = {}
    for lg in ["premier", "championship"]:
        p = latest_json_path_for_league(lg)
        payload[lg] = {
            "exists": os.path.exists(p),
            "updated_at": os.path.getmtime(p) if os.path.exists(p) else None,
        }
    return payload
