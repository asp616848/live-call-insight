# Backend — Overview

This document briefly describes the project's backend (Flask) code, services, important files, APIs, caching behavior, environment variables, and how to run and debug locally.

Location
- All backend code lives under `backend/`.

Key files & folders
- `app.py` — Flask app and public HTTP endpoints. Central router for logs, dashboard, analysis, sentiment, and maintenance endpoints.
- `analysis.py` — LangExtract wrapper: runs extraction using `langextract` (calls a generative model), saves visualization HTML, and manages a content-based cache under `backend/langextract_cache/`.
- `routes/` — helper route modules (examples: `s3_downloader.py`, `parser.py`, `dashboard.py`, `district_stats.py`, `sentiment_flow.py`):
  - `routes/s3_downloader.py` — downloads raw logs from S3 (if configured).
  - `routes/parser.py` — parses raw logs into structured conversation JSONs and populates `processed_logs/`.
  - `routes/dashboard.py` — builds aggregated metrics and the latest conversation used by `/dashboard_with_convo`.
  - `routes/district_stats.py` — returns per-state/district aggregates used by maps.
  - `routes/sentiment_flow.py` — builds per-sentence sentiment (uses Gemini if configured, else lexical heuristics) and caches results under `convoJson/_sentiment_cache`.
- `convoJson/` — conversation JSON files (real transcripts). The app supports analyzing these `.json` files.
- `transcripts/` — small set of `.txt` transcripts (handwritten/test cases).
- `langextract_cache/` — persistent cache of LangExtract outputs keyed by filename+mtime+hash.
- `processed_logs/` — parsed conversation outputs produced by the parser.
- `district_stats.json` & `pivot_data.csv` — static data used by map/pivot endpoints.
- `requirements.txt` — Python dependencies for the backend.

Important endpoints (in `app.py`)
- GET `/logs?n=<N>`
  - Returns last N parsed conversations (summary + conversation array). Used by frontend pages (Dashboard, CallAnalytics) to build lists and compute client-side metrics.

- GET `/dashboard_with_convo` and GET `/dashboard`
  - Return aggregated metrics and optionally the latest conversation. Used by Dashboard and related pages.

- POST `/refresh`
  - Triggers S3 download + re-parse (slow/expensive). Frontend exposes a manual refresh button that calls this endpoint.

- GET `/list_transcripts`
  - Returns `.txt` entries from `transcripts/` and `.json` entries from `convoJson/` so the frontend can pick real files for LangExtract.

- GET `/analyze/<filename>`
  - Server-side wrapper for LangExtract. Resolves `.txt` to `transcripts/` and `.json` to `convoJson/`, runs `analyze_conversation_with_langextract(filepath)`, and returns extractions, visualization HTML (if produced), and summary metrics. Uses caching to avoid repeating expensive model calls.

- GET `/sentiment_flow/<filename>`
  - Returns `{ user: [{index,score},...], ai: [{index,score},...] }`. Uses Gemini model if `GEMINI_API_KEY` provided; otherwise falls back to lexical heuristics. Caches results in `convoJson/_sentiment_cache`.

- GET `/state_stats` and GET `/district_stats?state=<name>`
  - Provide geographic aggregated metrics used by `IndiaMap` and `GeoAnalytics` pages.

- GET `/pivot_data`
  - Returns `pivot_data.csv` for the pivot table component.

Cache & persistence
- LangExtract cache: `backend/langextract_cache/<cache_key>/analysis_result.json` and `visualization.html`.
- Sentiment cache: `backend/convoJson/_sentiment_cache/<safe_filename>.sentiment.json`.
- Cache keys are based on filename, modification time, and content hash — so re-running analysis after a file change will produce new outputs.

Models & external services
- LangExtract (`langextract` package) — used by `analysis.py` to extract structured entities from full transcripts. It is configured with examples and a prompt and calls a model (`model_id` set in the code, e.g. `gemini-2.5-flash-lite`).
- Google/Keys (Gemini) — optional. If `GEMINI_API_KEY` is set in the environment, the sentiment route and LangExtract may use the Generative model for higher-quality outputs. If absent, the sentiment route uses a lexical heuristic fallback.
- S3 — optional log download source; controlled by `routes/s3_downloader.py`.

Environment variables
- `GEMINI_API_KEY` — optional, used by model-backed sentiment and LangExtract.
- Frontend uses `VITE_API_BASE_URL` (set in `.env` at repo root) to point to the backend (default: `http://127.0.0.1:5000/`).

How to run locally (quick)
1. Create and activate a Python virtualenv:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```
2. (Optional) add a `.env` file in `backend/` with `GEMINI_API_KEY=...` if you want model-backed sentiment/extraction.
3. Run the Flask app:
```bash
python3 app.py
```
4. Start the frontend separately (project root): `npm install` then `npm run dev` (or `pnpm`/`yarn` per your workflow).

Debug tips
- If /dashboard or /logs are empty, ensure `processed_logs/` is populated (run `POST /refresh` or check `routes/s3_downloader` + `parser` behavior).
- LangExtract can be slow and requires network/model access; check `backend/langextract_cache/` for cached outputs and `visualization.html` files.
- If `GEMINI_API_KEY` is missing, sentiment will run a heuristic; logs and errors are printed to the backend console.

Security & production notes
- The backend accepts filenames and resolves them locally; avoid exposing this behavior to untrusted users in production without strong validation.
- Model keys should be stored securely and rotated.
- Disk caches may contain sensitive transcript data — restrict filesystem access and TTLs.

Next steps / suggestions
- Add an admin-only endpoint to force cache miss or re-run analysis ignoring cache.
- Add health and metrics endpoints for monitoring long-running `/refresh` jobs.
- Consider async background jobs (Celery/RQ) for heavy extraction instead of blocking requests.

