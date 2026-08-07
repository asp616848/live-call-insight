# Live Call Insight

**Live demo:** https://live-call-insight.vercel.app

Live Call Insight (internally referred to as "TranzMit Engineering" in some docs) is an operations dashboard for monitoring and analyzing AI-assisted customer support calls. It ingests parsed call transcripts, surfaces live metrics and sentiment trends, runs LLM-powered entity/concern extraction over individual conversations, and visualizes call volume and issues geographically across Indian states/districts.

## What it does

- **Dashboard**: aggregate call metrics (total calls, average call duration, average sentiment, average AI response latency), a live-feel transcript feed, a concerns pie chart, a latency gauge, and a real-time pivot table.
- **Call Analytics**: per-call drill-down — full transcript, call metadata, and a per-turn sentiment-flow chart (user vs. AI sentiment over the course of a call, with rolling averages).
- **LangExtract ("ConvoInsight")**: runs an LLM extraction pipeline (Google's `langextract` + Gemini) over a selected transcript to surface structured concerns, action items, and emotions with supporting attributes, plus a generated visualization.
- **Geo Analytics**: an interactive India map (state-level) and a Bihar district-level heatmap of call volume/concerns, built with `react-simple-maps` + `d3-geo`.
- **Auth**: Google OAuth sign-in gating the app, with role-based UI (non-developer users see call transcripts blurred/masked).
- **Data refresh**: a manual "refresh" action that (optionally) pulls new call logs from S3 and re-parses them into the local conversation store.

## Tech Stack

**Frontend**
- React + TypeScript, built with Vite (SWC plugin), Tailwind CSS + shadcn/ui (Radix primitives)
- `@react-oauth/google` for authentication
- `recharts` for charts, `react-simple-maps` + `d3-geo` for the geographic visualizations, `framer-motion` for animation
- `papaparse` for CSV parsing (pivot table data), `sentiment` for lightweight client-side sentiment scoring

**Backend** (`backend/`, Python/Flask)
- Flask + Flask-CORS API (`app.py`) exposing conversation logs, dashboard metrics, geographic aggregates, and analysis endpoints
- `langextract` + `google-generativeai` (Gemini) for LLM-based transcript extraction (`analysis.py`) and per-sentence sentiment scoring (`routes/sentiment_flow.py`), with a lexical-heuristic fallback when no Gemini API key is configured
- `boto3` for optional S3-based log ingestion (`routes/s3_downloader.py`)
- File-based caching: LangExtract results under `backend/langextract_cache/`, sentiment results under `backend/convoJson/_sentiment_cache/`, keyed by filename + mtime + content hash

## Key Backend Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /logs?n=<N>` | Last N parsed conversations (summary + transcript) |
| `GET /dashboard`, `GET /dashboard_with_convo` | Aggregated metrics, optionally with latest conversation |
| `GET /list_transcripts` | Available transcripts (`transcripts/*.txt`, `convoJson/*.json`) |
| `GET /analyze/<filename>` | Runs the LangExtract pipeline on a transcript (cached) |
| `GET /sentiment_flow/<filename>` | Per-turn user/AI sentiment scores |
| `GET /state_stats`, `GET /district_stats?state=<name>` | Geographic aggregates for the map views |
| `GET /pivot_data` | CSV data backing the pivot table |
| `POST /refresh` | Re-downloads logs from S3 and re-parses them |

See `docs/BACKEND.md`, `docs/DASHBOARD.md`, `docs/CALL_ANALYTICS.md`, `docs/GEO_ANALYTICS.md`, and `docs/LANGEXTRACT.md` for detailed, per-feature documentation.

## Running Locally

**Backend**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# add GEMINI_API_KEY (and optionally LANGEXTRACT_API_KEY) to backend/.env
# for model-backed extraction/sentiment; without it, sentiment falls back
# to a lexical heuristic and LangExtract analysis will not run.
python3 app.py
```
Runs the Flask API on `http://127.0.0.1:5000`.

**Frontend**
```bash
npm install
npm run dev
```
Starts the Vite dev server on `http://localhost:3000` (see `vite.config.ts`). Set `VITE_API_BASE_URL` in a root `.env` file to point the frontend at the backend (defaults to `http://127.0.0.1:5000/`), and `VITE_GOOGLE_CLIENT_ID` for Google OAuth (see `AUTHENTICATION.md`).

## Deployment

The frontend is deployed on Vercel: **https://live-call-insight.vercel.app**. `vercel.json` proxies `/api/*` requests to a separately-hosted Flask backend; update the `destination` there (or your own reverse proxy) to point at wherever you run `backend/app.py`.

## Notes

- Sample/demo data (transcripts, parsed conversation JSON, geo stats) ships in `backend/convoJson/`, `backend/transcripts/`, and `public/*.json` so the app is explorable without live call data or S3 access.
- `backend/.env` is present in this repository for local convenience — treat it as a template and avoid committing real API keys.
