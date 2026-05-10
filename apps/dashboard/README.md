# AI Slop Guardian Dashboard

The dashboard is the frontend visual interface for **AI Slop Guardian**, providing repository maintainers with a clear, birds-eye view of AI-generated content (slop) metrics across their projects.

Built to run alongside the `analysis-engine`, this dashboard aggregates PR metrics, contributor trust scores, and burnout indicators into actionable insights.

## Features

- **Overview Metrics**: Track the repository's overall "Slop Rate", total PRs scanned, and current threshold limits.
- **Contributor Trust Graph**: Visualize which contributors have a high trust score vs. those frequently submitting AI-generated code.
- **Burnout Risk Indicators**: Monitor how much time maintainers are projected to waste reviewing AI slop, calculating an overall maintainer burnout risk score.

## Tech Stack

This project is scaffolded with [Vite](https://vitejs.dev/) and uses:
- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4
- **Routing**: React Router DOM v7
- **Charts/Visualizations**: Recharts
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library

## Getting Started

### Prerequisites
Make sure you have Node.js (v20+) installed. You should ideally run this from the monorepo root via Turborepo, but you can also run it independently.

### Installation

Navigate to the `apps/dashboard` directory and install dependencies:

```bash
npm install
```

### Development

To start the development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

The app will typically be available at `http://localhost:5173`. 
*Note: Ensure the Python `analysis-engine` is running locally (usually on port `8000`) so the dashboard can fetch real data.*

### Build for Production

To build the project for production:

```bash
npm run build
```

This will run the TypeScript compiler and Vite's production build.

### Testing & Linting

To run the unit tests:
```bash
npm test
```

To run ESLint:
```bash
npm run lint
```

## Contributing

We welcome contributions! If you're participating in GSoC or just want to help, check out the `pages` and `components` directories. 

**Good First Issues for the Dashboard:**
- Enhancing chart tooltips in `TrustGraph.tsx`
- Adding a dark mode toggle
- Improving accessibility (ARIA labels) across the metrics cards in `Overview.tsx`
- Connecting mock components to live `analysis-engine` API endpoints

Please make sure `npm run lint` and `npm test` pass before submitting a Pull Request.
