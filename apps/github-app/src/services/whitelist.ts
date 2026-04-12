import { Context } from "probot";

export class WhitelistManager {
  // In a real app, this would be a database. For local dev, we'll use a simple in-memory list or check repo config
  private whitelistedUsers: Set<string> = new Set();

  async isWhitelisted(username: string): Promise<boolean> {
    return this.whitelistedUsers.has(username);
  }

  async addToList(username: string) {
    this.whitelistedUsers.add(username);
  }

  async removeFromList(username: string) {
    this.whitelistedUsers.delete(username);
  }
}
