import { Context } from "probot";
import { analyzeContent } from "../services/analysisClient";

export async function handleIssueOpened(context: Context<"issues.opened">) {
  const issue = context.payload.issue;
  const { owner, repo } = context.repo();
  const octokit = context.octokit as any;
  if (!issue.user) return;
  context.log.info("Processing Issue #" + issue.number);
  try {
    const result = await analyzeContent({
      content: issue.title + "\n\n" + (issue.body || ""),
      content_type: "issue",
      repo_id: owner + "/" + repo,
      contributor_login: issue.user.login,
      contributor_id: issue.user.id,
    });
    context.log.info("Issue score: " + result.overall_score + " -> " + result.label);
    if (result.label !== "human") {
      await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/labels", {
        owner, repo, issue_number: issue.number, labels: [result.label]
      });
    }
  } catch (err: any) {
    context.log.error("Error: " + err.message);
  }
}
