import fs from "node:fs";
import type { Logger } from "pino";
import type { OctokitOptions, PackageJson } from "./types.js";
import { updateEnv } from "./helpers/update-env.js";
export declare class ManifestCreation {
    #private;
    constructor(options?: {
        updateEnv?: typeof updateEnv;
    });
    get pkg(): PackageJson;
    createWebhookChannel({ SmeeClient: SmeeClientParam, log }?: {
        SmeeClient: any;
        log?: Logger | undefined;
    }): Promise<string | undefined>;
    getManifest(options: {
        pkg: PackageJson;
        baseUrl: string;
        readFileSync?: typeof fs.readFileSync;
    }): string;
    createAppFromCode(code: string, probotOptions?: OctokitOptions | undefined): Promise<any>;
    get createAppUrl(): string;
}
