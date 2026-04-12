from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from datetime import datetime
from db.database import Base

class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    repo_id = Column(String, index=True)
    pr_number = Column(Integer, index=True)
    author = Column(String)
    overall_score = Column(Float)
    label = Column(String)
    confidence = Column(Float)
    details = Column(JSON)  # Store detector results
    timestamp = Column(DateTime, default=datetime.utcnow)
