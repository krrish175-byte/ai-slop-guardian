import { Context } from "probot";
import axios from "axios";

const ANALYSIS_ENGINE_URL = process.env.ANALYSIS_ENGINE_URL || "http://localhost:8000";

export async function triggerChallenge(
  context: Context<"pull_request.opened" | "pull_request.synchronize">,
  diff: string,
  score: number
) {
  const pr = context.payload.pull_request;
  const { owner, repo } = context.repo();
  const repoId = `${owner}/${repo}`;

  try {
    const response = await axios.post(`${ANALYSIS_ENGINE_URL}/challenge/generate`, {
      diff,
      pr_title: pr.title,
      repo_id: repoId,
      pr_number: pr.number
    });

    const { questions, challenge_id } = response.data;

    const body = `
## 🧠 Comprehension Challenge
Guardian flagged this PR as potentially AI-generated (score: ${Math.round(score * 100)}%).
Please answer these questions to verify authorship:

1. ${questions[0]}
2. ${questions[1]}
3. ${questions[2]}

You have 48 hours. Reply with \`/guardian answer [your answers]\`
    `.trim();

    await context.octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
      owner,
      repo,
      issue_number: pr.number,
      body
    });

    context.log.info(`Challenge ${challenge_id} posted for PR #${pr.number}`);
  } catch (err: any) {
    context.log.error(`Failed to generate challenge for PR #${pr.number}: ${err.message}`);
  }
}

export async function handleChallengeAnswer(context: Context<"issue_comment.created">) {
  const comment = context.payload.comment;
  const prNumber = context.payload.issue.number;
  const { owner, repo } = context.repo();
  const repoId = `${owner}/${repo}`;

  if (!comment.body.startsWith("/guardian answer")) return;

  const answers = comment.body.replace("/guardian answer", "").trim();
  if (!answers) {
    await context.octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
        owner, repo, issue_number: prNumber, body: "⚠️ Please provide your answers after the command."
    });
    return;
  }

  try {
    // 1. Find the pending challenge (proxy through engine because engine has the DB)
    // We'll add a helper endpoint in Python to find challenge by repo/pr
    const challengeRes = await axios.get(`${ANALYSIS_ENGINE_URL}/challenge/find/${repoId}/${prNumber}`);
    const challengeId = challengeRes.data.challenge_id;

    if (!challengeId) {
        context.log.warn(`No pending challenge found for PR #${prNumber}`);
        return;
    }

    // 2. Verify with engine
    const verifyRes = await axios.post(`${ANALYSIS_ENGINE_URL}/challenge/verify`, {
      challenge_id: challengeId,
      answers
    });

    const { passed, reason } = verifyRes.data;

    if (passed) {
      await context.octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
        owner, repo, issue_number: prNumber, body: `✅ **Authorship Verified.**\n${reason}`
      });
      await context.octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/labels", {
        owner, repo, issue_number: prNumber, labels: ["human-verified"]
      });
      // Optionally remove ai-slop labels
      await context.octokit.request("DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name}", {
        owner, repo, issue_number: prNumber, name: "ai-slop:high"
      }).catch(() => {});
      await context.octokit.request("DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name}", {
        owner, repo, issue_number: prNumber, name: "ai-slop:medium"
      }).catch(() => {});
    } else {
      await context.octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
        owner, repo, issue_number: prNumber, body: `❌ **Authorship Verification Failed.**\n${reason}\nEscalating to manual review.`
      });
      await context.octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/labels", {
        owner, repo, issue_number: prNumber, labels: ["ai-slop:high"]
      });
    }

  } catch (err: any) {
    context.log.error(`Failed to verify answer: ${err.message}`);
  }
}
