import { createProbot } from "./create-probot.js";
const noop = () => { };
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
export async function createNodeMiddleware(appFn, { probot = createProbot(), webhooksPath } = {}) {
    const handlers = [];
    await probot.load(appFn, {
        cwd: process.cwd(),
        addHandler: (handler) => {
            handlers.push(handler);
        },
    });
    handlers.push(await probot.getNodeMiddleware({
        path: webhooksPath,
    }));
    const mainHandler = async (req, res, next = noop) => {
        try {
            for (const handler of handlers) {
                const result = await handler(req, res);
                if (result) {
                    return true;
                }
            }
        }
        catch (e) {
            probot.log.error(e);
            res.writeHead(500).end();
            return true;
        }
        next();
        return false;
    };
    return mainHandler;
}
