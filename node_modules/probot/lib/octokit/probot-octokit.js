import { Octokit } from "@octokit/core";
import { enterpriseCompatibility } from "@octokit/plugin-enterprise-compatibility";
import { paginateRest } from "@octokit/plugin-paginate-rest";
import { restEndpointMethods } from "@octokit/plugin-rest-endpoint-methods";
import { retry } from "@octokit/plugin-retry";
import { throttling } from "@octokit/plugin-throttling";
import { config } from "@probot/octokit-plugin-config";
import { createProbotAuth } from "octokit-auth-probot";
import { probotRequestLogging } from "./octokit-plugin-probot-request-logging.js";
import { VERSION } from "../version.js";
const defaultOptions = {
    authStrategy: createProbotAuth,
    throttle: {
        enabled: true,
        onSecondaryRateLimit: (retryAfter, options, octokit) => {
            octokit.log.warn(`Secondary Rate limit hit with "${options.method} ${options.url}", retrying in ${retryAfter} seconds.`);
            return true;
        },
        onRateLimit: (retryAfter, options, octokit) => {
            octokit.log.warn(`Rate limit hit with "${options.method} ${options.url}", retrying in ${retryAfter} seconds.`);
            return true;
        },
    },
    userAgent: `probot/${VERSION}`,
};
export const ProbotOctokit = Octokit.plugin(throttling, retry, paginateRest, restEndpointMethods, enterpriseCompatibility, probotRequestLogging, config).defaults((instanceOptions) => {
    // merge throttle options deeply
    const options = {
        ...defaultOptions,
        ...instanceOptions,
        ...{
            throttle: { ...defaultOptions.throttle, ...instanceOptions?.throttle },
        },
    };
    return options;
});
