import { Context } from "probot";
import { surgeDetector } from "../services/surgeDetector";
import axios from "axios";

const ANALYSIS_ENGINE_URL = process.env.ANALYSIS_ENGINE_URL || "http://localhost:8000";

export async function handleSurge(context: Context<"pull_request.opened">): Promise<boolean> {
  const pr = context.payload.pull_request;
  const { owner, repo } = context.repo();
  const repoId = `${owner}/${repo}`;
  const contributorLogin = pr.user.login;

  const surgeType = surgeDetector.checkSurge(repoId, contributorLogin);

  if (surgeType) {
    context.log.warn(`🚨 Surge detected: ${surgeType} for ${contributorLogin} in ${repoId}`);

    // 1. Close the PR
    await context.octokit.request("PATCH /repos/{owner}/{repo}/pulls/{pull_number}", {
      owner,
      repo,
      pull_number: pr.number,
      state: "closed"
    });

    // 2. Post a comment
    const message = surgeType === "contributor_surge" 
      ? `🚨 Rate limit: Guardian detected unusual submission patterns from your account. Please wait 24 hours before resubmitting.`
      : `🚨 Repository Flood: Guardian detected a surge in submissions for this repository. Temporary protection enabled. PR closed.`;

    await context.octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
      owner,
      repo,
      issue_number: pr.number,
      body: message
    });

    // 3. Log to Python Analysis Engine
    try {
      await axios.post(`${ANALYSIS_ENGINE_URL}/surge`, {
        repo_id: repoId,
        contributor_login: contributorLogin,
        event_type: surgeType
      });
    } catch (err: any) {
      context.log.error(`Failed to log surge event to analysis engine: ${err.message}`);
    }

    // 4. Slack/Discord Webhook (optional, placeholder)
    if (process.env.SURGE_WEBHOOK_URL) {
       await axios.post(process.env.SURGE_WEBHOOK_URL, {
         text: `🚨 ${surgeType.toUpperCase()} in ${repoId} by ${contributorLogin}`
       }).catch(() => {});
    }

    return true; // Surge was handled
  }

  return false; // No surge
}
