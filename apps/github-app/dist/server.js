"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const probot_1 = require("probot");
const index_1 = __importDefault(require("./index"));
(0, probot_1.run)(index_1.default).catch((err) => {
    console.error("Failed to start:", err);
    process.exit(1);
});
