"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePullRequest = handlePullRequest;
const analysisClient_1 = require("../services/analysisClient");
const labelManager_1 = require("../services/labelManager");
const commentBuilder_1 = require("../services/commentBuilder");
const client = new analysisClient_1.AnalysisClient();
const labels = new labelManager_1.LabelManager();
const comments = new commentBuilder_1.CommentBuilder();
async function handlePullRequest(context) {
    const { owner, repo, pull_number } = context.pullRequest();
    const pr = context.payload.pull_request;
    context.log.info(`Processing PR #${pull_number}: ${pr.title}`);
    try {
        const octokit = context.octokit;
        // 1. Fetch Diff
        const { data: diff } = await octokit.pulls.get({
            owner,
            repo,
            pull_number,
            mediaType: { format: "diff" },
        });
        if (!pr.user)
            return;
        // 2. Prepare request
        const analysisRequest = {
            content: `${pr.title}\n\n${pr.body}\n\n--- DIFF ---\n${diff}`,
            content_type: "diff",
            repo_id: `${owner}/${repo}`,
            contributor_login: pr.user.login,
            contributor_id: pr.user.id,
        };
        // 3. Call Analysis Engine
        const result = await client.analyze(analysisRequest);
        // 4. Update Labels
        await labels.applyLabel(context, result.label);
        // Add first-time contributor label if trust is low
        if (result.contributor_trust_score < 30) {
            await labels.applyLabel(context, "first-time-contributor");
        }
        // 5. Post Report Comment
        const report = comments.buildReport(result);
        await octokit.issues.createComment({
            owner,
            repo,
            issue_number: pull_number,
            body: report,
        });
    }
    catch (err) {
        context.log.error(`Error processing PR #${pull_number}: ${err.message}`);
    }
}
