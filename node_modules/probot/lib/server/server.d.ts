import { Server as HttpServer } from "node:http";
import type { ApplicationFunction, Handler, HandlerFactory, ServerOptions } from "../types.js";
export declare const defaultWebhookPath = "/api/github/webhooks";
export declare const defaultWebhookSecret = "development";
export declare class Server {
    #private;
    constructor(options?: ServerOptions);
    addHandler(handler: Handler): void;
    loadHandlerFactory(appFn: HandlerFactory): Promise<void>;
    load(appFn: ApplicationFunction): Promise<void>;
    start(): Promise<HttpServer>;
    stop(): Promise<void>;
    get port(): number;
    get host(): string;
    static get version(): string;
    get version(): string;
}
