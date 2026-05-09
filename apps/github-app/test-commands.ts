import { handleSlashCommand } from "./src/handlers/slashCommands";
import { Context } from "probot";

async function test() {
  const mockContext: any = {
    payload: {
      comment: {
        body: "/guardian approve",
        user: { login: "testuser", type: "User" }
      }
    },
    issue: () => ({ owner: "testowner", repo: "testrepo", issue_number: 1 }),
    octokit: {
      request: async (route: string, params: any) => {
        console.log(`Mock octokit.request called with route: ${route}`, params);
        if (route.startsWith("GET /repos/{owner}/{repo}/collaborators")) {
          return { data: { permission: "write" } };
        }
        return { data: {} };
      }
    }
  };

  console.log("Testing /guardian approve");
  await handleSlashCommand(mockContext as unknown as Context<"issue_comment.created">);
  console.log("Test complete.");
}

test().catch(console.error);
