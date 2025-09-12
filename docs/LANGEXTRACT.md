# LangExtract / ConvoInsight — Documentation

This document explains the LangExtract (ConvoInsight) page: purpose, UI behavior, frontend React logic, libraries used, backend APIs it calls, the models and services used for extraction and visualization, caching behavior, and run/debug tips.

## Purpose

LangExtract (ConvoInsight) is the UI for running AI-powered extraction over conversation transcripts. It lets operators pick a transcript (from `transcripts/` or `convoJson/`), run the server-side LangExtract pipeline, and browse extractions (concerns, action items, emotions) with attributes and contextual metadata.

File: `src/pages/LangExtract.tsx`

## Features

- Transcript selector (dropdown) populated from backend `GET /list_transcripts`.
- Runs analysis automatically when a transcript is selected by calling `GET /analyze/<filename>`.
- Filters and search across extracted entities (by category and attributes).
- Copy-to-clipboard for extraction text.
- Category-driven presentation (icons, color tones) and attribute icons.
- Summary stats box showing total extractions and categories.
- Loading states, skeletons, and error cards.

## Frontend React / UI logic

- State management
  - `transcripts: string[]` — list from `/list_transcripts`.
  - `selectedTranscript: string | null` — current transcript chosen by user.
  - `analysis: any` — backend response for the selected transcript (extractions, visualization HTML optionally).
  - `loading`, `error`, `searchQuery`, `filterCategory`, `selectedEntity` — UI state.

- Lifecycle
  - On mount, fetch `GET /list_transcripts` (`apiJson('/list_transcripts')`) and set `transcripts`.
  - When `selectedTranscript` changes, fetch `GET /analyze/<selectedTranscript>` to retrieve analysis and set `analysis`.

- UX details
  - `Select` control shows transcript basenames to the user (cleaned labels) but passes the raw filename to the backend.
  - Search and category filter are applied client-side by filtering `analysis.extractions`.
  - `copyToClipboard` uses the Clipboard API to copy extraction text.
  - The UI maps categories to tone classes and icons via helpers like `getCategoryTone` and `getCategoryIcon`.

## Backend APIs and how the page uses them

- GET /list_transcripts
  - Returns: array of filenames (strings) present in `backend/transcripts/` and `backend/convoJson/` (the server lists both `.txt` and `.json` files).
  - Used for: populating the transcript selector dropdown.

- GET /analyze/<filename>
  - Accepts: filename (usually a basename). Supports `.json` (from `convoJson/`) and `.txt` (from `transcripts/`).
  - Behavior: resolves the path on the server side, runs `analysis.analyze_conversation_with_langextract(filepath)`, uses caching to avoid re-running expensive extraction, and returns analysis JSON.
  - Returns (typical shape):
    {
      metrics: {...},
      extractions: [ { extraction_class, extraction_text, attributes, ... }, ... ],
      visualization_html: "<html>..." (optional),
      conversation_summary: {...}
    }
  - Used for: populating the list of extractions, summary metrics, and for optionally rendering a saved visualization HTML fragment.

- GET /cache/status (optional admin)
  - Returns information about cached LangExtract results.
  - Useful to confirm whether an analyze request used cache or triggered fresh processing.

- POST /cache/clean (optional admin)
  - Cleans old cache entries. Not used directly by the page but useful for maintenance.

Notes on file resolution and safety
- Frontend sends the raw filename selected. Backend resolves `.json` in `convoJson/` and `.txt` in `transcripts/` and checks for existence before processing.

## Models & services used (backend)

- LangExtract (imported as `langextract as lx` in `backend/analysis.py`)
  - Purpose: high-level extraction framework that wraps a generative model to extract structured items (concerns, action_items, emotions) using examples and a prompt description.
  - The code calls `lx.extract(...)` with:
    - `text_or_documents` — the concatenated conversation text.
    - `prompt_description` — a short instruction describing expected extractions.
    - `examples` — an array of `lx.data.ExampleData` used to steer extraction format and attributes.
    - `model_id` — the model identifier used for generative extraction (e.g., `gemini-2.5-flash-lite` in the project code).
  - `lx.io.save_annotated_documents` and `lx.visualize` are used to save annotated outputs and to create an interactive visualization HTML.

- Gemini / Google Generative API (optional)
  - If configured via `GEMINI_API_KEY` in environment, LangExtract and sentiment code may call the Gemini family models for extraction and sentiment scoring.
  - If the API key is missing, sentiment flow endpoint falls back to a lexical heuristic and LangExtract may fail or behave differently depending on `lx` configuration.

## Caching behavior

- `analysis.get_cache_key(filepath)` computes a cache key based on filename, mtime and content hash.
- `analysis.load_from_cache(cache_key)` attempts to load `analysis_result.json` and `visualization.html` from `backend/langextract_cache/<cache_key>/`.
- If cached, the server returns the cached analysis rather than re-running `lx.extract`.
- When new analysis runs, outputs (JSON and visualization) are saved to the cache directory.

## UI: presentation & filtering

- Extractions are presented as cards grouped by category.
- Each extraction shows the extracted text, attributes (displayed with icons), and category-specific tone (colors and borders).
- Search applies to extraction text and serialized attributes.
- Filter dropdown lists discovered categories dynamically from `analysis.extractions`.

## Error handling & loading states

- If `/list_transcripts` fails, the page sets `error` and shows a destructive alert card at the top.
- While analysis is running, skeleton cards are displayed for perceived performance.
- Backend errors from `/analyze/<filename>` are surfaced to the UI and shown in the same alert area.

## Run & debug

- Start backend and frontend as described in repository root README. Ensure `backend/.env` contains `GEMINI_API_KEY` if you want model-backed extraction.

- To reproduce an analyze run manually:
  1. Get an available filename from `GET /list_transcripts`.
  2. Run `GET /analyze/<that-filename>` locally with curl:

```bash
curl "http://127.0.0.1:5000/analyze/call_transcript_1.json"
```

- Check `backend/langextract_cache/` to see cache entries and `visualization.html` files produced.

- If extraction seems slow or fails, ensure the environment variable `GEMINI_API_KEY` is set and that network/model access is available. If not, review the error response JSON from `/analyze/<filename>`.

## Security and safety

- The analyze pipeline processes transcript content and writes results to disk. Ensure the app runs in a trusted environment and transcripts do not contain secrets.
- The backend enforces basic path resolution but you should not expose arbitrary file-path input in production without stronger validation.

## Suggestions & next steps

- Add a small "Run fresh" toggle that forces ignore-cache behavior on the `/analyze` endpoint (backend support required).
- Add preview rendering of `visualization_html` returned by the server inside a safe iframe container.
- Add an export button to download extractions as CSV/JSON.
- Record extraction runtimes in the cache metadata for monitoring.

---

If you'd like, I can add example analyze responses or embed a screenshot of the generated visualization HTML into the docs.
