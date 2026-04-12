import type { Handler, StripUndefined } from "../types.js";
import type { Env, ServerOptions } from "../types.js";
type SetupFactoryOptions = StripUndefined<Required<Pick<ServerOptions, "log" | "port" | "host">>> & Pick<ServerOptions, "request"> & {
    updateEnv?: (env: Env) => Env;
    SmeeClient?: {
        createChannel: () => Promise<string | undefined>;
    } | undefined;
};
export declare const setupAppFactory: (options: SetupFactoryOptions) => () => Promise<Handler>;
export {};
