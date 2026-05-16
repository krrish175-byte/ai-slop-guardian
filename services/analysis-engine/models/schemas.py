from pydantic import BaseModel, Field
from typing import Optional, List, Literal


class AnalyzeRequest(BaseModel):
    # The text to analyze (PR body, diff, comment)
    content: str = Field(..., min_length=10, max_length=1000000)
    # "pr_body" | "diff" | "issue" | "comment"
    content_type: Literal["pr_body", "diff", "issue", "comment"]
    # "{owner}/{repo}"
    repo_id: str = Field(..., pattern=r"^[a-zA-Z0-9._-]+/[a-zA-Z0-9._-]+$")
    contributor_login: str = Field(..., min_length=1, max_length=100)
    contributor_id: int = Field(..., gt=0)
    history: List[str] = Field(default_factory=list, max_items=50)


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
