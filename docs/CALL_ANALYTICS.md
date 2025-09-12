# Call Analytics — Documentation

This document explains the Call Analytics page: what it does, its UI and React logic, the sentiment flow graph features and computation, libraries used, the backend APIs it calls (what they return and how the page consumes them), run/debug tips, and next steps.

## Purpose

The Call Analytics page provides a detailed view of individual calls and aggregated recent-call metrics. It lets an operator inspect conversation transcripts, examine per-turn sentiment over the course of the call, view call-level metrics (duration, AI latency, sentiment label, concerns), and trigger manual refreshes of backend logs.

Page location: `src/pages/CallAnalytics.tsx` (exported default component).

## Key features

- Recent calls list with brief overview and sentiment badge.
- Call detail panel showing conversation, basic metrics, and sentiment flow visualization (user vs AI per-turn scores with rolling averages).
- Role-based privacy: conversation text is blurred/disabled for non-developers.
- Manual refresh control which triggers backend re-download & parse via `/refresh`.

## Types & Shapes (frontend)

- Summary (call-level):
  - `filename: string` — backend file reference (often `convoJson` or `transcripts`).
  - `stream_sid`, `call_started`, `call_ended`, `duration_seconds`, `average_ai_response_latency`, `sentiment`, `concerns`, `overview`, `user_tone`.

- Conversation message:
  - `{ speaker: 'user' | 'ai', text: string, timestamp: string }`.

- Sentiment flow shape (from backend `/sentiment_flow/<filename>`):
  - `{ user: [ { index: number, score: number }, ... ], ai: [ { index: number, score: number }, ... ] }`.

## React / UI logic highlights

- Data fetching:
  - On mount (and when `pageSize` changes) the page runs two requests in parallel:
    - `GET /logs?n=<pageSize>` to fetch the last N parsed calls (used to populate the recent calls list and to pick a default selected call).
    - `GET /dashboard` to fetch lightweight aggregated metrics for dashboard widgets.
  - When a `selectedCall` changes, page normalizes the `summary.filename` into a `.json` name and calls `GET /sentiment_flow/<jsonName>` to load per-turn sentiments.

- Selected-call fallback:
  - If `/logs` returns no parsed calls, the component constructs a minimal `Call` object from `dashboard.metrics.latest_call_summary` and `dashboard.latest_conversation` so the details pane still works.

- Privacy gating:
  - `isDeveloper` is derived from `user.role` (via `useAuth()` context). If not developer, the conversation UI is blurred and pointer-events disabled.

- Manual refresh:
  - `handleRefresh()` calls `POST /refresh` (slow) to re-download and re-parse logs, then refetches `/dashboard` and `/logs` to update UI.

## Sentiment Flow graph — features & computation

- Data input: backend returns `user` and `ai` arrays of `{index, score}`.
- Normalization: component converts these arrays into `userSeries` and `aiSeries` and computes a rolling average via `computeRolling(arr, window)`.
  - Implementation detail: `computeRolling` maps each point to include `.avg` computed over the last `window` points (default `rollingWindow` state = 3). The code computes averages with bounds handling for the start of series.

- Chart dataset:
  - `chartData` merges user and ai series into a single array indexed by turn number. Each entry contains raw scores and rolling averages for both channels.

- Tooltip:
  - A custom tooltip (`customTooltip`) shows per-turn values for user/AI and their rolling averages. It formats numbers to two decimals when available and shows the turn number.

- Aggregates shown:
  - `avgUser` and `avgAI` (simple arithmetic mean across available points).

- UI controls:
  - `rollingWindow` (state) allows controlling smoothing window size.
  - `sentimentView` toggles what series are visible (both/user/ai) — component scaffolding present to control chart rendering.

- Edge cases handled by backend & frontend cooperation:
  - Backend `routes/sentiment_flow.py` ensures `user` and `ai` arrays exist and pads or synthesizes baseline neutral scores (5.0) if arrays are missing or lengths differ. Frontend assumes aligned arrays and uses rolling/padding accordingly.

## Backend APIs called by CallAnalytics (what they return and how used)

- GET /logs?n=<N>
  - Returns: array of parsed Call objects (summary + conversation array).
  - Used for: building Recent Calls list, choosing default selected call, and computing call-level aggregates displayed on the page.

