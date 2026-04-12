from routers import analyze, index, health
from db.database import engine, Base, SessionLocal
from db.models import SurgeEvent
from pydantic import BaseModel

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Slop Guardian Analysis Engine", version="1.0.0")

class SurgeRecord(BaseModel):
    repo_id: str
    contributor_login: str
    event_type: str

@app.post("/surge")
async def record_surge(record: SurgeRecord):
    db = SessionLocal()
    try:
        event = SurgeEvent(
            repo_id=record.repo_id,
            contributor_login=record.contributor_login,
            event_type=record.event_type
        )
        db.add(event)
        db.commit()
        return {"status": "recorded"}
    finally:
        db.close()

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(analyze.router, prefix="/analyze", tags=["analyze"])
app.include_router(index.router, prefix="/index-repo", tags=["index"])

@app.get("/")
async def root():
    return {"message": "AI Slop Guardian Analysis Engine API"}
