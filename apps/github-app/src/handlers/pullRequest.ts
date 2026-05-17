import { Context } from "probot";
import { analyzeContent } from "../services/analysisClient";
import { CommentBuilder } from "../services/commentBuilder";
import { handleSurge } from "./surgeHandler";

const comments = new CommentBuilder();
const ANALYSIS_ENGINE_URL = process.env.ANALYSIS_ENGINE_URL || "http://localhost:8000";

export async function handlePullRequest(
  context: Context<"pull_request.opened" | "pull_request.synchronize">
) {
  const pr = context.payload.pull_request;
  const { owner, repo } = context.repo();
  const octokit = context.octokit as any;

  if (context.payload.action === "opened") {
    const isSurge = await handleSurge(context as any);
    if (isSurge) return;
  }

  context.log.info("Processing PR #" + pr.number + ": " + pr.title);

  try {
    if (!pr.user) return;

    const diffRes = await octokit.request("GET /repos/{owner}/{repo}/pulls/{pull_number}", {
      owner, repo, pull_number: pr.number,
      headers: { accept: "application/vnd.github.diff" },
    });
    const diff = typeof diffRes.data === "string" ? diffRes.data : "";
    const content = pr.title + "\n\n" + (pr.body || "") + "\n\n--- DIFF ---\n" + diff;

    const result = await analyzeContent({
      content,
      content_type: "diff",
      repo_id: owner + "/" + repo,
      contributor_login: pr.user.login,
      contributor_id: pr.user.id,
    });

    context.log.info("PR #" + pr.number + " score: " + result.overall_score + " -> " + result.label);

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

    const report = comments.buildReport(result);
    await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
      owner, repo, issue_number: pr.number, body: report
    });

    if (result.overall_score > 0.5) {
      context.log.info(`Generating smart review for PR #${pr.number}...`);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);
        
        const reviewRes = await fetch(ANALYSIS_ENGINE_URL + "/review/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            diff: diff || "",
            pr_title: pr.title,
            pr_body: pr.body || "",
            pr_labels: pr.labels.map((label: any) => label.name),
            repo_id: owner + "/" + repo,
            slop_score: result.overall_score
          })
        }).finally(() => clearTimeout(timeoutId));
        
        context.log.info(`Smart review API response status: ${reviewRes.status}`);

        let reviewData;
        try {
          reviewData = await reviewRes.json() as any;
        } catch (e: any) {
          throw new Error(`Failed to parse review JSON: ${e.message}`);
        }

        const review = reviewData.review || "";

        if (review.trim()) {
          const reviewComment = [
            "## 🤖 Guardian AI Review",
            "",
            review,
            "",
            "---",
            "*This review was auto-generated. A human maintainer should verify before acting on it.*"
          ].join("\n");

          await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
            owner, repo, issue_number: pr.number,
            body: reviewComment
          });
          context.log.info("Smart review posted on PR #" + pr.number);
        } else {
          context.log.warn("Smart review was empty for PR #" + pr.number);
        }
      } catch (reviewErr: any) {
        context.log.error("Failed to generate smart review: " + reviewErr.message);
      }
    }

    if (result.overall_score > 0.60) {
      context.log.info(`Generating comprehension challenge for PR #${pr.number} (score: ${result.overall_score})...`);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const challengeRes = await fetch(ANALYSIS_ENGINE_URL + "/challenge/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            diff: diff.substring(0, 2000),
            pr_title: pr.title,
            repo_id: owner + "/" + repo
          })
        }).finally(() => clearTimeout(timeoutId));
        
        context.log.info(`Challenge API response status: ${challengeRes.status}`);

        let challenge;
        try {
          challenge = await challengeRes.json() as any;
        } catch (e: any) {
          throw new Error(`Failed to parse challenge JSON: ${e.message}`);
        }

        const questions = challenge.questions || [];
        if (questions.length === 0) {
          throw new Error("No questions returned from challenge endpoint");
        }

        const challengeComment = [
          "## Comprehension Challenge",
          "",
          "Guardian flagged this PR as potentially AI-generated (" + Math.round(result.overall_score * 100) + "% probability).",
          "Please answer these questions to verify authorship:",
          "",
          ...questions.map((q: string, i: number) => (i + 1) + ". " + q),
          "",
          "Reply with /guardian answer [your answers] within 48 hours.",
          "",
          "_Challenge ID: " + (challenge.challenge_id || "unknown") + "_"
        ].join("\n");
        await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
          owner, repo, issue_number: pr.number, body: challengeComment
        });
        context.log.info("Comprehension challenge posted on PR #" + pr.number);
      } catch (challengeErr: any) {
        context.log.error("Failed to post challenge: " + challengeErr.message);
        const fallbackComment = [
          "## 🧠 Authorship Verification Required",
          `This PR was flagged as potentially AI-generated (${Math.round(result.overall_score * 100)}% probability).`,
          "Please describe in a comment:",
          "1. What problem does this PR solve?",
          "2. Walk us through your implementation approach",
          "3. What did you test and how?"
        ].join("\n");
        await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
          owner, repo, issue_number: pr.number, body: fallbackComment
        });
        context.log.info("Fallback comprehension challenge posted on PR #" + pr.number);
      }
    }

  } catch (err: any) {
    context.log.error("Error processing PR #" + pr.number + ": " + err.message);
  }
}
 