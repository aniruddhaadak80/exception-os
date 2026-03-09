# Exception OS

Exception OS is a demo-ready operating system for teams that need fewer dashboards and faster decisions. It ingests operational signals, detects exceptions that require human judgment, generates structured decision briefs, and routes them into a Notion-centered workflow.

This repository contains:

- A polished Next.js demo app for the Exception OS dashboard
- A local simulation engine for signals, exceptions, and decisions
- Product documentation for the feature spec and architecture
- A challenge-ready narrative aligned with the Notion MCP judging criteria

## Why this project fits the challenge

Most AI productivity tools summarize noise. Exception OS focuses on the smaller set of events that actually need executive attention. Notion MCP is the intended system of record for signals, playbooks, decisions, and approvals.

## Local development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Demo flow

1. View the live operations board.
2. Review the active exception queue.
3. Trigger a new simulated incident from the dashboard.
4. Inspect the generated decision brief and recommended actions.

## Project structure

- `src/app` app routes and API endpoints
- `src/components` UI components
- `src/lib` simulation engine and shared types
- `docs` feature spec and architecture documents

## Current implementation scope

This version is a self-contained demo. It does not require external authentication or paid APIs. The Notion MCP integration is represented in the architecture and adapter boundaries so the demo can evolve into a production integration without redesigning the core system.