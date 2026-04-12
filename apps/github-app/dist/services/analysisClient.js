"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisClient = void 0;
const axios_1 = __importDefault(require("axios"));
class AnalysisClient {
    constructor() {
        this.baseUrl = process.env.ANALYSIS_ENGINE_URL || "http://localhost:8000";
    }
    async analyze(request) {
        const response = await axios_1.default.post(`${this.baseUrl}/analyze/`, request);
        return response.data;
    }
    async indexRepo(request) {
        const response = await axios_1.default.post(`${this.baseUrl}/index-repo/`, request);
        return response.data;
    }
    async health() {
        const response = await axios_1.default.get(`${this.baseUrl}/health/`);
        return response.data;
    }
}
exports.AnalysisClient = AnalysisClient;
