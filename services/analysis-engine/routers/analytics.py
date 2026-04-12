from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from db.database import get_db
from db.models import AnalysisResult

router = APIRouter()

@router.get("/{repo_id:path}/slop-rate")
async def get_slop_rate(repo_id: str, db: Session = Depends(get_db)):
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    # Query results for this repo in last 30 days
    results = db.query(AnalysisResult).filter(
        AnalysisResult.repo_id == repo_id,
        AnalysisResult.timestamp >= thirty_days_ago
    ).all()
    
    if not results:
        return {"score": 0, "label": "no data", "color": "inactive"}
    
    total = len(results)
    slop_count = len([r for r in results if r.overall_score > 0.6])
    slop_rate = (slop_count / total) * 100
    
    if slop_rate < 20:
        label = f"slop free: {int(slop_rate)}%"
        color = "brightgreen"
    elif slop_rate <= 50:
        label = f"slop rate: {int(slop_rate)}%"
        color = "yellow"
    else:
        label = f"high slop: {int(slop_rate)}%"
        color = "red"
        
    return {
        "score": slop_rate,
        "label": label,
        "color": color,
        "total_scans": total,
        "slop_count": slop_count
    }

@router.get("/{repo_id:path}/burnout")
async def get_burnout_stats(repo_id: str, db: Session = Depends(get_db)):
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    # Query results for this repo in last 30 days
    results = db.query(AnalysisResult).filter(
        AnalysisResult.repo_id == repo_id,
        AnalysisResult.timestamp >= thirty_days_ago
    ).all()
    
    avg_review_time_minutes = 15
    slop_prs_count = len([r for r in results if r.overall_score > 0.6])
    hours_wasted = (slop_prs_count * avg_review_time_minutes) / 60
    projected_annual = hours_wasted * (365/30)
    
    if projected_annual < 50:
        risk = "low"
    elif projected_annual < 200:
        risk = "medium"
    elif projected_annual < 500:
        risk = "high"
    else:
        risk = "critical"
        
    return {
        "hours_wasted_month": round(hours_wasted, 1),
        "slop_prs_month": slop_prs_count,
        "total_prs_month": len(results),
        "projected_hours_annual": round(projected_annual, 1),
        "burnout_risk": risk,
        "repo_id": repo_id
    }
