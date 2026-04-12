import { Context } from "probot";
import { LabelManager } from "../services/labelManager";
import { WhitelistManager } from "../services/whitelist";

const labels = new LabelManager();
const whitelist = new WhitelistManager();

export async function handleSlashCommand(context: Context<"issue_comment.created">) {
  const comment = context.payload.comment;
  const { owner, repo, issue_number } = context.issue();
  const octokit = context.octokit as any;
  
  if (!comment.body.startsWith("/guardian")) return;

  // Check if user has permission (write or higher)
  try {
    if (!comment.user) return;
    
    const { data: permission } = await octokit.repos.getCollaboratorPermissionLevel({
      owner,
      repo,
      username: comment.user.login,
    });

    if (permission.permission !== "admin" && permission.permission !== "write") {
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number,
        body: `🚫 @${comment.user.login}, you do not have permission to run AI Slop Guardian commands.`,
      });
      return;
    }
  } catch (err) {
    return;
  }

  const args = comment.body.split(" ");
  const command = args[1];

  switch (command) {
    case "approve":
      await labels.applyLabel(context, "guardian-approved");
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number,
        body: `✅ PR approved by @${comment.user.login}. Labels updated.`,
      });
      break;

    case "trust":
      const targetUser = args[2]?.replace("@", "");
      if (targetUser) {
        await whitelist.addToList(targetUser);
        await octokit.issues.createComment({
          owner,
          repo,
          issue_number,
          body: `🛡️ @${targetUser} has been added to the trusted contributor whitelist by @${comment.user.login}.`,
        });
      }
      break;

    case "status":
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number,
        body: `📊 **AI Slop Guardian Status**\n- Service: Online\n- Threshold: 72%\n- Mode: Label & Triage`,
      });
      break;

    default:
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number,
        body: `❓ Unknown command. Available: \`/guardian approve\`, \`/guardian trust @user\`, \`/guardian status\``,
      });
  }
}
