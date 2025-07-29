from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Backend is running"}

@app.get("/api/kpis")
def get_kpis():
    return {
        "estimated_savings": 2500000,
        "open_appeals": 42,
        "upcoming_deadlines": 8,
        "appeals_won": 156
    }

@app.get("/api/settings")
def get_settings():
    return {
        "firm_name": "CHARLY, Inc.",
        "license": "TX-678910",
        "narrative_defaults": {}
    }