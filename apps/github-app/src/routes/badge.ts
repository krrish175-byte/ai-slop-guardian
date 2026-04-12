import { Probot } from "probot";
import axios from "axios";

const ANALYSIS_ENGINE_URL = process.env.ANALYSIS_ENGINE_URL || "http://localhost:8000";

export function setupBadgeRoutes(app: Probot) {
  const router = app.getRouter("/badge");

  router.get("/:owner/:repo", async (req, res) => {
    const { owner, repo } = req.params;
    const repoId = `${owner}/${repo}`;

    try {
      // Fetch slop data from analysis engine
      const response = await axios.get(`${ANALYSIS_ENGINE_URL}/analytics/${repoId}/slop-rate`);
      const { label, color } = response.data;

      // Shields.io style SVG generation
      // We'll use a simple SVG template for the badge
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="120" height="20">
          <linearGradient id="b" x2="0" y2="100%">
            <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
            <stop offset="1" stop-opacity=".1"/>
          </linearGradient>
          <mask id="a">
            <rect width="120" height="20" rx="3" fill="#fff"/>
          </mask>
          <g mask="url(#a)">
            <path fill="#555" d="M0 0h60v20H0z"/>
            <path fill="${getHexColor(color)}" d="M60 0h60v20H60z"/>
            <path fill="url(#b)" d="M0 0h120v20H0z"/>
          </g>
          <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
            <text x="30" y="15" fill="#010101" fill-opacity=".3">slop status</text>
            <text x="30" y="14">slop status</text>
            <text x="90" y="15" fill="#010101" fill-opacity=".3">${label}</text>
            <text x="90" y="14">${label}</text>
          </g>
        </svg>
      `.trim();

      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.status(200).send(svg);
    } catch (err) {
      res.status(500).send("Error generating badge");
    }
  });

  router.get("/:owner/:repo.json", async (req, res) => {
    const { owner, repo } = req.params;
    const repoId = `${owner}/${repo}`;

    try {
      const response = await axios.get(`${ANALYSIS_ENGINE_URL}/analytics/${repoId}/slop-rate`);
      res.json(response.data);
    } catch (err) {
      res.status(500).json({ error: "Error fetching slop data" });
    }
  });
}

function getHexColor(color: string): string {
  switch (color) {
    case "brightgreen": return "#4c1";
    case "yellow": return "#dfb317";
    case "red": return "#e05d44";
    case "inactive": return "#9f9f9f";
    default: return "#9f9f9f";
  }
}
