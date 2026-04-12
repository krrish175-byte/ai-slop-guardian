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

class SurgeEvent(Base):
    __tablename__ = "surge_events"
    id = Column(Integer, primary_key=True, index=True)
    repo_id = Column(String, index=True)
    contributor_login = Column(String, index=True)
    event_type = Column(String) # "contributor_surge" or "repo_flood"
    timestamp = Column(DateTime, default=datetime.utcnow)

class Challenge(Base):
    __tablename__ = "challenges"
    id = Column(Integer, primary_key=True, index=True)
    challenge_id = Column(String, unique=True, index=True)
    repo_id = Column(String, index=True)
    pr_number = Column(Integer)
    questions = Column(JSON)
    status = Column(String, default="pending") # "pending", "passed", "failed", "expired"
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

class TrustRelationship(Base):
    __tablename__ = "trust_relationships"
    id = Column(Integer, primary_key=True, index=True)
    voucher = Column(String, index=True)
    vouched = Column(String, index=True)
    repo_id = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
