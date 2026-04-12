import type { Logger } from "pino";
import type { ApplicationFunction, Env } from "./types.js";
import type { ProbotOctokit } from "./octokit/probot-octokit.js";
import { Server } from "./server/server.js";
import { updateEnv } from "./helpers/update-env.js";
type AdditionalOptions = {
    env?: Env;
    Octokit?: typeof ProbotOctokit;
    log?: Logger;
    updateEnv?: typeof updateEnv;
    SmeeClient?: {
        createChannel: () => Promise<string | undefined>;
    };
};
/**
 *
 * @param appFnOrArgv set to either a probot application function: `(app) => { ... }` or to process.argv
 */
export declare function run(appFnOrArgv: ApplicationFunction | string[], additionalOptions?: AdditionalOptions): Promise<Server>;
export {};
