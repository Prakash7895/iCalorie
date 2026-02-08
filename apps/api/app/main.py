from fastapi import FastAPI
from app.routers.scan import router as scan_router

app = FastAPI(title="iCalorie API", version="0.1.0")

app.include_router(scan_router)


@app.get("/health")
def health():
    return {"status": "ok"}
