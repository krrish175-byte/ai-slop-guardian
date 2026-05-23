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


class IssueEvaluateRequest(BaseModel):
    title: str
    body: str
    repo_id: str


class IssueEvaluateResponse(BaseModel):
    verdict: str  # "valid" | "clarify" | "invalid" | "duplicate"
    # difficulty: level:beginner | level:intermediate | etc.
    difficulty: str
    labels: List[str]  # e.g. ["frontend", "backend", "typescript"]
    # markdown feedback message (clarification or closing remarks)
    feedback: str
    relevant_files: List[str] = []


class ProposalEvaluateRequest(BaseModel):
    issue_title: str
    issue_body: str
    candidate_login: str
    proposal_text: str
    repo_id: str


class ProposalEvaluateResponse(BaseModel):
    score: int  # 1 to 10 rating
    verdict: str  # "assign" | "clarify"
    # Explanation of rating and subsequent steps if clarify
    feedback: str
