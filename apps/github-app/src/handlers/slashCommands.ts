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

    case "summary":
      try {
        const { data: issueComments } = await octokit.request("GET /repos/{owner}/{repo}/issues/{issue_number}/comments", {
          owner,
          repo,
          issue_number,
          per_page: 100,
        });

        const reportComment = [...issueComments]
          .reverse()
          .find((issueComment: any) => issueComment.body?.includes("## 🛡️ AI Slop Guardian Report"));

        if (!reportComment?.body) {
          await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
            owner,
            repo,
            issue_number,
            body: "⚠️ No existing Guardian analysis found for this PR. Please run the normal PR scan first.",
          });
          break;
        }

        const reportBody = reportComment.body;
        const overallMatch = reportBody.match(/\*\*Overall AI probability\*\* \| \*\*(\d+)%/);
        const trustMatch = reportBody.match(/\| Contributor trust \| (\d+)\/100 \|/);
        const detectors = reportBody
          .split("\n")
          .map((line: string) => line.trim())
          .filter((line: string) => line.startsWith("|") && line.endsWith("|"))
          .filter((line: string) => {
            const normalized = line.toLowerCase();
            return !normalized.includes("| signal | value |")
              && !normalized.includes("|--------|-------|")
              && !normalized.includes("overall ai probability")
              && !normalized.includes("contributor trust");
          })
          .map((line: string) => {
            const parts = line
              .split("|")
              .map((part: string) => part.trim())
              .filter(Boolean);

            if (parts.length < 2) return null;

            const scoreMatch = parts[1].match(/(\d+)%/);
            if (!scoreMatch) return null;

            return {
              name: parts[0],
              score: Number(scoreMatch[1]) / 100,
              confidence: 0,
              signals: [],
            };
          })
          .filter(Boolean);

        if (!overallMatch || !trustMatch) {
          throw new Error("Failed to parse Guardian report metrics");
        }

        const overall_score = Number(overallMatch[1]) / 100;
        const contributor_trust_score = Number(trustMatch[1]);
        const label = overall_score > 0.85
          ? "ai-slop:high"
          : overall_score > 0.60
            ? "ai-slop:medium"
            : "human";

        const summaryRes = await fetch(`${ANALYSIS_ENGINE_URL}/review/summary`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            overall_score,
            label,
            detectors,
            contributor_trust_score,
          }),
        });

        let summaryData;
        try {
          summaryData = await summaryRes.json() as any;
        } catch (e: any) {
          throw new Error(`Failed to parse summary JSON: ${e.message}`);
        }

        if (!summaryRes.ok) {
          throw new Error(summaryData?.detail || `Summary request failed with status ${summaryRes.status}`);
        }

        const summary = typeof summaryData?.summary === "string"
          ? summaryData.summary.trim()
          : "";

        if (!summary) {
          throw new Error("Summary endpoint returned an empty summary");
        }

        await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
          owner,
          repo,
          issue_number,
          body: `## 📝 Guardian Summary\n\n${summary}`,
        });
      } catch (err: any) {
        await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
          owner,
          repo,
          issue_number,
          body: "Error generating summary: " + err.message,
        });
      }
      break;

    default:
      await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
        owner,
        repo,
        issue_number,
        body: `❓ Unknown command. Available: \`/guardian approve\`, \`/guardian trust @user\`, \`/guardian status\`, \`/guardian summary\``,
      });
  }
}
