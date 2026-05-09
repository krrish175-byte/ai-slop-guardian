"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCommentCreated = handleCommentCreated;
const analysisClient_1 = require("../services/analysisClient");
const comprehensionChallenge_1 = require("./comprehensionChallenge");
const slashCommands_1 = require("./slashCommands");
async function handleCommentCreated(context) {
    const comment = context.payload.comment;
    const { owner, repo } = context.repo();
    const body = comment.body.trim();
    if (!comment.user)
        return;
    // 1. Check for command answers
    if (body.startsWith("/guardian answer")) {
        await (0, comprehensionChallenge_1.handleChallengeAnswer)(context);
        return;
    }
    // 2. Delegate other /guardian commands to slashCommands
    if (body.startsWith("/guardian")) {
        if (comment.user.type !== "Bot") {
            await (0, slashCommands_1.handleSlashCommand)(context);
        }
        return;
    }
    if (comment.user.type === "Bot")
        return;
    // 3. Normal comment analysis
    try {
        const result = await (0, analysisClient_1.analyzeContent)({
            content: body,
            content_type: "comment",
            repo_id: owner + "/" + repo,
            contributor_login: comment.user.login,
            contributor_id: comment.user.id,
        });
        context.log.info("Comment score: " + result.overall_score + " -> " + result.label);
    }
    catch (err) {
        context.log.error("Error: " + err.message);
    }
}
