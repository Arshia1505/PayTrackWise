from fastapi import FastAPI

app = FastAPI(
    title="FinShield API",
    description="Personal Finance Management Platform",
    version="1.0.0"
)

@app.get("/")
def root():
    return {
        "message": "Welcome to FinShield API",
        "status": "running"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }
