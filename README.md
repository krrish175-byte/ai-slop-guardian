<div align="center">

<img src="https://github.com/user-attachments/assets/7385f75d-7245-4ef1-9beb-9dd8d6c595cb" width="120" height="120" alt="AI Slop Guardian Logo"/>

# AI Slop Guardian

**The trust layer for open source.**

Automatically detect, label, and challenge AI-generated contributions before they waste your time.

[![GitHub App](https://img.shields.io/badge/GitHub%20App-Install%20Free-7F77DD?style=for-the-badge&logo=github)](https://github.com/apps/ai-slop-guardian)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.9+-blue?style=for-the-badge&logo=python)](services/analysis-engine)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](apps/github-app)

</div>

---

## The Problem

Open source is under attack — not by hackers, but by AI slop.

- **curl** reported 20%+ of bug reports are AI-generated garbage
- **Excalidraw** saw 2× PR volume in a single quarter from vibe-coders
- Maintainers are burning out reviewing PRs written by people who didn't even read the code

The worst part? There was no tool to stop it. Until now.

---

## What Guardian Does

The moment a PR, issue, or comment is submitted to your repo, Guardian:

1. **Analyzes** it using a 4-detector ML ensemble (perplexity, embeddings, patterns, burstiness)
2. **Labels** it automatically — `ai-slop:high`, `ai-slop:medium`, `ai-slop:low`
3. **Challenges** suspected AI authors with 3 questions only the real author could answer
4. **Reviews** the code and drafts a review for you to post with one click
5. **Protects** your repo from PR flood attacks (surge detection)

---

## Install in 30 Seconds

1. [Install the GitHub App](https://github.com/apps/ai-slop-guardian) on your repo
2. That's it. Guardian starts protecting your repo immediately.

No config required. No API keys. No setup.

---

## See It in Action

When a suspicious PR comes in, Guardian posts three things automatically:

### 1. Detection Report

![Detection Report](https://github.com/user-attachments/assets/9d6f3e4e-4f1e-4363-8aeb-8f7a932d0c2e)

### 2. Comprehension Challenge

![Challenge](https://github.com/user-attachments/assets/6b8e3d2f-4e1e-4c3d-8e4d-6e4d580d3ce2)

### 3. AI-Written Code Review (draft for maintainer)

Guardian AI Review
The PR modifies the authentication middleware to add rate limiting.
The implementation has a potential race condition on line 23 when multiple requests arrive simultaneously...

---

## Detection Methodology

Guardian uses a weighted ensemble of 4 detectors:

| Detector | Weight | How it works |
|----------|--------|--------------|
| **Perplexity** | 35% | GPT-2 statistical analysis — AI text is unnaturally predictable |
| **Embedding similarity** | 30% | Compares style against YOUR repo's own baseline |
| **Pattern matching** | 25% | 20+ AI tell-tale phrases ("feel free to", "certainly", etc.) |
| **Burstiness** | 10% | AI text has unnaturally uniform sentence lengths |

What makes Guardian unique: it indexes your entire codebase and checks if new PRs match **your repo's** writing style. A PR that looks human in general might look alien to your specific project.

---

## Slash Commands

| Command | What it does |
|---------|-------------|
| `/guardian approve` | Override flag, add `guardian-approved` label |
| `/guardian trust @username` | Permanently whitelist a contributor |
| `/guardian scan` | Re-analyze the current PR |
| `/guardian status` | Show repo stats |
| `/guardian answer [text]` | Answer a comprehension challenge |

---

## Labels Applied Automatically

| Label | Score | Meaning |
|-------|-------|---------|
| `ai-slop:high` | >85% | Almost certainly AI-generated |
| `ai-slop:medium` | 60–85% | Likely AI-generated |
| `ai-slop:low` | 40–60% | Possibly AI-assisted |
| `first-time-contributor` | Trust <30 | New account, extra scrutiny |
| `guardian-approved` | — | Manually cleared by maintainer |
| `human-verified` | — | Passed comprehension challenge |

---

## Self-Hosting

```bash
git clone https://github.com/krrish175-byte/ai-slop-guardian
cd ai-slop-guardian

# Copy env files
cp apps/github-app/.env.example apps/github-app/.env
cp services/analysis-engine/.env.example services/analysis-engine/.env

# Fill in your GitHub App credentials and Groq API key
# Then start everything
docker-compose up
```

See [docs/self-hosting.md](docs/self-hosting.md) for full setup guide.

---

## Contributing

Guardian is open source and we welcome contributions.

```bash
git clone https://github.com/krrish175-byte/ai-slop-guardian
cd ai-slop-guardian
npm install
cd services/analysis-engine && pip install -r requirements.txt
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines and testing instructions.

**Good first issues:** improving pattern detection phrases, adding new languages to the style indexer, improving the dashboard UI.

---

## Roadmap

- [x] Core AI detection (perplexity + embeddings + patterns)
- [x] Auto-labeling
- [x] Comprehension challenges
- [x] Smart review writer
- [x] Surge/DDoS protection
- [ ] VS Code extension
- [ ] GitHub Marketplace listing
- [ ] Cross-repo DNA matching
- [ ] Maintainer burnout dashboard
- [ ] Contributor trust graph

---

## License

MIT © 2026 Krrish Biswas

---

<div align="center">

Built with frustration by a developer tired of reviewing AI garbage.

**[Install Guardian →](https://github.com/apps/ai-slop-guardian)**

</div>
