import type { Logger } from "pino";
import type { ProbotOctokit } from "./probot-octokit.js";
import type { ProbotWebhooks } from "../types.js";
type GetWebhooksOptions = {
    log: Logger;
    octokit: ProbotOctokit;
    webhookSecret: string;
};
export declare function getWebhooks(options: GetWebhooksOptions): ProbotWebhooks;
export {};
