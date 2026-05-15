from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import TrustRelationship, AnalysisResult
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class TrustRequest(BaseModel):
    source_login: str
    target_login: str
    relationship_type: str  # "verified_by", "collaborated_on", "mentored_by"


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
    results = (
        db.query(AnalysisResult)
        .filter(AnalysisResult.repo_id == repo_id)
        .all()
    )
    contributors = list({r.author for r in results})

    # 2. Get trust relationships involving these contributors
    rels = (
        db.query(TrustRelationship)
        .filter(
            (TrustRelationship.source_login.in_(contributors))
            | (TrustRelationship.target_login.in_(contributors))
        )
        .all()
    )

    nodes = [
        {"id": c, "label": c, "val": 1} for c in contributors
    ]
    links = [
        {
            "source": r.source_login,
            "target": r.target_login,
            "type": r.relationship_type,
        }
        for r in rels
    ]

    return {"nodes": nodes, "links": links}


@router.get("/history/{username:path}")
async def get_trust_history(
    username: str,
    repo_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(AnalysisResult).filter(AnalysisResult.author == username)
    if repo_id:
        query = query.filter(AnalysisResult.repo_id == repo_id)

    results = query.order_by(AnalysisResult.timestamp.asc()).all()

    history = [
        {
            "date": result.timestamp.isoformat() if result.timestamp else None,
            "trust_score": result.contributor_trust_score,
            "repo_id": result.repo_id,
            "pr_number": result.pr_number,
        }
        for result in results
        if result.timestamp is not None
    ]

    return {
        "username": username,
        "history": history,
        "count": len(history),
    }
