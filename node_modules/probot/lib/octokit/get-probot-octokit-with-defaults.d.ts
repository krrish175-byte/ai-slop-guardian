import type { RequestRequestOptions } from "@octokit/types";
import type { RedisOptions } from "ioredis";
import type { Logger } from "pino";
import type { Lru } from "toad-cache";
import { ProbotOctokit } from "./probot-octokit.js";
type Options = {
    cache: Lru<string>;
    Octokit: typeof ProbotOctokit;
    log: Logger;
    githubToken?: string | undefined;
    appId?: number | undefined;
    privateKey?: string | undefined;
    redisConfig?: RedisOptions | string | undefined;
    baseUrl?: string | undefined;
    request?: RequestRequestOptions | undefined;
};
/**
 * Returns an Octokit instance with default settings for authentication. If
 * a `githubToken` is passed explicitly, the Octokit instance will be
 * pre-authenticated with that token when instantiated. Otherwise Octokit's
 * app authentication strategy is used, and `options.auth` options are merged
 * deeply when instantiated.
 *
 * Besides the authentication, the Octokit's baseUrl is set as well when run
 * against a GitHub Enterprise Server with a custom domain.
 */
export declare function getProbotOctokitWithDefaults(options: Options): Promise<typeof ProbotOctokit>;
export {};
