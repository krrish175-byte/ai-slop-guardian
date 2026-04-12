import { Webhooks } from "@octokit/webhooks";
import { getErrorHandler } from "../helpers/get-error-handler.js";
import { webhookTransform } from "./octokit-webhooks-transform.js";
export function getWebhooks(options) {
    const webhooks = new Webhooks({
        log: options.log,
        secret: options.webhookSecret,
        transform: (event) => webhookTransform(options, event),
    });
    webhooks.onError(getErrorHandler(options.log));
    return webhooks;
}
