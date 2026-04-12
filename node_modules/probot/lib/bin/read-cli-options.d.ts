import type { Options as PinoOptions } from "@probot/pino";
import type { Options } from "../types.js";
export declare function readCliOptions(args: string[]): Options & PinoOptions & {
    args: string[];
};
