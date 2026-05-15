import os
import sys
from datetime import datetime, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import Base  # noqa: E402
from db.models import AnalysisResult  # noqa: E402
from routers.trust import get_trust_history  # noqa: E402


@pytest.mark.asyncio
async def test_get_trust_history_returns_chronological_points():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    db = SessionLocal()
    try:
        db.add_all(
            [
                AnalysisResult(
                    repo_id="org/repo",
                    pr_number=10,
                    author="alice",
                    overall_score=0.2,
                    label="human",
                    confidence=0.9,
                    contributor_trust_score=40,
                    timestamp=datetime(2026, 1, 1, tzinfo=timezone.utc),
                ),
                AnalysisResult(
                    repo_id="org/repo",
                    pr_number=11,
                    author="alice",
                    overall_score=0.1,
                    label="human",
                    confidence=0.95,
                    contributor_trust_score=55,
                    timestamp=datetime(2026, 1, 5, tzinfo=timezone.utc),
                ),
                AnalysisResult(
                    repo_id="org/other",
                    pr_number=12,
                    author="alice",
                    overall_score=0.3,
                    label="human",
                    confidence=0.85,
                    contributor_trust_score=65,
                    timestamp=datetime(2026, 1, 7, tzinfo=timezone.utc),
                ),
                AnalysisResult(
                    repo_id="org/repo",
                    pr_number=13,
                    author="bob",
                    overall_score=0.4,
                    label="human",
                    confidence=0.8,
                    contributor_trust_score=15,
                    timestamp=datetime(2026, 1, 3, tzinfo=timezone.utc),
                ),
            ]
        )
        db.commit()

        response = await get_trust_history("alice", db=db)
        assert response["username"] == "alice"
        assert response["count"] == 3
        assert [point["trust_score"] for point in response["history"]] == [40, 55, 65]

        filtered = await get_trust_history("alice", repo_id="org/repo", db=db)
        assert filtered["count"] == 2
        assert [point["pr_number"] for point in filtered["history"]] == [10, 11]
    finally:
        db.close()