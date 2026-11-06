"""FastAPI application. Run with: uv run uvicorn api.main:app --reload"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .core.config import CORS_ORIGINS
from .modules import ROUTERS

app = FastAPI(title="CSST106 Labs API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_methods=["*"], allow_headers=["*"])


class Health(BaseModel):
    status: str


@app.get("/api/health", operation_id="getHealth")
def health() -> Health:
    return Health(status="ok")


for router in ROUTERS:
    app.include_router(router, prefix="/api")
