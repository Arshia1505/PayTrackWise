import urllib.error
import urllib.request

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.db import init_db
from app.services.ollama import OLLAMA_HOST, OLLAMA_MODEL

app = FastAPI(
    title="FinShield API",
    description="Accounts, onboarding, and transactions for PayTrackWise.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/")
def root():
    return {"message": "FinShield API", "status": "running"}


@app.get("/health")
def health_check():
    reachable = False
    try:
        with urllib.request.urlopen(f"{OLLAMA_HOST}/api/tags", timeout=1) as response:
            reachable = response.status == 200
    except (urllib.error.URLError, TimeoutError, OSError):
        reachable = False
    return {
        "status": "healthy",
        "storage": "sqlite",
        "ollama": reachable,
        "model": OLLAMA_MODEL,
    }
