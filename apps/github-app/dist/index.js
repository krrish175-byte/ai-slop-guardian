"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pullRequest_1 = require("./handlers/pullRequest");
const issues_1 = require("./handlers/issues");
const comments_1 = require("./handlers/comments");
const slashCommands_1 = require("./handlers/slashCommands");
const labelManager_1 = require("./services/labelManager");
const labelManager = new labelManager_1.LabelManager();
exports.default = (app) => {
    app.log.info("AI Slop Guardian is starting up...");
    // Setup labels on installation
    app.on("installation.created", async (context) => {
        await labelManager.setupLabels(context);
    });
    // PR Handlers
    app.on(["pull_request.opened", "pull_request.synchronize"], pullRequest_1.handlePullRequest);
    // Issue Handlers
    app.on("issues.opened", issues_1.handleIssueOpened);
    // Comment & Slash Command Handlers
    app.on("issue_comment.created", async (context) => {
        const comment = context.payload.comment.body;
        if (comment.startsWith("/guardian")) {
            await (0, slashCommands_1.handleSlashCommand)(context);
        }
        else {
            await (0, comments_1.handleCommentCreated)(context);
        }
    });
};
