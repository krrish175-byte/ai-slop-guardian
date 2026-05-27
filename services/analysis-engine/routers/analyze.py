from fastapi import APIRouter, Depends, Request
from limiter import limiter
from sqlalchemy.orm import Session
from models.schemas import AnalyzeRequest, AnalyzeResponse
from detectors.ensemble import EnsembleDetector
from scorer.contributor import ContributorScorer
from db.database import get_db
from db.models import AnalysisResult

router = APIRouter()
ensemble = EnsembleDetector()
scorer = ContributorScorer()


@router.post("/", response_model=AnalyzeResponse)
@limiter.limit("5/minute")
async def analyze(request: Request, payload: AnalyzeRequest, db: Session = Depends(get_db)):
    # 1. Run ensemble detection
    response = await ensemble.analyze(
        content=payload.content,
        repo_id=payload.repo_id,
        history=payload.history
    )

    # 2. Run contributor scoring
    # Placeholder logic - ideally Node.js sends the data
    # For now, we use dummy data if not provided
    dummy_contributor_data = {
        "login": payload.contributor_login,
        "is_first_time": True,
        "total_commits": 5,
        "created_at": "2024-01-01T00:00:00Z"
    }
    trust_res = scorer.calculate_trust_score(dummy_contributor_data)
    response.contributor_trust_score = trust_res["score"]

    # 3. Save to database
    db_result = AnalysisResult(
        repo_id=payload.repo_id,
        pr_number=0,  # Would be sent in a real scenario
        author=payload.contributor_login,
        overall_score=response.overall_score,
        label=response.label,
        confidence=response.confidence,
        details=[d.dict() for d in response.detectors]
    )
    db.add(db_result)
    db.commit()

    # 4. Add to DNA index for future cross-repo matching
    from detectors.dna import DNADetector
    for d in ensemble.detectors:
        if isinstance(d, DNADetector):
            d.add_to_index(payload.content)
            break

    return response
