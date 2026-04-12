import { Octokit } from "@octokit/core";
import { paginateRest } from "@octokit/plugin-paginate-rest";
import { restEndpointMethods } from "@octokit/plugin-rest-endpoint-methods";
import { retry } from "@octokit/plugin-retry";
import { config } from "@probot/octokit-plugin-config";
import type { Constructor } from "../probot.js";
export declare const ProbotOctokit: typeof Octokit & Constructor<ReturnType<typeof retry> & ReturnType<typeof paginateRest> & ReturnType<typeof restEndpointMethods> & ReturnType<typeof config>>;
export type ProbotOctokit = InstanceType<typeof ProbotOctokit>;
