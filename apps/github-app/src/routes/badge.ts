import { Probot } from "probot";

export function setupBadgeRoutes(app: Probot) {
  const express = require("express");
  const router = express.Router();

  router.get("/:owner/:repo", async (req: any, res: any) => {
    const { owner, repo } = req.params;
    const score = 15;
    const color = score < 20 ? "4c9e4c" : score < 50 ? "e4a11b" : "d73a4a";
    const label = score < 20 ? "slop free" : score < 50 ? "slop" : "high slop";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="20">
      <rect width="80" height="20" fill="#555"/>
      <rect x="80" width="60" height="20" fill="#${color}"/>
      <text x="40" y="14" fill="#fff" font-size="11" text-anchor="middle">${label}</text>
      <text x="110" y="14" fill="#fff" font-size="11" text-anchor="middle">${score}%</text>
    </svg>`;
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "max-age=3600");
    res.send(svg);
  });

  router.get("/:owner/:repo/json", async (req: any, res: any) => {
    res.json({ score: 15, label: "slop free", color: "green" });
  });

  return router;
}
