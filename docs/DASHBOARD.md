# Dashboard (TranzMit Engineering) - Overview

This document describes the Dashboard page in the Live Call Insight project. It explains what the page does, the React components and hooks it uses, the libraries and UI primitives, the backend APIs it calls and how responses are consumed, runtime and debugging tips, and suggested next steps.

## Purpose

The Dashboard is the main operational UI for monitoring live AI-assisted call analysis. It surfaces:
- High-level metrics from backend aggregation (total calls, avg call duration, avg sentiment, avg AI latency).
- Recent call transcript snippets and a live-feel transcript feed.
- Data-capture quality metrics derived in the frontend from recent parsed conversations.
- Visualizations: concerns pie chart, latency gauge, pivot table, and recent calls list.
- Quick access to recent conversations and a call summary panel.

The Dashboard integrates both backend-provided metrics and frontend-derived metrics for quick situational awareness.

## Main entry point

- `src/pages/Index.tsx` simply mounts the `Dashboard` component.
- `src/components/Dashboard.tsx` contains the full dashboard page implementation.

## High-level component structure

- Dashboard.tsx (top-level)
  - Uses `useEffect` to load primary dashboard data and recent calls.
  - Contains layout: metric cards, transcript feed, concerns pie, latency gauge, recent conversations, pivot table, etc.
  - Computes frontend-only "data capture" metrics from the `/logs` payload using `computeDataCaptureMetrics`.

- Subcomponents used inside Dashboard:
  - `MetricsCard` - small stat card with icon, value, subtitle and trend.
  - `LatencyGauge` - radial gauge that visualizes average AI latency.
  - `TranscriptFeed` - animated live transcript list used for the streaming demo feel.
  - `RecentConversations` - list of recent parsed conversation summaries (UI component).
  - `ConcernsPieChart` - pie chart summarizing top concerns (visualization component).
  - `RealTimePivotTable` - interactive pivot table (likely powered by local CSV/pivot data endpoint).
  - `CustomCursor`, `BackgroundAnimation` - UI polish components for the page.

All components are implemented under `src/components/` and use the shared UI primitives in `src/components/ui/`.

## Libraries & frameworks used

- React + TypeScript (project base).
- framer-motion for smooth animations and transitions.
- lucide-react for icons.
- Tailwind CSS / utility classes for styling (via `tailwind.config.ts`).
- Custom UI primitives (Radix-inspired components) in `src/components/ui/` such as `Card`, `Select`, `Tabs`, etc.
- Charting components used in subcomponents (e.g., `ConcernsPieChart`) — check the component for the charting library (e.g., recharts, chart.js, or d3).
- Backend uses Flask (Python) with endpoints serving JSON for metrics, logs, sentiment, and LangExtract analysis.
- LangExtract (backend) for extraction/visualization when analyzing specific transcripts.

## Data flow & backend APIs

The Dashboard consumes these backend endpoints (all hosted by the backend Flask server at `VITE_API_BASE_URL` - default configured in `.env`):

- `GET /dashboard_with_convo` (used by `fetchDashboardData`):
  - Purpose: returns aggregated dashboard metrics plus the latest conversation summary and the latest conversation transcript array. This is the primary fast endpoint used to populate the dashboard and the live-feel transcript.
  - Example response shape:
    {
      metrics: {
        total_calls: number,
        average_call_duration: number, // seconds
        average_sentiment_score: number, // -1..+1
        average_ai_response_latency: number, // seconds (float)
        latest_call_summary: { filename, stream_sid, call_started, call_ended, duration_seconds, sentiment, concerns, overview },
        // ...other aggregate fields
      },
      latest_conversation: [ { speaker, text, timestamp }, ... ]
    }
  - How Dashboard uses it: sets `dashboardData`, seeds the `TranscriptFeed` with the `latest_conversation` (first few messages), and drives the `MetricsCard` values. The `LatencyGauge` takes `metrics.average_ai_response_latency` and converts it to ms.

- `GET /logs?n=<N>` (used by Dashboard to compute front-end data capture metrics):
  - Purpose: returns the last N parsed conversations (JSON objects with `summary` and `conversation` arrays). The frontend computes additional metrics such as completion rate, field capture accuracy, abandonment rate, confirmation rate, etc., from these logs.
  - Example returned item:
    {
      summary: { filename: string, stream_sid: string, call_started: string, call_ended: string, duration_seconds: number, ... },
      conversation: [ { speaker: 'user'|'ai', text: string, timestamp: string }, ... ]
    }
  - Dashboard usage: `apiJson('/logs')` -> `computeDataCaptureMetrics(list)` to calculate frontend-only metrics. If logs are missing or tiny, the Dashboard falls back to deterministic demo metrics.

- `GET /list_transcripts` (used in other pages, not dashboard):
  - Purpose: lists available transcript assets from backend `transcripts/` and `convoJson/` directories. Useful for the LangExtract page to pick a transcript for extraction.

- `GET /analyze/<filename>` (LangExtract flow):
  - Purpose: run LangExtract analysis (server-side) on the given transcript file (supports `.json` in `convoJson/` and `.txt` in `transcripts/`) and return extraction results + generated visualization HTML. Not used directly by Dashboard but by LangExtract UI.

