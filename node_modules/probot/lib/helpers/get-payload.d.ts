import type { IncomingMessage } from "node:http";
export declare function getPayload(request: IncomingMessage): Promise<string>;
export declare function getPayloadFromRequestStream(request: IncomingMessage): Promise<Uint8Array>;
