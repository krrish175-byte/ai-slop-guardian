import type { RedisOptions } from "ioredis";
import type { Logger } from "pino";
import type { ThrottlingOptions } from "@octokit/plugin-throttling";
type Options = {
    log: Logger;
    redisConfig?: RedisOptions | string | undefined;
};
export declare function getOctokitThrottleOptions(options: Options): Promise<ThrottlingOptions>;
export {};
