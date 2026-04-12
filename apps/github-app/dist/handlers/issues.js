"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleIssueOpened = handleIssueOpened;
const analysisClient_1 = require("../services/analysisClient");
const labelManager_1 = require("../services/labelManager");
const client = new analysisClient_1.AnalysisClient();
const labels = new labelManager_1.LabelManager();
async function handleIssueOpened(context) {
    const { owner, repo, issue_number } = context.issue();
    const issue = context.payload.issue;
    try {
        if (!issue.user)
            return;
        const result = await client.analyze({
            content: `${issue.title}\n\n${issue.body}`,
            content_type: "issue",
            repo_id: `${owner}/${repo}`,
            contributor_login: issue.user.login,
            contributor_id: issue.user.id,
        });
        await labels.applyLabel(context, result.label);
    }
    catch (err) {
        context.log.error(`Error processing issue #${issue_number}: ${err.message}`);
    }
}
