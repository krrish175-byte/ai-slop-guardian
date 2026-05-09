"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const labelManager_1 = require("./services/labelManager");
const pullRequest_1 = require("./handlers/pullRequest");
const issues_1 = require("./handlers/issues");
const comments_1 = require("./handlers/comments");
const badge_1 = require("./routes/badge");
exports.default = (app) => {
    app.log.info("AI Slop Guardian is starting up...");
    (0, badge_1.setupBadgeRoutes)(app);
    app.on("installation.created", async (context) => {
        const repos = context.payload.repositories || [];
        for (const repo of repos) {
            const [owner, repoName] = repo.full_name.split("/");
            app.log.info(`Setting up labels for ${owner}/${repoName}`);
            try {
                await (0, labelManager_1.setupLabels)(context.octokit, owner, repoName);
                app.log.info(`Labels created for ${owner}/${repoName}`);
            }
            catch (err) {
                app.log.error(`Label setup failed for ${owner}/${repoName}: ${err.message}`);
            }
        }
    });
    app.on(["pull_request.opened", "pull_request.synchronize"], pullRequest_1.handlePullRequest);
    app.on("issues.opened", issues_1.handleIssueOpened);
    app.on("issue_comment.created", comments_1.handleCommentCreated);
};
