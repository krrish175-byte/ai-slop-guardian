from pydantic import BaseModel
from typing import Optional, List

class AnalyzeRequest(BaseModel):
    content: str                    # The text to analyze (PR body, diff, comment)
    content_type: str               # "pr_body" | "diff" | "issue" | "comment"
    repo_id: str                    # "{owner}/{repo}"
    contributor_login: str
    contributor_id: int
    history: List[str] = []

class DetectorResult(BaseModel):
    name: str
    score: float                    # 0.0 = human, 1.0 = AI
    confidence: float
    signals: List[str]              # Human-readable reasons

class AnalyzeResponse(BaseModel):
    overall_score: float            # Weighted ensemble score
    label: str                      # "ai-slop:high" | "ai-slop:medium" | "ai-slop:low" | "human"
    confidence: float
    detectors: List[DetectorResult]
    contributor_trust_score: int    # 0-100
    summary: str                    # One-sentence human-readable verdict
    model_fingerprint: Optional[str] = None  # "gpt-4o-pattern" | "claude-pattern" | "unknown"

    model_config = {
        "protected_namespaces": ()
    }

class IndexRepoRequest(BaseModel):
    repo_id: str
    github_token: str
    files: List[dict]               # [{path, content, language}]
