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
    }, { timeout: 30000 });

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

  if (!comment.body.startsWith("/guardian answer")) return;

  const answers = comment.body.replace("/guardian answer", "").trim();
  if (!answers) {
    await context.octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
        owner, repo, issue_number: prNumber, body: "⚠️ Please provide your answers after the command."
    });
    return;
  }

  try {
    await context.octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
      owner, repo, issue_number: prNumber, body: "✅ Thank you for your response. A maintainer will review your answers."
    });
  } catch (err: any) {
    context.log.error(`Failed to post answer response: ${err.message}`);
  }
}
