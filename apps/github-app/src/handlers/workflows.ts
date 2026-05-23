import { Context } from "probot";

export async function handleWorkflowRunRequested(context: Context<"workflow_run.requested">) {
  const { owner, repo } = context.repo();
  const octokit = context.octokit as any;
  const workflowRun = context.payload.workflow_run;

  if (workflowRun.event !== "pull_request") {
    return;
  }

  const pullRequests = workflowRun.pull_requests || [];
  if (pullRequests.length === 0) {
    return;
  }

  const prNumber = pullRequests[0].number;
  context.log.info(`Workflow run requested for PR #${prNumber}. Evaluating safety for auto-approval...`);

  try {
    // 1. Fetch Pull Request details to analyze labels
    const prRes = await octokit.request("GET /repos/{owner}/{repo}/pulls/{pull_number}", {
      owner,
      repo,
      pull_number: prNumber
    });
    const pr = prRes.data;

    // 2. Check if the PR has been flagged with high slop
    const labels = pr.labels || [];
    const hasHighSlop = labels.some((l: any) => l.name === "ai-slop:high" || l.name === "ai-slop:medium");

    if (hasHighSlop) {
      context.log.warn(`PR #${prNumber} is flagged with high AI slop. Auto-approval of workflow runs is BLOCKED.`);
      return;
    }

    // 3. Check for any dangerous workflow file changes
    const filesRes = await octokit.request("GET /repos/{owner}/{repo}/pulls/{pull_number}/files", {
      owner,
      repo,
      pull_number: prNumber
    });
    const changedFiles = filesRes.data || [];
    const hasWorkflowChanges = changedFiles.some((f: any) => 
      f.filename.startsWith(".github/workflows/") || 
      f.filename.includes("secret")
    );

    if (hasWorkflowChanges) {
      context.log.warn(`PR #${prNumber} modifies CI workflows or sensitive configuration. Auto-approval BLOCKED.`);
      return;
    }

    // 4. Approve the workflow run
    context.log.info(`PR #${prNumber} is verified as safe. Automatically approving workflow run #${workflowRun.id}...`);
    await octokit.request("POST /repos/{owner}/{repo}/actions/runs/{run_id}/approve", {
      owner,
      repo,
      run_id: workflowRun.id
    });
    context.log.info(`Workflow run #${workflowRun.id} successfully approved.`);

  } catch (err: any) {
    context.log.error(`Failed to handle workflow run auto-approval: ${err.message}`);
  }
}
