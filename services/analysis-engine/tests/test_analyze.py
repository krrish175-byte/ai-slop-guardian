import sys
import os
from unittest.mock import patch, MagicMock

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient  # noqa: E402
from main import app  # noqa: E402
from routers.analyze import ensemble  # noqa: E402
from models.schemas import AnalyzeResponse  # noqa: E402
from db.database import get_db  # noqa: E402


def override_get_db():
    yield MagicMock()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def test_analyze_endpoint_mocked():
    # Create a real Pydantic response object
    mock_res_obj = AnalyzeResponse(
        overall_score=0.95,
        label="ai-slop:high",
        confidence=0.98,
        detectors=[],
        contributor_trust_score=0,
        summary="Mocked summary",
        model_fingerprint="mocked"
    )

    async def async_mock(*args, **kwargs):
        return mock_res_obj

    with patch.object(ensemble, "analyze", new=async_mock):
        with patch(
            "scorer.contributor.ContributorScorer.calculate_trust_score",
            return_value={"score": 0.5},
        ):
            payload = {
                "content": "This is some test content",
                "content_type": "pr_body",
                "repo_id": "test/repo",
                "contributor_login": "testuser",
                "contributor_id": 12345,
                "history": []
            }
            response = client.post("/analyze/", json=payload)

            assert response.status_code == 200
            data = response.json()
            assert data["label"] == "ai-slop:high"
            assert data["overall_score"] == 0.95


def test_analyze_cache_hit():
    from unittest.mock import AsyncMock
    from routers.analyze import analysis_cache

    # Wait, analysis_cache is an instance of AnalysisCache.
    # Since the methods are async, we might need async tests
    # or just patch _cache
    import asyncio
    asyncio.run(analysis_cache.clear())

    mock_res_obj = AnalyzeResponse(
        overall_score=0.80,
        label="ai-slop:medium",
        confidence=0.90,
        detectors=[],
        contributor_trust_score=0,
        summary="Mocked hit summary",
        model_fingerprint="mocked"
    )

    mock_analyze = AsyncMock(return_value=mock_res_obj)

    with patch.object(ensemble, "analyze", new=mock_analyze):
        with patch(
            "scorer.contributor.ContributorScorer.calculate_trust_score",
            return_value={"score": 0.5},
        ):
            payload = {
                "content": "This is some test content",
                "content_type": "pr_body",
                "repo_id": "test/repo",
                "contributor_login": "testuser",
                "contributor_id": 12345,
                "history": [],
                "commit_hash": "abc12345"
            }
            # First request - Cache Miss
            response1 = client.post("/analyze/", json=payload)
            assert response1.status_code == 200
            assert mock_analyze.call_count == 1

            # Second request (identical) - Cache Hit
            response2 = client.post("/analyze/", json=payload)
            assert response2.status_code == 200
            # call_count should STILL be 1 because it bypassed
            # the ensemble analyzer
            assert mock_analyze.call_count == 1

            data2 = response2.json()
            assert data2["overall_score"] == 0.80
            assert data2["label"] == "ai-slop:medium"


def test_analyze_cache_miss():
    from unittest.mock import AsyncMock
    from routers.analyze import analysis_cache
    import asyncio
    asyncio.run(analysis_cache.clear())

    mock_res_obj = AnalyzeResponse(
        overall_score=0.80,
        label="ai-slop:medium",
        confidence=0.90,
        detectors=[],
        contributor_trust_score=0,
        summary="Mocked hit summary",
        model_fingerprint="mocked"
    )

    mock_analyze = AsyncMock(return_value=mock_res_obj)

    with patch.object(ensemble, "analyze", new=mock_analyze):
        with patch(
            "scorer.contributor.ContributorScorer.calculate_trust_score",
            return_value={"score": 0.5},
        ):
            payload1 = {
                "content": "This is some test content",
                "content_type": "pr_body",
                "repo_id": "test/repo",
                "contributor_login": "testuser",
                "contributor_id": 12345,
                "history": [],
                "commit_hash": "abc12345"
            }
            payload2 = {
                "content": "This is some test content",
                "content_type": "pr_body",
                "repo_id": "test/repo",
                "contributor_login": "testuser",
                "contributor_id": 12345,
                "history": [],
                "commit_hash": "def67890"  # Different commit hash
            }

            # First request - Cache Miss
            response1 = client.post("/analyze/", json=payload1)
            assert response1.status_code == 200
            assert mock_analyze.call_count == 1

            # Second request with different hash - Cache Miss
            response2 = client.post("/analyze/", json=payload2)
            assert response2.status_code == 200
            assert mock_analyze.call_count == 2


def test_analyze_cache_ttl():
    import time
    from unittest.mock import AsyncMock
    from routers.analyze import analysis_cache
    import asyncio
    asyncio.run(analysis_cache.clear())

    mock_res_obj = AnalyzeResponse(
        overall_score=0.80,
        label="ai-slop:medium",
        confidence=0.90,
        detectors=[],
        contributor_trust_score=0,
        summary="Mocked hit summary",
        model_fingerprint="mocked"
    )

    mock_analyze = AsyncMock(return_value=mock_res_obj)

    with patch.object(ensemble, "analyze", new=mock_analyze):
        with patch(
            "scorer.contributor.ContributorScorer.calculate_trust_score",
            return_value={"score": 0.5},
        ):
            payload = {
                "content": "This is some test content",
                "content_type": "pr_body",
                "repo_id": "test/repo",
                "contributor_login": "testuser",
                "contributor_id": 12345,
                "history": [],
                "commit_hash": "abc12345"
            }

            # First request - Cache Miss
            response1 = client.post("/analyze/", json=payload)
            assert response1.status_code == 200
            assert mock_analyze.call_count == 1

            # Manually expire the item in the cache
            cache_key = "test/repo:commit:abc12345"
            assert cache_key in analysis_cache._cache
            # Set expiry in the past
            res, _ = analysis_cache._cache[cache_key]
            analysis_cache._cache[cache_key] = (res, time.time() - 10)

            # Second request - Cache Miss due to expiration
            response2 = client.post("/analyze/", json=payload)
            assert response2.status_code == 200
            assert mock_analyze.call_count == 2
