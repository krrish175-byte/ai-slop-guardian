const ANALYSIS_ENGINE_URL = process.env.ANALYSIS_ENGINE_URL || "http://localhost:8000";

export interface AnalyzeRequest {
  content: string;
  content_type: "pr_body" | "diff" | "issue" | "comment";
  repo_id: string;
  contributor_login: string;
  contributor_id: number;
  history?: string[];
}

export interface AnalyzeResponse {
  overall_score: number;
  label: string;
  confidence: number;
  contributor_trust_score: number;
  summary: string;
  model_fingerprint?: string;
  detectors: Array<{
    name: string;
    score: number;
    confidence: number;
    signals: string[];
  }>;
}

export async function analyzeContent(req: AnalyzeRequest): Promise<AnalyzeResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  const response = await fetch(`${ANALYSIS_ENGINE_URL}/analyze/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal: controller.signal,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Analysis engine error ${response.status}: ${text}`);
  }

  clearTimeout(timeout);
  return response.json() as Promise<AnalyzeResponse>;
}

export interface IssueEvaluateRequest {
  title: string;
  body: string;
  repo_id: string;
}

export interface IssueEvaluateResponse {
  verdict: "valid" | "clarify" | "invalid" | "duplicate";
  difficulty: "level:beginner" | "level:intermediate" | "level:advanced" | "level:critical";
  labels: string[];
  feedback: string;
  relevant_files: string[];
}

export interface ProposalEvaluateRequest {
  issue_title: string;
  issue_body: string;
  candidate_login: string;
  proposal_text: string;
  repo_id: string;
}

export interface ProposalEvaluateResponse {
  score: number;
  verdict: "assign" | "clarify";
  feedback: string;
}

export async function evaluateIssue(req: IssueEvaluateRequest): Promise<IssueEvaluateResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  const response = await fetch(`${ANALYSIS_ENGINE_URL}/issues/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal: controller.signal,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Analysis engine issues/evaluate error ${response.status}: ${text}`);
  }

  clearTimeout(timeout);
  return response.json() as Promise<IssueEvaluateResponse>;
}

export async function evaluateProposal(req: ProposalEvaluateRequest): Promise<ProposalEvaluateResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  const response = await fetch(`${ANALYSIS_ENGINE_URL}/issues/proposal/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal: controller.signal,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Analysis engine proposal/evaluate error ${response.status}: ${text}`);
  }

  clearTimeout(timeout);
  return response.json() as Promise<ProposalEvaluateResponse>;
}
