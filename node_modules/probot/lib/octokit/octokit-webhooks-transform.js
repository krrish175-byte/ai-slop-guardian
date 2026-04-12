import { Context } from "../context.js";
/**
 * Probot's transform option, which extends the `event` object that is passed
 * to webhook event handlers by `@octokit/webhooks`
 * @see https://github.com/octokit/webhooks.js/#constructor
 */
export async function webhookTransform(options, event) {
    const octokit = (await options.octokit.auth({
        type: "event-octokit",
        event,
    }));
    const log = options.log.child({ name: "event", id: event.id });
    return new Context(event, octokit, log);
}
