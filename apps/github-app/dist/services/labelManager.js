"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabelManager = void 0;
class LabelManager {
    constructor() {
        this.labels = [
            { name: "ai-slop:high", color: "d73a4a", description: "High probability of AI-generated content" },
            { name: "ai-slop:medium", color: "e4a11b", description: "Medium probability of AI-generated content" },
            { name: "ai-slop:low", color: "fbca04", description: "Low probability of AI-generated content" },
            { name: "ai-assisted", color: "0075ca", description: "Content identified as AI-assisted" },
            { name: "human-verified", color: "0e8a16", description: "Content verified as human-authored" },
            { name: "first-time-contributor", color: "7057ff", description: "First time contributing to this repo" },
            { name: "guardian-approved", color: "e4e669", description: "Approved by AI Slop Guardian" },
        ];
    }
    async setupLabels(context) {
        const { owner, repo } = context.repo();
        const octokit = context.octokit;
        for (const label of this.labels) {
            try {
                await octokit.issues.createLabel({
                    owner,
                    repo,
                    name: label.name,
                    color: label.color,
                    description: label.description,
                });
            }
            catch (err) {
                // Label probably already exists
                if (err.status !== 422) {
                    context.log.warn(`Failed to create label ${label.name}: ${err.message}`);
                }
            }
        }
    }
    async applyLabel(context, labelName) {
        const { owner, repo } = context.repo();
        const issue_number = "pull_request" in context.payload
            ? context.payload.pull_request.number
            : context.payload.issue.number;
        // Remove existing ai-slop labels first
        const currentLabels = "pull_request" in context.payload
            ? context.payload.pull_request.labels
            : context.payload.issue.labels;
        const octokit = context.octokit;
        if (currentLabels) {
            const slopLabels = currentLabels
                .filter((l) => l.name.startsWith("ai-slop:"))
                .map((l) => l.name);
            for (const oldLabel of slopLabels) {
                if (oldLabel !== labelName) {
                    try {
                        await octokit.issues.removeLabel({
                            owner,
                            repo,
                            issue_number,
                            name: oldLabel,
                        });
                    }
                    catch (e) {
                        // Ignore if label not found
                    }
                }
            }
        }
        try {
            await octokit.issues.addLabels({
                owner,
                repo,
                issue_number,
                labels: [labelName],
            });
        }
        catch (err) {
            context.log.error(`Failed to apply label ${labelName}: ${err.message}`);
        }
    }
}
exports.LabelManager = LabelManager;