- `GET /sentiment_flow/<filename>` (used in CallAnalytics & timeline visualizations):
  - Purpose: return per-sentence sentiment scores for user and AI sentences. Accepts a filename (often normalized to a `.json` under `convoJson/`). The returned object has `user` and `ai` arrays of {index, score}.
  - Dashboard does not directly call this endpoint, but other pages (CallAnalytics) rely on it.

- `POST /refresh` (manual refresh):
  - Purpose: triggers backend to re-download logs from S3 and re-parse them (slow). Dashboard exposes a refresh button that calls this endpoint.

- `GET /cache/status` and `POST /cache/clean` (maintenance):
  - Purpose: check LangExtract cache health and allow cleanup. Not directly used by Dashboard UI.

Backend behavior notes
- Backend resolves `.json` files from `convoJson/` and `.txt` from `transcripts/` when asked to analyze a transcript.
- LangExtract analysis (`analysis.analyze_conversation_with_langextract`) uses a caching mechanism that stores results in `backend/langextract_cache/` keyed by filename+mtime+hash. Visualizations are rendered and saved under the cache.
- Sentiment flow is implemented with heuristics and optional use of the Gemini API. If the API key is absent, the sentiment endpoint falls back to heuristics and persists a disk cache under `convoJson/_sentiment_cache`.

## React logic highlights

- Data fetching:
  - `fetchDashboardData()` uses `apiJson('/dashboard_with_convo')`.
  - `apiJson('/logs')` is used to fetch recent parsed conversations for frontend-only metrics.
  - The code uses `useEffect` to run initial fetches and set local state.

- Derived metrics and fallbacks:
  - `computeDataCaptureMetrics` scans `conversation` arrays for emails, phone, PAN, name patterns, retries and confirmations. It returns rates used in `MetricsCard` components.
  - `maybeDemoMetrics` selects deterministic demo metrics for tiny or extreme samples (avoid noisy or misleading numbers).
  - Demo label is shown when frontend uses fallback/demo data.

- Live-feel transcript:
  - Dashboard seeds `TranscriptFeed` with `latest_conversation` from `/dashboard_with_convo` and then uses a `setInterval` to append messages every 2 seconds until the conversation is fully displayed.

- Role-based masking:
  - If the logged-in user role is `'user'` (non-developer), some sensitive metrics are masked/obfuscated in the UI (`maskedMetrics`) while still allowing the page to function.

## Run & debug

Prerequisites
- Node (for frontend dev) and Python 3.11+ for backend.
- Backend dependencies: see `backend/requirements.txt` (Flask, langextract, google-generative-ai wrapper, pandas, python-dotenv, etc.)
- Set environment variables in `backend/.env` for Gemini API key if you want LangExtract/sentiment model access.

Start backend (development)
```bash
# from repo root
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# set GEMINI_API_KEY in backend/.env or export it
python3 app.py
```

Start frontend (development)
```bash
# from repo root
npm install    # or pnpm install / yarn install depending on your workflow
npm run dev
# open the Vite dev URL (usually http://localhost:5173)
```

Debugging tips
- If dashboard metrics are empty, check backend log output and ensure `/dashboard_with_convo` returns a `metrics` object.
- The frontend computes additional metrics from `/logs`; if this endpoint returns an empty list, the page will show demo metrics. Check `backend/routes/parser.py` and `routes/s3_downloader.py` if logs aren't present.
- LangExtract analysis requires a valid `GEMINI_API_KEY` and will save visualization HTML to disk; check `backend/langextract_cache/` for cached entries.
- Sentiment API also stores caches under `backend/convoJson/_sentiment_cache`.

## File map (key files)
- Frontend
  - `src/pages/Index.tsx` — mounts `Dashboard`.
  - `src/components/Dashboard.tsx` — main page; fetches `/dashboard_with_convo` and `/logs` and renders subcomponents.
  - `src/components/MetricsCard.tsx`, `LatencyGauge.tsx`, `TranscriptFeed.tsx`, `RecentConversations.tsx`, `ConcernsPieChart.tsx`, `RealTimePivotTable.tsx` — UI parts used by Dashboard.
  - `src/lib/api.ts` — small wrapper for `fetch` used across the app.
  - `src/contexts/AuthContext.tsx` — provides `user.role` used for masking.

- Backend
  - `backend/app.py` — Flask application; endpoints: `/dashboard_with_convo`, `/dashboard`, `/logs`, `/analyze/<filename>`, `/list_transcripts`, `/sentiment_flow/<filename>`, `/refresh`, `/cache/*`.
  - `backend/analysis.py` — LangExtract analysis wrapper, caching, visualization generation.
  - `backend/routes/sentiment_flow.py` — builds / caches per-sentence sentiment scores, using heuristics or Gemini.
  - `backend/routes/parser.py` & `routes/s3_downloader.py` — log parsing and S3 download logic used for building parsed conversations.

## Next steps & suggestions
- If you want Dashboard to show per-turn sentiment over time inline, add a small chart component that calls `/sentiment_flow/<filename>` using `dashboardData.metrics.latest_call_summary.filename`.
- Add a toggle to the UI to switch between real metrics and demo metrics for easier demos.
- Expand `RealTimePivotTable` with server-driven filters to query pivot data (`/pivot_data` already serves CSV).
- Add server health endpoints and graceful retry UI for long-running `/refresh` operations.

---

If you'd like, I can also:
- Generate a short visual diagram for the data flow.
- Add a `docs/ARCHITECTURE.md` that documents backend cache layout and LangExtract internals.

