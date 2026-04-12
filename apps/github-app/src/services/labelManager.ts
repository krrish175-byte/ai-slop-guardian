import { Octokit } from "@octokit/core";

const LABELS = [
  { name: "ai-slop:high",           color: "d73a4a", description: "High AI generation probability (>85%)" },
  { name: "ai-slop:medium",         color: "e4a11b", description: "Medium AI generation probability (60-85%)" },
  { name: "ai-slop:low",            color: "fbca04", description: "Low AI generation probability (40-60%)" },
  { name: "ai-assisted",            color: "0075ca", description: "AI assisted but meaningfully reviewed" },
  { name: "human-verified",         color: "0e8a16", description: "Verified human contribution" },
  { name: "first-time-contributor", color: "7057ff", description: "First time contributor - extra review" },
  { name: "guardian-approved",      color: "e4e669", description: "Manually approved by maintainer" },
];

export async function setupLabels(octokit: Octokit, owner: string, repo: string) {
  for (const label of LABELS) {
    try {
      await octokit.request("POST /repos/{owner}/{repo}/labels", {
        owner,
        repo,
        ...label,
      });
    } catch (err: any) {
      // 422 means label already exists — that's fine
      if (err.status !== 422) {
        console.error(`Failed to create label ${label.name}:`, err.message);
      }
    }
  }
}
