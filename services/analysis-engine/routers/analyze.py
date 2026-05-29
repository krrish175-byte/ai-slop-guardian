from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models.schemas import AnalyzeRequest, AnalyzeResponse
from detectors.ensemble import EnsembleDetector
from scorer.contributor import ContributorScorer
from db.database import get_db
from db.models import AnalysisResult
import hashlib
import time
import asyncio
from typing import Dict, Tuple, Optional

router = APIRouter()
ensemble = EnsembleDetector()
scorer = ContributorScorer()


class AnalysisCache:
    def __init__(self, ttl_seconds: int = 300, max_size: int = 1000):
        self.ttl_seconds = ttl_seconds
        self.max_size = max_size
        # key -> (response, expiry_time)
        self._cache: Dict[str, Tuple[AnalyzeResponse, float]] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> Optional[AnalyzeResponse]:
        async with self._lock:
            if key not in self._cache:
                return None
            response, expiry = self._cache[key]
            if time.time() > expiry:
                del self._cache[key]
                return None
            return response

    async def set(self, key: str, response: AnalyzeResponse):
        async with self._lock:
            now = time.time()
            # Clean expired items
            expired_keys = [
                k for k, (_, exp) in self._cache.items() if now > exp
            ]
            for k in expired_keys:
                del self._cache[k]

            # Enforce max size (FIFO)
            if len(self._cache) >= self.max_size:
                first_key = next(iter(self._cache))
                del self._cache[first_key]

            self._cache[key] = (response, now + self.ttl_seconds)

    async def clear(self):
        async with self._lock:
            self._cache.clear()


analysis_cache = AnalysisCache(ttl_seconds=300, max_size=1000)


def generate_cache_key(request: AnalyzeRequest) -> str:
    if request.diff_hash:
        return f"{request.repo_id}:diff:{request.diff_hash}"
    elif request.commit_hash:
        return f"{request.repo_id}:commit:{request.commit_hash}"
    else:
        # Fallback to SHA256 of content
        content_bytes = request.content.encode("utf-8")
        content_sha = hashlib.sha256(content_bytes).hexdigest()
        return f"{request.repo_id}:content:{content_sha}"


@router.post("/", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest, db: Session = Depends(get_db)):
    # Check cache
    cache_key = generate_cache_key(request)
    cached_response = await analysis_cache.get(cache_key)
    if cached_response is not None:
        return cached_response

    # 1. Run ensemble detection
    response = await ensemble.analyze(
        content=request.content,
        repo_id=request.repo_id,
        history=request.history
    )

    # 2. Run contributor scoring
    # Placeholder logic - ideally Node.js sends the data
    # For now, we use dummy data if not provided
    dummy_contributor_data = {
        "login": request.contributor_login,
        "is_first_time": True,
        "total_commits": 5,
        "created_at": "2024-01-01T00:00:00Z"
    }
    trust_res = scorer.calculate_trust_score(dummy_contributor_data)
    response.contributor_trust_score = trust_res["score"]

    # 3. Save to database
    db_result = AnalysisResult(
        repo_id=request.repo_id,
        pr_number=0,  # Would be sent in a real scenario
        author=request.contributor_login,
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
            d.add_to_index(request.content)
            break

    # Save to cache
    await analysis_cache.set(cache_key, response)

    return response
