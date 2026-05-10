import sys
import os
from unittest.mock import patch

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient  # noqa: E402
from main import app  # noqa: E402
from routers.analyze import ensemble  # noqa: E402
from models.schemas import AnalyzeResponse  # noqa: E402

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
