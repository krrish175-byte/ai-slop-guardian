"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleIssueOpened = handleIssueOpened;
const analysisClient_1 = require("../services/analysisClient");
async function handleIssueOpened(context) {
    const issue = context.payload.issue;
    const { owner, repo } = context.repo();
    const octokit = context.octokit;
    if (!issue.user)
        return;
    context.log.info("Processing Issue #" + issue.number);
    try {
        const result = await (0, analysisClient_1.analyzeContent)({
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
    }
    catch (err) {
        context.log.error("Error: " + err.message);
    }
}
