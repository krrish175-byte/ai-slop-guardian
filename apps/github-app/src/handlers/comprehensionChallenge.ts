import { Context } from "probot";
import axios from "axios";

const ANALYSIS_ENGINE_URL = process.env.ANALYSIS_ENGINE_URL || "http://localhost:8000";
const GUARDIAN_API_KEY = process.env.GUARDIAN_API_KEY || "default_secret";

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
    }, {
      headers: { "X-API-KEY": GUARDIAN_API_KEY }
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
  const octokit = context.octokit as any;

  if (!comment.body.startsWith("/guardian answer")) return;

  const answers = comment.body.replace("/guardian answer", "").trim();
  if (!answers) {
    await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
        owner, repo, issue_number: prNumber, body: "⚠️ Please provide your answers after the command."
    });
    return;
  }

  try {
    // 1. Fetch the PR diff
    const diffRes = await octokit.request("GET /repos/{owner}/{repo}/pulls/{pull_number}", {
        owner, repo, pull_number: prNumber,
        headers: { accept: "application/vnd.github.diff" },
    });
    const diff = typeof diffRes.data === "string" ? diffRes.data : "";

    // 2. Find the original challenge questions by scanning previous comments
    const commentsRes = await octokit.request("GET /repos/{owner}/{repo}/issues/{issue_number}/comments", {
        owner, repo, issue_number: prNumber,
        per_page: 50
    });
    
    const challengeComment = (commentsRes.data as any[]).find((c: any) => 
        c.user.type === "Bot" && c.body.includes("## 🧠 Comprehension Challenge")
    );

    if (!challengeComment) {
        throw new Error("Could not find original challenge comment. Please ensure the bot's challenge comment is still present.");
    }

    // Extract questions using regex
    const questions = challengeComment.body
        .split("\n")
        .filter((l: string) => /^\d+\. /.test(l))
        .map((l: string) => l.replace(/^\d+\. /, "").trim());

    if (questions.length === 0) {
        throw new Error("Failed to parse questions from the challenge comment.");
    }

    // 3. Call the automated verification endpoint
    context.log.info(`Verifying challenge answers for PR #${prNumber}...`);
    const verifyRes = await axios.post(`${ANALYSIS_ENGINE_URL}/challenge/verify`, {
        diff: diff.substring(0, 5000), // Limit diff size for LLM
        questions,
        answers
    }, {
        headers: { "X-API-KEY": GUARDIAN_API_KEY }
    });

    const { verification_score, reasoning, passed } = verifyRes.data;
    context.log.info(`Verification result for PR #${prNumber}: ${passed ? "PASS" : "FAIL"} (Score: ${verification_score})`);

    // 4. Update PR state based on verification
    if (passed && verification_score >= 0.8) {
        // Apply success label
        await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/labels", {
            owner, repo, issue_number: prNumber, labels: ["human-verified"]
        });
        
        // Remove existing ai-slop labels
        const currentLabels = context.payload.issue.labels?.map((l: any) => l.name) || [];
        const slopLabels = currentLabels.filter((l: string) => l.startsWith("ai-slop:"));
        
        for (const label of slopLabels) {
            try {
                await octokit.request("DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name}", {
                    owner, repo, issue_number: prNumber, name: label
                });
            } catch (e) {
                context.log.warn(`Failed to remove label ${label}: ${e.message}`);
            }
        }

        await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
            owner, repo, issue_number: prNumber, 
            body: `✅ **Authorship Verified (Confidence: ${Math.round(verification_score * 100)}%)**\n\n${reasoning}\n\nGuardian has cleared this PR. Labels updated.`
        });
    } else if (verification_score < 0.4) {
        await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
            owner, repo, issue_number: prNumber, 
            body: `⚠️ **Authorship Verification Failed (Confidence: ${Math.round(verification_score * 100)}%)**\n\n${reasoning}\n\nThis PR remains flagged. A human maintainer will review the results.`
        });
    } else {
        await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
            owner, repo, issue_number: prNumber, 
            body: `⚖️ **Authorship Verification Inconclusive (Confidence: ${Math.round(verification_score * 100)}%)**\n\n${reasoning}\n\nA human maintainer is required for final verification.`
        });
    }

  } catch (err: any) {
    context.log.error(`Failed to verify challenge for PR #${prNumber}: ${err.message}`);
    await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
      owner, repo, issue_number: prNumber, 
      body: `❌ **Verification Error**: ${err.message}. A maintainer will check your answers manually.`
    });
  }
}

