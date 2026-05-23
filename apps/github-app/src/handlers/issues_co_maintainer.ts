import { Context } from "probot";
import { evaluateIssue, evaluateProposal } from "../services/analysisClient";

export async function handleIssueOpenedOrEdited(
  context: Context<"issues.opened" | "issues.edited">
) {
  const issue = context.payload.issue;
  const { owner, repo } = context.repo();
  const octokit = context.octokit as any;

  if (issue.user?.type === "Bot" || issue.user?.login === "ai-slop-guardian") {
    return;
  }

  context.log.info(`Evaluating Issue #${issue.number}: "${issue.title}"...`);

  try {
    const evaluation = await evaluateIssue({
      title: issue.title,
      body: issue.body || "",
      repo_id: `${owner}/${repo}`
    });

    context.log.info(`Issue #${issue.number} Verdict: ${evaluation.verdict} | Difficulty: ${evaluation.difficulty}`);

    if (evaluation.verdict === "invalid" || evaluation.verdict === "duplicate") {
      // 1. Post Closing feedback comment
      await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
        owner,
        repo,
        issue_number: issue.number,
        body: `## 🤖 AI Co-Maintainer Triage\n\n${evaluation.feedback}\n\n---\n*This issue has been closed automatically by AI Slop Guardian.*`
      });

      // 2. Set Labels (invalid or duplicate)
      await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/labels", {
        owner,
        repo,
        issue_number: issue.number,
        labels: [evaluation.verdict]
      });

      // 3. Close the issue
      await octokit.request("PATCH /repos/{owner}/{repo}/issues/{issue_number}", {
        owner,
        repo,
        issue_number: issue.number,
        state: "closed",
        state_reason: "not_planned"
      });
      
      context.log.info(`Issue #${issue.number} auto-closed as ${evaluation.verdict}`);
      return;
    }

    if (evaluation.verdict === "clarify") {
      // 1. Post clarification questions
      await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
        owner,
        repo,
        issue_number: issue.number,
        body: `## 🤖 AI Co-Maintainer Feedback\n\n${evaluation.feedback}`
      });

      // 2. Add needs-clarification label
      await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/labels", {
        owner,
        repo,
        issue_number: issue.number,
        labels: ["help wanted"]
      });
      return;
    }

    if (evaluation.verdict === "valid") {
      // Remove "help wanted" or clarification labels if present
      try {
        await octokit.request("DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name}", {
          owner, repo, issue_number: issue.number, name: "help wanted"
        });
      } catch (e) {
        // Label might not be present, ignore
      }

      // 1. Add difficulty, domain labels, GSSoC, and ready-to-claim
      const newLabels = [
        evaluation.difficulty,
        "GSSoC",
        "ready-to-claim",
        ...evaluation.labels
      ];

      await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/labels", {
        owner,
        repo,
        issue_number: issue.number,
        labels: newLabels
      });

      // 2. Post validation review and claim invite
      const inviteComment = [
        "## 🤖 AI Co-Maintainer Verified",
        "",
        evaluation.feedback,
        "",
        "---",
        "### 🎯 How to claim this issue:",
        "We are welcoming GSSoC contributors to claim this! To claim, please reply to this comment with a **technical implementation proposal** that answers:",
        "1. Which files you will modify.",
        "2. Your exact code design / step-by-step approach.",
        "",
        "Our AI Co-Maintainer will automatically score your proposal. High-quality technical approaches will be **assigned automatically**! 🚀"
      ].join("\n");

      await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
        owner,
        repo,
        issue_number: issue.number,
        body: inviteComment
      });

      context.log.info(`Issue #${issue.number} verified, labeled, and put up for claim.`);
    }

  } catch (err: any) {
    context.log.error(`Error evaluating Issue #${issue.number}: ${err.message}`);
  }
}

export async function handleIssueComment(context: Context<"issue_comment.created">) {
  const issue = context.payload.issue;
  const comment = context.payload.comment;
  const { owner, repo } = context.repo();
  const octokit = context.octokit as any;

  if (!comment.user || comment.user.type === "Bot" || comment.user.login === "ai-slop-guardian") {
    return;
  }

  // 1. Check if the issue is already assigned
  if (issue.assignee || (issue.assignees && issue.assignees.length > 0)) {
    return;
  }

  // 2. Check if the issue is open and ready-to-claim
  const isReadyToClaim = issue.labels.some((l: any) => l.name === "ready-to-claim");
  if (!isReadyToClaim) {
    return;
  }

  const commentBody = (comment.body || "").toLowerCase();
  const isClaimRequest =
    commentBody.includes("claim") ||
    commentBody.includes("assign") ||
    commentBody.includes("work on") ||
    commentBody.includes("gssoc") ||
    commentBody.length > 40;

  if (!isClaimRequest) {
    return;
  }

  context.log.info(`Evaluating proposal from @${comment.user.login} for Issue #${issue.number}...`);

  try {
    const evaluation = await evaluateProposal({
      issue_title: issue.title,
      issue_body: issue.body || "",
      candidate_login: comment.user.login,
      proposal_text: comment.body || "",
      repo_id: `${owner}/${repo}`
    });

    context.log.info(`Proposal Score: ${evaluation.score}/10 | Verdict: ${evaluation.verdict}`);

    if (evaluation.verdict === "assign") {
      // 1. Post welcoming comment and score
      await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
        owner,
        repo,
        issue_number: issue.number,
        body: `## 🤖 AI Co-Maintainer Assignment\n\nCongratulations @${comment.user.login}! Your proposal received a technical score of **${evaluation.score}/10**.\n\n${evaluation.feedback}\n\nI have assigned this issue to you. Please open a Draft PR when you begin coding!`
      });

      // 2. Assign the candidate
      await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/assignees", {
        owner,
        repo,
        issue_number: issue.number,
        assignees: [comment.user.login]
      });

      // 3. Remove "ready-to-claim" label
      try {
        await octokit.request("DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name}", {
          owner,
          repo,
          issue_number: issue.number,
          name: "ready-to-claim"
        });
      } catch (labelErr) {
        // Label might not be present, ignore
      }

      context.log.info(`Issue #${issue.number} successfully assigned to @${comment.user.login}`);
    } else {
      // verdict is "clarify" (needs better proposal details)
      await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
        owner,
        repo,
        issue_number: issue.number,
        body: `## 🤖 AI Co-Maintainer Feedback\n\nHello @${comment.user.login}! Thank you for expressing interest.\n\nYour proposal received a rating of **${evaluation.score}/10**.\n\n${evaluation.feedback}`
      });
      context.log.info(`Proposal from @${comment.user.login} asked for clarification.`);
    }

  } catch (err: any) {
    context.log.error(`Error evaluating proposal for Issue #${issue.number}: ${err.message}`);
  }
}