- GET /dashboard
  - Returns: lightweight aggregated metrics (same generator used by `/dashboard_with_convo` but without full convo). Example fields: `total_calls`, `average_call_duration`, `average_sentiment_score`, `average_ai_response_latency`, `latest_call_summary`.
  - Used for: top-level small metrics and fallback latest-conversation content when `/logs` is empty.

- GET /sentiment_flow/<filename>
  - Accepts filename normalized to `.json` under backend `convoJson/`. The frontend converts `selectedCall.summary.filename` into a `.json` filename.
  - Returns: `{ user: [{index,score},...], ai: [{index,score},...] }` and optionally `meta`.
  - Used for: rendering the sentiment flow chart and computing rolling averages.

- POST /refresh
  - Action: Triggers backend to re-download logs from S3 and re-parse them. This is intentionally expensive/slow and should be rate-limited by UI.
  - UI: `handleRefresh` calls this and then re-fetches `/dashboard` and `/logs` when the refresh completes.

Notes about filename normalization:
- The page normalizes a `selectedCall.summary.filename` by using the base name (strip any path) and converting `.txt` to `.json` where appropriate. This matches backend behavior where `.json` files live under `backend/convoJson` and `.txt` under `backend/transcripts`.

## Backend behavior (relevant)

- `backend/routes/sentiment_flow.py` constructs and caches per-sentence sentiment arrays. It:
  - Reads the convo JSON and builds `user` and `ai` lists.
  - Uses a model (Gemini) when available, else falls back to a lexical heuristic.
  - Ensures outputs are robust (pads shorter arrays, injects neutral baseline if both empty).
  - Persists caches under `convoJson/_sentiment_cache`.

- `backend/app.py` exposes `/logs`, `/dashboard`, `/dashboard_with_convo`, `/analyze/<filename>`, `/list_transcripts`, `/sentiment_flow/<filename>`, `/refresh`, and cache endpoints.

## UI/UX details

- Conversation list:
  - Shows `stream_sid`, truncated `overview`, sentiment badge and small metrics (duration, AI latency).
  - Clicking an item sets `selectedCall` and loads sentiment for that call.

- Detail panel tabs:
  - Conversation: shows per-message entries (blurred for non-developers).
  - Metrics: call-level metrics and a small `LatencyGauge`.
  - Waveform: placeholder (audio not available).
  - Sentiment: sentiment chart, loading skeleton, and error handling.

- Role-based access: non-developers see conversation text blurred; developers see full text.

## Run & debug tips

- Start backend and frontend as usual. Ensure `.env` has `VITE_API_BASE_URL=http://127.0.0.1:5000/` if running locally.

- To test sentiment flow for a selected call:
  1. Identify a `selectedCall.summary.filename` from `/logs` or `/dashboard`.
  2. Normalize to `.json` per the component's logic and call:
     ```bash
     curl "http://127.0.0.1:5000/sentiment_flow/<your-normalized.json>"
     ```
  3. Validate returned `user` and `ai` arrays and check `convoJson/_sentiment_cache` for cached results.

- If the chart doesn't render, check browser console for errors; the component expects `user` and `ai` arrays with numeric `score` fields.

- If sentiment data is missing or malformed, backend will return `error` in the response. The frontend sets `sentimentError` and shows an alert.

## Testing edge cases

- Unequal lengths between `user` and `ai` arrays: backend pads shorter arrays; frontend aligns using `combinedLen = Math.max(userSeries.length, aiSeries.length)`.
- Empty conversations: backend injects neutral baseline (score ~5.0). Frontend computes rolling averages across available points.
- Long conversations: frontend computes rolling averages per point; charts may require virtualized rendering if extremely long.

## Next steps / Suggestions

- Add UI controls to let operators pick smoothing window interactively and toggle series visibility.
- Persist `rollingWindow` preference in localStorage.
- Add an export button to download sentiment arrays as CSV for offline analysis.
- Add a small inline sparkline on the recent calls list showing sentiment trend for quick scanning.

---

If you'd like, I can update the `README.md` with short sample API responses or add a small diagram showing data flow between frontend and backend.
