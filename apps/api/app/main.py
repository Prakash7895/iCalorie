from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.scan import router as scan_router
from app.routers.log import router as log_router
from app.services.storage import ensure_bucket
from app.db import init_db

app = FastAPI(
    title="iCalorie API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scan_router)
app.include_router(log_router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.on_event("startup")
def startup():
    ensure_bucket()
    init_db()
