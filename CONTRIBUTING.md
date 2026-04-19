# Contributing to AI Slop Guardian

First off, thank you for considering contributing to AI Slop Guardian! It's people like you that make OS ecosystems safer and more human.

This project is a monorepo managed by [Turborepo](https://turbo.build/repo). It contains the following core components:

- **`apps/github-app`**: A Probot-based GitHub App that listens to PR events.
- **`apps/dashboard`**: A React interface for visualizing slop analytics.
- **`apps/vscode-extension`**: IDE-level detection for contributors.
- **`services/analysis-engine`**: A Python FastAPI service that handles the heavy lifting of slop detection.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18 or later (npm v9+)
- **Python**: v3.8 or later
- **Turbo**: Global installation is recommended (`npm install -g turbo`)

### Local Setup

1. **Fork and Clone** the repository:
   ```bash
   git clone https://github.com/your-username/ai-slop-guardian.git
   cd ai-slop-guardian
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set up Analysis Engine**:
   ```bash
   cd services/analysis-engine
   python -m venv venv
   source venv/bin/activate # On Windows: .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

### 🗝️ Environment Variables

You'll need to set up environment variables for the components you're working on.

#### GitHub App (`apps/github-app/.env`)
Copy `.env.example` to `.env` and fill in:
- `APP_ID`: Your GitHub App ID
- `PRIVATE_KEY_PATH`: Path to your private key file
- `WEBHOOK_SECRET`: Your webhook secret
- `ANALYSIS_ENGINE_URL`: Defaults to `http://localhost:8000`

#### Analysis Engine (`services/analysis-engine/.env`)
Create a `.env` file with:
- `GROQ_API_KEY`: Your Groq API key (for Llama 3.3 intelligence)

---

## 🛠️ Development Workflow

### Running the Full Stack
From the root directory:
```bash
npm run dev
```
This will start the GitHub App, Dashboard, and Analysis Engine simultaneously using Turbo.

### Running Specific Components
- **GitHub App**: `npm run dev --filter github-app`
- **Dashboard**: `npm run dev --filter dashboard`
- **Analysis Engine**: `cd services/analysis-engine && uvicorn main:app --reload`

---

## 📜 Coding Standards

### TypeScript (Apps)
- Use functional components and hooks for the dashboard.
- Ensure all new features are properly typed.
- Follow the existing ESLint configuration.

### Python (Services)
- Use type hints for all function signatures.
- Follow PEP 8 style guidelines.
- Add docstrings to new detectors or utility functions.

---

## 🤝 Pull Request Process

1. **Create a Branch**: Use descriptive names like `feat/new-detector` or `fix/webhook-crash`.
2. **Commit Often**: Small, atomic commits are preferred.
3. **Write a Description**: Explain *what* you changed and *why*.
4. **Pass CI**: Ensure that `npm test` passes locally before pushing.

---

## 🛡️ Trust and Safety

As this is a project focused on trust, we expect all contributors to:
- Be respectful and professional.
- Disclose any potential bias in detection algorithms.
- Avoid using AI to write code for this repo without thorough human verification (ironic, we know, but quality matters!).

---

## 📄 License

By contributing to AI Slop Guardian, you agree that your contributions will be licensed under its ISC License.
