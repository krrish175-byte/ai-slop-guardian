"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePullRequest = handlePullRequest;
const analysisClient_1 = require("../services/analysisClient");
const commentBuilder_1 = require("../services/commentBuilder");
const surgeHandler_1 = require("./surgeHandler");
const comments = new commentBuilder_1.CommentBuilder();
const ANALYSIS_ENGINE_URL = process.env.ANALYSIS_ENGINE_URL || "http://localhost:8000";
async function handlePullRequest(context) {
    const pr = context.payload.pull_request;
    const { owner, repo } = context.repo();
    const octokit = context.octokit;
    if (context.payload.action === "opened") {
        const isSurge = await (0, surgeHandler_1.handleSurge)(context);
        if (isSurge)
            return;
    }
    context.log.info("Processing PR #" + pr.number + ": " + pr.title);
    try {
        if (!pr.user)
            return;
        const diffRes = await octokit.request("GET /repos/{owner}/{repo}/pulls/{pull_number}", {
            owner, repo, pull_number: pr.number,
            headers: { accept: "application/vnd.github.diff" },
        });
        const diff = typeof diffRes.data === "string" ? diffRes.data : "";
        const content = pr.title + "\n\n" + (pr.body || "") + "\n\n--- DIFF ---\n" + diff;
        const result = await (0, analysisClient_1.analyzeContent)({
            content,
            content_type: "diff",
            repo_id: owner + "/" + repo,
            contributor_login: pr.user.login,
            contributor_id: pr.user.id,
        });
        context.log.info("PR #" + pr.number + " score: " + result.overall_score + " -> " + result.label);
        if (result.label !== "human") {
            await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/labels", {
                owner, repo, issue_number: pr.number, labels: [result.label]
            });
        }
        if (result.contributor_trust_score < 30) {
            await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/labels", {
                owner, repo, issue_number: pr.number, labels: ["first-time-contributor"]
            });
        }
        const report = comments.buildReport(result);
        await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
            owner, repo, issue_number: pr.number, body: report
        });
        if (result.overall_score > 0.5) {
            try {
                const reviewRes = await fetch(ANALYSIS_ENGINE_URL + "/review/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        diff: diff || "",
                        pr_title: pr.title,
                        pr_body: pr.body || "",
                        repo_id: owner + "/" + repo,
                        slop_score: result.overall_score
                    })
                });
                const reviewData = await reviewRes.json();
                const review = reviewData.review || "";
                if (review.trim()) {
                    await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
                        owner, repo, issue_number: pr.number,
                        body: "## Guardian AI Review\n\n" + review
                    });
                    context.log.info("Smart review posted on PR #" + pr.number);
                }
                else {
                    context.log.warn("Smart review was empty for PR #" + pr.number);
                }
            }
            catch (reviewErr) {
                context.log.error("Failed to generate smart review: " + reviewErr.message);
            }
        }
        if (result.overall_score > 0.65) {
            try {
                const challengeRes = await fetch(ANALYSIS_ENGINE_URL + "/challenge/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        diff: diff.substring(0, 2000),
                        pr_title: pr.title,
                        repo_id: owner + "/" + repo
                    })
                });
                const challenge = await challengeRes.json();
                const questions = challenge.questions || [];
                const challengeComment = [
                    "## Comprehension Challenge",
                    "",
                    "Guardian flagged this PR as potentially AI-generated (" + Math.round(result.overall_score * 100) + "% probability).",
                    "Please answer these questions to verify authorship:",
                    "",
                    ...questions.map((q, i) => (i + 1) + ". " + q),
                    "",
                    "Reply with /guardian answer [your answers] within 48 hours.",
                    "",
                    "_Challenge ID: " + (challenge.challenge_id || "unknown") + "_"
                ].join("\n");
                await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
                    owner, repo, issue_number: pr.number, body: challengeComment
                });
                context.log.info("Comprehension challenge posted on PR #" + pr.number);
            }
            catch (challengeErr) {
                context.log.error("Failed to post challenge: " + challengeErr.message);
            }
        }
    }
    catch (err) {
        context.log.error("Error processing PR #" + pr.number + ": " + err.message);
    }
}
