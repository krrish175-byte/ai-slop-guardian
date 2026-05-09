"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeContent = analyzeContent;
const ANALYSIS_ENGINE_URL = process.env.ANALYSIS_ENGINE_URL || "http://localhost:8000";
async function analyzeContent(req) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    const response = await fetch(`${ANALYSIS_ENGINE_URL}/analyze/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
        signal: controller.signal,
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Analysis engine error ${response.status}: ${text}`);
    }
    clearTimeout(timeout);
    return response.json();
}
