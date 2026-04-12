from fastapi import FastAPI
from routers import analyze, index, health
from db.database import engine, Base

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Slop Guardian Analysis Engine", version="1.0.0")

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(analyze.router, prefix="/analyze", tags=["analyze"])
app.include_router(index.router, prefix="/index-repo", tags=["index"])

@app.get("/")
async def root():
    return {"message": "AI Slop Guardian Analysis Engine API"}
