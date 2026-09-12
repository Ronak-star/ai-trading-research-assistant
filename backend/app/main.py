from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import research
from app.config import settings

app = FastAPI(
    title="AI Trading Research Assistant API",
    description="ASK -> CLARIFY -> DEFINE -> TEST -> LEARN research prototype backend.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/health")
def health():
    return {"status": "ok", "ai_provider": settings.AI_PROVIDER}


app.include_router(research.router)
