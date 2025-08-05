from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

import pandas as pd
import os
import json
import subprocess

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

RESULTS_DIR = "results"
DATA_DIR = "data"
TEST_MODE = True  # Change to False to use real script later

@app.get("/api/standings")
def get_standings(league: str = Query("premier")):
    if TEST_MODE:
        test_path = os.path.join(DATA_DIR, f"{league}_gw38.json")
        try:
            with open(test_path, "r") as f:
                return json.load(f)
        except Exception as e:
            return {"error": str(e)}

    excel_path = f"{RESULTS_DIR}/{league}_results_v3.xlsx"
    try:
        df = pd.read_excel(excel_path, sheet_name=0, header=1)
        df = df.dropna(how='all')
        return df.fillna("").to_dict(orient="records")
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/generate")
def generate_excel(league: str = Query("premier"), gw: int = Query(38)):
    try:
        script_path = os.path.join("src", "fpl_management.py")
        command = ["python", script_path, league, str(gw), "-o"]
        subprocess.run(command, check=True)

        filename = f"{league}_results_v3.xlsx"
        filepath = os.path.join(RESULTS_DIR, filename)

        if os.path.exists(filepath):
            return {"message": "Excel generated", "file": filename}
        else:
            return {"error": "Excel file not generated"}
    except subprocess.CalledProcessError as e:
        return {"error": f"Script failed: {str(e)}"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/download")
def download_excel(file: str = Query(...)):
    path = os.path.join(RESULTS_DIR, file)
    if not os.path.isfile(path):
        return JSONResponse(status_code=404, content={"error": "File not found"})
    return FileResponse(path, filename=file)
