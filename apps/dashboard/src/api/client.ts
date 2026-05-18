import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_ANALYSIS_ENGINE_URL || "http://localhost:8000";

export interface DashboardStats {
  total_pr_analyzed: number;
  ai_detected_count: number;
  average_slop_score: number;
  trend: Array<{ date: string; score: number }>;
}

export interface PRSummary {
  id: string;
  repo_id: string;
  pr_number: number;
  title: string;
  author: string;
  slop_score: number;
  label: string;
  timestamp: string;
}

export interface TrustScorePoint {
  date: string;
  trust_score: number;
  repo_id?: string;
  pr_number?: number;
}

export interface ContributorTrustHistory {
  username: string;
  history: TrustScorePoint[];
  count: number;
}

export type RepoAnalysis = Record<string, unknown>;

class DashboardAPI {
  async getStats(): Promise<DashboardStats> {
    const resp = await axios.get(`${API_BASE_URL}/stats/`);
    return resp.data;
  }

  async getRecentPRs(): Promise<PRSummary[]> {
    const resp = await axios.get(`${API_BASE_URL}/recent-prs/`);
    return resp.data;
  }

  async getRepoAnalysis(repoId: string): Promise<RepoAnalysis> {
    const resp = await axios.get(`${API_BASE_URL}/repo/${repoId}/`);
    return resp.data as RepoAnalysis;
  }

  async getContributorTrustHistory(username: string): Promise<ContributorTrustHistory> {
    const resp = await axios.get(`${API_BASE_URL}/trust/history/${encodeURIComponent(username)}`);
    return resp.data as ContributorTrustHistory;
  }
}

export const api = new DashboardAPI();
