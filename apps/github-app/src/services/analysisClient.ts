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
  const timeout = setTimeout(() => controller.abort(), 25000);
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
