import { Context } from "probot";

export async function fetchContributorHistory(
  context: Context<any>,
  owner: string,
  repo: string,
  login: string
): Promise<string[]> {
  try {
    // Fetch last 10 PRs from this user in this repo
    // Note: In a real app we might want to check across all repos where Guardian is installed
    const response = await context.octokit.request("GET /repos/{owner}/{repo}/pulls", {
      owner,
      repo,
      state: "all",
      creator: login,
      per_page: 10
    });

    const prs = response.data;
    // Map to bodies (PR descriptions)
    return prs.map((pr: any) => pr.body || "").filter((body: string) => body.length > 20);
  } catch (err: any) {
    context.log.error(`Failed to fetch history for ${login}: ${err.message}`);
    return [];
  }
}
