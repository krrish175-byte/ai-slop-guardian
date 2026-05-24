const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export type SlopRateResponse = {
  score: number;
  label: string;
  color: string;
  total_scans: number;
  slop_count: number;
};

export type BurnoutResponse = {
  hours_wasted_month: number;
  slop_prs_month: number;
  total_prs_month: number;
  projected_hours_annual: number;
  burnout_risk: string;
  repo_id: string;
};

export const fetchSlopRate = async (repoId: string): Promise<SlopRateResponse> => {
  const response = await fetch(`${API_BASE_URL}/analytics/${encodeURIComponent(repoId)}/slop-rate`);
  if (!response.ok) throw new Error("Failed to fetch slop rate");
  return response.json();
};

export const fetchBurnout = async (repoId: string): Promise<BurnoutResponse> => {
  const response = await fetch(`${API_BASE_URL}/analytics/${encodeURIComponent(repoId)}/burnout`);
  if (!response.ok) throw new Error("Failed to fetch burnout stats");
  return response.json();
};

export const fetchMaintainerAnalytics = async (repoId: string) => {
  const [slopRate, burnout] = await Promise.all([
    fetchSlopRate(repoId),
    fetchBurnout(repoId),
  ]);

  return { slopRate, burnout };
};
