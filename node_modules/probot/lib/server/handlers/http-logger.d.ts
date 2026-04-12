import type { IncomingMessage, ServerResponse } from "node:http";
import { type Options, type HttpLogger } from "pino-http";
import type { Logger } from "pino";
export declare function httpLogger(logger: Logger, options?: Options): HttpLogger<IncomingMessage, ServerResponse, string>;
