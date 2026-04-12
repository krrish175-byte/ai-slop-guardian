"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCommentCreated = handleCommentCreated;
const analysisClient_1 = require("../services/analysisClient");
const client = new analysisClient_1.AnalysisClient();
async function handleCommentCreated(context) {
    const comment = context.payload.comment;
    const { owner, repo } = context.repo();
    // Skip if it's a bot comment or looks like a command
    if (!comment.user || comment.user.type === "Bot" || comment.body.startsWith("/")) {
        return;
    }
    try {
        const octokit = context.octokit;
        await client.analyze({
            content: comment.body,
            content_type: "comment",
            repo_id: `${owner}/${repo}`,
            contributor_login: comment.user.login,
            contributor_id: comment.user.id,
        });
        // We don't necessarily label for single comments unless they are high slop
        // This could be expanded later
    }
    catch (err) {
        context.log.error(`Error processing comment: ${err.message}`);
    }
}
