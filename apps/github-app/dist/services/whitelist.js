"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhitelistManager = void 0;
class WhitelistManager {
    constructor() {
        // In a real app, this would be a database. For local dev, we'll use a simple in-memory list or check repo config
        this.whitelistedUsers = new Set();
    }
    async isWhitelisted(username) {
        return this.whitelistedUsers.has(username);
    }
    async addToList(username) {
        this.whitelistedUsers.add(username);
    }
    async removeFromList(username) {
        this.whitelistedUsers.delete(username);
    }
}
exports.WhitelistManager = WhitelistManager;
