import { Probot } from "probot";
import { setupLabels } from "./services/labelManager";
import { handlePullRequest } from "./handlers/pullRequest";
import { handleIssueOpened } from "./handlers/issues";
import { handleCommentCreated } from "./handlers/comments";

export default (app: Probot) => {
  app.log.info("AI Slop Guardian is starting up...");

  app.on("installation.created", async (context) => {
    const repos = context.payload.repositories || [];
    for (const repo of repos) {
      const [owner, repoName] = repo.full_name.split("/");
      app.log.info(`Setting up labels for ${owner}/${repoName}`);
      try {
        await setupLabels(context.octokit as any, owner, repoName);
        app.log.info(`Labels created for ${owner}/${repoName}`);
      } catch (err: any) {
        app.log.error(`Label setup failed for ${owner}/${repoName}: ${err.message}`);
      }
    }
  });

  app.on(["pull_request.opened", "pull_request.synchronize"], handlePullRequest);
  app.on("issues.opened", handleIssueOpened);
  app.on("issue_comment.created", handleCommentCreated);
};
