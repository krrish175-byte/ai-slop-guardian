import * as fs from "fs";
import * as path from "path";

export class WhitelistManager {
  private getFilePath(): string {
    return path.join(__dirname, "../../whitelist.json");
  }

  private readList(): Set<string> {
    try {
      if (fs.existsSync(this.getFilePath())) {
        const data = fs.readFileSync(this.getFilePath(), "utf-8");
        const list = JSON.parse(data);
        return new Set(list);
      }
    } catch (e) {
      console.error("Failed to read whitelist:", e);
    }
    return new Set();
  }

  private writeList(list: Set<string>) {
    try {
      fs.writeFileSync(this.getFilePath(), JSON.stringify(Array.from(list), null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to write whitelist:", e);
    }
  }

  async isWhitelisted(username: string): Promise<boolean> {
    const list = this.readList();
    return list.has(username);
  }

  async addToList(username: string) {
    const list = this.readList();
    list.add(username);
    this.writeList(list);
  }

  async removeFromList(username: string) {
    const list = this.readList();
    list.delete(username);
    this.writeList(list);
  }
}
