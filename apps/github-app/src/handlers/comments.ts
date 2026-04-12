import { Context } from "probot";
import { analyzeContent } from "../services/analysisClient";

export async function handleCommentCreated(context: Context<"issue_comment.created">) {
  const comment = context.payload.comment;
  const issue = context.payload.issue;
  const { owner, repo } = context.repo();
  const octokit = context.octokit as any;
  const body = comment.body.trim();
  if (!comment.user || comment.user.type === "Bot") return;
  if (body.startsWith("/guardian approve")) {
    await octokit.issues.addLabels({ owner, repo, issue_number: issue.number, labels: ["guardian-approved"] });
    await octokit.issues.createComment({ owner, repo, issue_number: issue.number, body: "Approved by maintainer." });
    return;
  }
  if (body.startsWith("/guardian status")) {
    await octokit.issues.createComment({ owner, repo, issue_number: issue.number, body: "AI Slop Guardian is active on " + owner + "/" + repo });
    return;
  }
  if (!comment.user) return;
  try {
    const result = await analyzeContent({
      content: body,
      content_type: "comment",
      repo_id: owner + "/" + repo,
      contributor_login: comment.user.login,
      contributor_id: comment.user.id,
    });
    context.log.info("Comment score: " + result.overall_score + " -> " + result.label);
  } catch (err: any) {
    context.log.error("Error: " + err.message);
  }
}
