from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import TrustRelationship, AnalysisResult
from pydantic import BaseModel
from typing import List
from datetime import datetime

router = APIRouter()

class TrustRequest(BaseModel):
    source_login: str
    target_login: str
    relationship_type: str # "verified_by", "collaborated_on", "mentored_by"

@router.post("/add")
async def add_trust(request: TrustRequest, db: Session = Depends(get_db)):
    rel = TrustRelationship(
        source_login=request.source_login,
        target_login=request.target_login,
        relationship_type=request.relationship_type
    )
    db.add(rel)
    db.commit()
    return {"status": "success"}

@router.get("/graph/{repo_id:path}")
async def get_trust_graph(repo_id: str, db: Session = Depends(get_db)):
    # 1. Get all contributors for this repo from analysis results
    results = db.query(AnalysisResult).filter(AnalysisResult.repo_id == repo_id).all()
    contributors = list(set([r.author for r in results]))
    
    # 2. Get trust relationships involving these contributors
    rels = db.query(TrustRelationship).filter(
        (TrustRelationship.source_login.in_(contributors)) | 
        (TrustRelationship.target_login.in_(contributors))
    ).all()
    
    nodes = [{"id": c, "label": c, "val": 1} for c in contributors]
    links = [{"source": r.source_login, "target": r.target_login, "type": r.relationship_type} for r in rels]
    
    return {"nodes": nodes, "links": links}
