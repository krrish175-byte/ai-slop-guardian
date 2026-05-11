from pydantic import BaseModel
from typing import Optional, List


class AnalyzeRequest(BaseModel):
    # The text to analyze (PR body, diff, comment)
    content: str
    # "pr_body" | "diff" | "issue" | "comment"
    content_type: str
    # "{owner}/{repo}"
    repo_id: str
    contributor_login: str
    contributor_id: int
    history: List[str] = []


class DetectorResult(BaseModel):
    name: str
    # 0.0 = human, 1.0 = AI
    score: float
    confidence: float
    # Human-readable reasons
    signals: List[str]


class AnalyzeResponse(BaseModel):
    # Weighted ensemble score
    overall_score: float
    # "ai-slop:high" | "ai-slop:medium" | "ai-slop:low" | "human"
    label: str
    confidence: float
    detectors: List[DetectorResult]
    # 0-100
    contributor_trust_score: int
    # One-sentence human-readable verdict
    summary: str
    # "gpt-4o-pattern" | "claude-pattern" | "unknown"
    model_fingerprint: Optional[str] = None

    model_config = {
        "protected_namespaces": ()
    }


class IndexRepoRequest(BaseModel):
    repo_id: str
    github_token: str
    # [{path, content, language}]
    files: List[dict]
