import { Context } from "probot";
import { analyzeContent } from "../services/analysisClient";
import { handleChallengeAnswer } from "./comprehensionChallenge";
import { handleSlashCommand } from "./slashCommands";

export async function handleCommentCreated(context: Context<"issue_comment.created">) {
  const comment = context.payload.comment;
  const { owner, repo } = context.repo();
  const body = comment.body.trim();

  if (!comment.user) return;

  // 1. Check for command answers
  if (body.startsWith("/guardian answer")) {
    await handleChallengeAnswer(context);
    return;
  }

  // 2. Delegate other /guardian commands to slashCommands
  if (body.startsWith("/guardian")) {
    if (comment.user.type !== "Bot") {
      await handleSlashCommand(context);
    }
    return;
  }

  if (comment.user.type === "Bot") return;

  // 3. Normal comment analysis
  try {
    const result = await analyzeContent({
      content: body,
      content_type: "comment",
      repo_id: owner + "/" + repo,
      contributor_login: comment.user.login,
      contributor_id: comment.user.id,
    });
    context.log.info("Comment score: " + result.overall_score + " -> " + result.label);
  } catch (err: any) {
    context.log.error("Error: " + err.message);
  }
}
