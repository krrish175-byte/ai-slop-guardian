from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from routers import (  # noqa: E402
    analyze,
    index,
    health,
    analytics,
    challenge,
    review,
    trust,
)
from utils.limiter import limiter
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

app = FastAPI(title="AI Slop Guardian Analysis Engine", version="2.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(analyze.router, prefix="/analyze", tags=["analyze"])
app.include_router(index.router, prefix="/index-repo", tags=["index"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
app.include_router(challenge.router, prefix="/challenge", tags=["challenge"])
app.include_router(review.router, prefix="/review", tags=["review"])
app.include_router(trust.router, prefix="/trust", tags=["trust"])


@app.on_event("startup")
async def warmup():
    from detectors.ensemble import EnsembleDetector
    detector = EnsembleDetector()
    await detector.analyze("warmup text to preload models", "warmup/repo")
    print("Models warmed up and ready")


@app.get("/")
async def root():
    return {"status": "AI Slop Guardian v2 running"}
