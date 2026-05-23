"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhitelistManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class WhitelistManager {
    getFilePath() {
        return path.join(__dirname, "../../whitelist.json");
    }
    readList() {
        try {
            if (fs.existsSync(this.getFilePath())) {
                const data = fs.readFileSync(this.getFilePath(), "utf-8");
                const list = JSON.parse(data);
                return new Set(list);
            }
        }
        catch (e) {
            console.error("Failed to read whitelist:", e);
        }
        return new Set();
    }
    writeList(list) {
        try {
            fs.writeFileSync(this.getFilePath(), JSON.stringify(Array.from(list), null, 2), "utf-8");
        }
        catch (e) {
            console.error("Failed to write whitelist:", e);
        }
    }
    async isWhitelisted(username) {
        const list = this.readList();
        return list.has(username);
    }
    async addToList(username) {
        const list = this.readList();
        list.add(username);
        this.writeList(list);
    }
    async removeFromList(username) {
        const list = this.readList();
        list.delete(username);
        this.writeList(list);
    }
}
exports.WhitelistManager = WhitelistManager;
