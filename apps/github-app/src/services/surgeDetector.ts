export class SurgeDetector {
  private contributorHistory: Map<string, number[]> = new Map();
  private repoHistory: Map<string, number[]> = new Map();

  private CONTRIBUTOR_THRESHOLD = 5; // PRs per hour
  private REPO_THRESHOLD = 20; // PRs per hour

  /**
   * Records a PR submission and checks for surges.
   * Returns "contributor_surge" | "repo_flood" | null
   */
  checkSurge(repoId: string, contributorLogin: string): "contributor_surge" | "repo_flood" | null {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    // 1. Check Contributor Surge
    const userKey = `${repoId}:${contributorLogin}`;
    let userDates = this.contributorHistory.get(userKey) || [];
    userDates = userDates.filter(t => t > oneHourAgo);
    userDates.push(now);
    this.contributorHistory.set(userKey, userDates);

    if (userDates.length > this.CONTRIBUTOR_THRESHOLD) {
      return "contributor_surge";
    }

    // 2. Check Repo Flood
    let repoDates = this.repoHistory.get(repoId) || [];
    repoDates = repoDates.filter(t => t > oneHourAgo);
    repoDates.push(now);
    this.repoHistory.set(repoId, repoDates);

    if (repoDates.length > this.REPO_THRESHOLD) {
      return "repo_flood";
    }

    return null;
  }
}

export const surgeDetector = new SurgeDetector();
