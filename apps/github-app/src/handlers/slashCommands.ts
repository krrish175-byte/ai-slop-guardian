import { Context } from "probot";
import { WhitelistManager } from "../services/whitelist";

const whitelist = new WhitelistManager();

export async function handleSlashCommand(context: Context<"issue_comment.created">) {
  const comment = context.payload.comment;
  const { owner, repo, issue_number } = context.issue();
  const octokit = context.octokit as any;
  const ANALYSIS_ENGINE_URL = process.env.ANALYSIS_ENGINE_URL || "http://localhost:8000";
  
  if (!comment.body.startsWith("/guardian")) return;

  // Check if user has permission (write or higher)
  try {
    if (!comment.user) return;
    
    const { data: permission } = await octokit.request("GET /repos/{owner}/{repo}/collaborators/{username}/permission", {
      owner,
      repo,
      username: comment.user.login,
    });

    if (permission.permission === "read" || permission.permission === "none") {
      return;
    }
  } catch (err) {
    return;
  }

  const args = comment.body.split(" ");
  const command = args[1];

  switch (command) {
    case "approve":
      await octokit.request("DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name}", { owner, repo, issue_number, name: "ai-slop:high" }).catch(() => {});
      await octokit.request("DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name}", { owner, repo, issue_number, name: "ai-slop:medium" }).catch(() => {});
      await octokit.request("DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name}", { owner, repo, issue_number, name: "ai-slop:low" }).catch(() => {});
      await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/labels", { owner, repo, issue_number, labels: ["guardian-approved"] });
      await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
        owner,
        repo,
        issue_number,
        body: `✅ PR approved by maintainer`,
      });
      break;

    case "trust":
      const targetUser = args[2]?.replace("@", "");
      if (targetUser) {
        await whitelist.addToList(targetUser);
        await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
          owner,
          repo,
          issue_number,
          body: `✅ @${targetUser} has been whitelisted`,
        });
      }
      break;

    case "status":
      try {
        const statusRes = await fetch(`${ANALYSIS_ENGINE_URL}/analytics/${owner}/${repo}/slop-rate`);
        const statusData = await statusRes.json() as any;
        await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
          owner,
          repo,
          issue_number,
          body: `📊 **AI Slop Guardian Status**\n- Total PRs scanned: ${statusData.total_scans}\n- Avg Score: ${statusData.score}%\n- Threshold: 60%`,
        });
      } catch (err: any) {
        await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
          owner, repo, issue_number, body: "Error fetching status: " + err.message
        });
      }
      break;

    case "scan":
      await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
        owner,
        repo,
        issue_number,
        body: `🔄 Re-analyzing PR... (Note: Full PR scan is coming soon in v2)`,
      });
      break;

    default:
      await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
        owner,
        repo,
        issue_number,
        body: `❓ Unknown command. Available: \`/guardian approve\`, \`/guardian trust @user\`, \`/guardian status\``,
      });
  }
}
