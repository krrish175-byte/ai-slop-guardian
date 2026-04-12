import { AnalyzeResponse } from "./analysisClient";

export class CommentBuilder {
  buildReport(response: AnalyzeResponse): string {
    const scorePct = Math.round(response.overall_score * 100);
    const indicator = response.overall_score >= 0.85 ? "🔴" : 
                     response.overall_score >= 0.60 ? "🟠" : 
                     response.overall_score >= 0.40 ? "🟡" : "🟢";

    let report = `## 🛡️ AI Slop Guardian Report\n\n`;
    report += `| Signal | Value |\n`;
    report += `|--------|-------|\n`;
    report += `| **Overall AI probability** | **${scorePct}% ${indicator}** |\n`;
    
    for (const det of response.detectors) {
      const detScore = Math.round(det.score * 100);
      report += `| ${det.name} | ${detScore}% |\n`;
    }
    
    report += `| Contributor trust | ${response.contributor_trust_score}/100 |\n\n`;
    report += `**Verdict:** ${response.summary}\n\n`;
    
    report += `<details>\n`;
    report += `<summary>Detection details</summary>\n\n`;
    
    for (const det of response.detectors) {
      report += `#### ${det.name} Signals:\n`;
      for (const signal of det.signals) {
        report += `- ${signal}\n`;
      }
    }
    
    if (response.model_fingerprint && response.model_fingerprint !== "unknown") {
      report += `\n**Potential Origin:** ${response.model_fingerprint}\n`;
    }
    
    report += `</details>\n\n`;
    report += `*Override with \`/guardian approve\` · Whitelist with \`/guardian trust @username\`*`;

    return report;
  }
}
