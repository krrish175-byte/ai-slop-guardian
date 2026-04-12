import { Context } from "probot";
import { analyzeContent } from "../services/analysisClient";
import { CommentBuilder } from "../services/commentBuilder";
import { handleSurge } from "./surgeHandler";

const comments = new CommentBuilder();

export async function handlePullRequest(
  context: Context<"pull_request.opened" | "pull_request.synchronize">
) {
  const pr = context.payload.pull_request;
  const { owner, repo } = context.repo();
  const octokit = context.octokit as any;

  // 1. Surge Protection (only for opened PRs)
  if (context.payload.action === "opened") {
    const isSurge = await handleSurge(context as any);
    if (isSurge) return;
  }

  context.log.info("Processing PR #" + pr.number + ": " + pr.title);

  try {
    if (!pr.user) return;

    // Fetch PR diff as plain text
    const diffRes = await octokit.request("GET /repos/{owner}/{repo}/pulls/{pull_number}", {
      owner,
      repo,
      pull_number: pr.number,
      headers: { accept: "application/vnd.github.diff" },
    });

    const diff = typeof diffRes.data === "string" ? diffRes.data : "";

    const content = pr.title + "\n\n" + (pr.body || "") + "\n\n--- DIFF ---\n" + diff;

    // Fetch history for Ghost Author Detection (Feature 2)
    const { fetchContributorHistory } = require("../services/contributorHistory");
    const history = await fetchContributorHistory(context, owner, repo, pr.user.login);

    // Call analysis engine
    const result = await analyzeContent({
      content,
      content_type: "diff",
      repo_id: owner + "/" + repo,
      contributor_login: pr.user.login,
      contributor_id: pr.user.id,
      history
    });

    context.log.info("PR #" + pr.number + " score: " + result.overall_score + " -> " + result.label);

    // Apply slop label
    if (result.label !== "human") {
      await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/labels", {
        owner, repo, issue_number: pr.number, labels: [result.label]
      });
    }

    if (result.contributor_trust_score < 30) {
      await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/labels", {
        owner, repo, issue_number: pr.number, labels: ["first-time-contributor"]
      });
    }

    // Post report comment
    const report = comments.buildReport(result);
    await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
      owner, repo, issue_number: pr.number, body: report
    });

    // 2. Smart Review Writer (Feature 3)
    if (result.overall_score > 0.5) {
      const axios = require("axios");
      const ANALYSIS_ENGINE_URL = process.env.ANALYSIS_ENGINE_URL || "http://localhost:8000";
      
      try {
        const reviewRes = await axios.post(`${ANALYSIS_ENGINE_URL}/review/generate`, {
          diff,
          pr_title: pr.title,
          pr_body: pr.body || "",
          repo_id: owner + "/" + repo,
          slop_score: result.overall_score
        });

        const { review, verdict } = reviewRes.data;

        await octokit.request("POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews", {
          owner,
          repo,
          pull_number: pr.number,
          body: "🤖 Guardian AI Review (draft for maintainer)\n\n" + review,
          event: "COMMENT" // Keep as comment to avoid blocking merging automatically without human eyes
        });
      } catch (reviewErr: any) {
        context.log.error(`Failed to generate smart review: ${reviewErr.message}`);
      }
    }

    // 3. Comprehension Challenge (Feature 1)
    if (result.overall_score > 0.65) {
      const { triggerChallenge } = require("./comprehensionChallenge");
      await triggerChallenge(context, diff, result.overall_score);
    }

  } catch (err: any) {
    context.log.error("Error processing PR #" + pr.number + ": " + err.message);
  }
}
