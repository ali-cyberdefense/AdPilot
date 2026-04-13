# AdPilot — Claude Code Instructions

## Project Overview
AdPilot is an AI-powered Amazon PPC dashboard. Full blueprint is in `ADPILOT_ARCHITECTURE.md`.

## Build System
This project follows a strict checkpoint system. **Never skip ahead or combine checkpoints.**
At every ⏸ STOP, pause and wait for Ali's explicit approval before proceeding.

## Current Status
- ✅ Checkpoint 1 — Project Setup (Vite + React + Tailwind + folder structure)
- ✅ Checkpoint 2 — Authentication (Supabase Auth, Google + email, protected routes)
- ✅ Checkpoint 3 — Upload & Parse (drag-drop UI, full report parser, Supabase storage)
- ✅ Checkpoint 4 — Insight Engine (all 10 rules, structured summary, Supabase storage)
- ✅ Checkpoint 5 — Dashboard Charts (MetricsSummary + 6 charts wired into full grid)
- ✅ Checkpoint 6 — Insight Cards UI (styled cards, severity colors, expandable detail panels)
- ✅ Checkpoint 7 — AI Chat Panel (slide-out panel, OpenAI GPT-4o, typing indicator, starter prompts)
- ⬜ Checkpoint 8 — UI Polish & Dark Mode
- ⬜ Checkpoint 9 — Deployment

## Key Decisions Made
- Dark mode default (`bg-gray-950` base)
- ACOS stored as decimal internally (0.28 = 28%), displayed as percentage in UI
- OpenAI calls go through `/api/chat.js` Vercel serverless — never directly from browser
- Supabase bulk inserts chunked at 400 rows to avoid request size limits
- `xlsx` library used for file parsing (known ReDoS vuln, acceptable for private dashboard)
- Report data held in `ReportContext` (in-memory for session, persisted to Supabase)

## Tech Notes
- Node: installed at `/opt/homebrew/bin/node` (v25.9.0) — always use `export PATH="/opt/homebrew/bin:$PATH"`
- Run dev: `npm run dev` → localhost:5173
- Supabase schema: `supabase/schema.sql` (must be run manually in Supabase SQL Editor)
- Brand name in campaign parser: "Renanim" | Competitor: "Sven & Son"

## PPC Rules
Do NOT change insight thresholds or campaign detection patterns without asking Ali first.
