import type { IncomingMessage, ServerResponse } from "node:http";
import type { ApplicationFunction, MiddlewareOptions } from "./types.js";
/**
 * Create a Node/Express middleware.
 *
 * ```javascript
 * import { createServer } from "node:http"
 * import { createProbot, createNodeMiddleware } from "probot"
 *
 * const appFn = (app) => {
 *   app.on("issues.opened", async (context) => {
 *     const issueComment = context.issue({
 *       body: "Thanks for opening this issue!",
 *     });
 *     return context.octokit.issues.createComment(issueComment);
 *   });
 * };
 *
 * const middleware = await createNodeMiddleware(appFn, { probot: createProbot() });
 *
 * const server = createServer((req, res) => {
 *   middleware(req, res, () => {
 *     res.writeHead(404);
 *     res.end();
 *   });
 * });
 * ```
 */
export declare function createNodeMiddleware(appFn: ApplicationFunction, { probot, webhooksPath }?: MiddlewareOptions): Promise<(request: IncomingMessage, response: ServerResponse, next?: (err?: Error) => void) => boolean | void | Promise<void | boolean>>;
