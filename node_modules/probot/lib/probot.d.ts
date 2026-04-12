import type { RequestRequestOptions } from "@octokit/types";
import { createNodeMiddleware, type EmitterWebhookEvent as WebhookEvent } from "@octokit/webhooks";
import type { RedisOptions } from "ioredis";
import type { Logger } from "pino";
import { Lru } from "toad-cache";
import { type DeferredPromise } from "./helpers/create-deferred-promise.js";
import { ProbotOctokit } from "./octokit/probot-octokit.js";
import type { ApplicationFunction, ApplicationFunctionOptions, Options, ProbotWebhooks } from "./types.js";
import { type Server } from "./server/server.js";
export type Constructor<T = any> = new (...args: any[]) => T;
declare const UNINITIALIZED = 0;
declare const INITIALIZING = 1;
declare const INITIALIZED = 2;
type InitializationState = typeof UNINITIALIZED | typeof INITIALIZING | typeof INITIALIZED;
type OnHandler = ["on", any, any];
type OnAnyHandler = ["onAny", any];
type OnErrorHandler = ["onError", any];
export type State = {
    initializationState: InitializationState;
    initializedPromise: DeferredPromise<void>;
    initEventListeners: (OnHandler | OnAnyHandler | OnErrorHandler)[];
    cache: Lru<string> | null;
    octokit: ProbotOctokit | null;
    webhooks: ProbotWebhooks | null;
    log: Logger | null;
    logFormat?: "pretty" | "json";
    logLevelInString?: boolean;
    sentryDsn?: string | undefined;
    logLevel?: "trace" | "debug" | "info" | "warn" | "error" | "fatal";
    logMessageKey?: string | undefined;
    appId?: number | undefined;
    privateKey?: string | undefined;
    githubToken?: string | undefined;
    OctokitBase: typeof ProbotOctokit;
    port?: number | undefined;
    host?: string | undefined;
    baseUrl?: string | undefined;
    redisConfig?: RedisOptions | string | undefined;
    webhookPath: string;
    webhookSecret: string;
    request?: RequestRequestOptions | undefined;
    server?: Server | void;
};
export declare class Probot {
    #private;
    static defaults<S extends Constructor>(this: S, defaults: Options): {
        new (...args: any[]): {
            [x: string]: any;
        };
    } & S;
    constructor(options?: Options);
    getNodeMiddleware({ log, path, }?: {
        log?: Logger | undefined;
        path?: string | undefined;
    }): Promise<ReturnType<typeof createNodeMiddleware>>;
    auth(installationId?: number | undefined): Promise<ProbotOctokit>;
    load(appFn: ApplicationFunction | ApplicationFunction[], options?: ApplicationFunctionOptions): Promise<void>;
    get log(): Logger;
    on: ProbotWebhooks["on"];
    onAny: ProbotWebhooks["onAny"];
    onError: ProbotWebhooks["onError"];
    ready(): Promise<this>;
    receive(event: WebhookEvent): Promise<void>;
    static get version(): string;
    get version(): string;
    get webhooks(): ProbotWebhooks;
    get webhookPath(): string;
}
export {};
