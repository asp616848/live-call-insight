# Geo Analytics — IndiaMap & GeoAnalytics

This combined document covers the two geographic analytics pages in the project:
- `IndiaMap` (`src/pages/IndiaMap.tsx`): full India map with state-level hover tooltips and a state drilldown.
- `GeoAnalytics` (`src/pages/GeoAnalytics.tsx`): focused Bihar district-level heatmap and hotspots view.

Both pages visualize call analytics aggregated by geographic boundaries and call concerns.

## Purpose

- `IndiaMap`: provide a high-level interactive India map for state-level metrics and quick drill-down to district maps.
- `GeoAnalytics`: visualize district-level concern hotspots (example focused on Bihar), with color-coded heatmap based on call counts and a hotspot list.

## Libraries used

- React + TypeScript.
- framer-motion for animations.
- react-simple-maps for SVG maps and projection handling.
- d3-geo's `geoMercator` for projections and computing fit/center/zoom.
- lucide-react for icons.
- Tailwind CSS for layouts and styling.

## Core logic

- Map rendering: both pages use `ComposableMap`, `Geographies`, `Geography`, and `ZoomableGroup` from `react-simple-maps`.
- State/district GeoJSON lives in `public/geoJsonStates/` and `public/Indian_States.geojson`.
- The pages compute a state/district-specific `center` and `zoom` using `computeFitForState(geojson, width, height)`.
  - Uses `geoMercator` to project lon/lat to SVG coordinates, then finds bbox in pixel space and calculates a zoom that fits the bbox.
  - This ensures a clean, centered map view for each state/district regardless of aspect ratio.

- Responsiveness: containers measure their DOM rect and update `mapSize` used to compute fits and set `width/height` for `ComposableMap`.

## Heatmap & color scale (GeoAnalytics)

- `GeoAnalytics` computes a percentile-based scale to avoid outlier-dominated colors.
  - It computes the 0th and 95th percentiles for district call counts and maps counts to a t in [0,1] between p0 and p95.
  - Interpolates between a soft green (`#d1fae5`) and a soft red (`#fca5a5`) to produce the fill color.
  - Zero or missing counts use a slate color (`#94a3b8`).

- This percentile approach makes the heatmap visually stable and prevents single high-count districts from washing out the rest.

## Tooltips & interactivity

- Hovering a Geography sets local `hoverInfo` which the page uses to display a floating tooltip with calls, top concerns, and a small status badge.
- Tooltips are positioned relative to the map container; coordinates are clamped to keep them on-screen.
- `GeoAnalytics` also maps district stats into a `hotspots` list sorted by call count and displayed in the right column.

## Backend APIs used

- `GET /state_stats` (used by `IndiaMap`):
  - Returns aggregated per-state stats (calls, top_concerns). The frontend maps returned keys to state names used in the GeoJSON tooltips.
  - Example: `{ states: { 'Bihar': { calls: 1234, top_concerns: ['irrigation','loan'] }, ... } }`.

- `GET /district_stats?state=<name>` (used by `IndiaMap` drilldown and `GeoAnalytics`):
  - Returns per-district aggregated stats for the named state. Example: `{ districts: { 'Khagaria': { calls: 234, top_concerns: ['irrigation'] }, ... } }`.
  - The pages normalize district names (lowercased/truncated) to map backend keys to GeoJSON properties.

Notes
- The backend route `routes/district_stats.py` builds district-level aggregates (see `backend/routes/district_stats.py`), which are consumed by these pages.
- If district stats are missing from the backend response, the UI shows "No data" and uses placeholder zero counts (avoids crashing the visualization).

## Performance & rendering tips

- GeoJSON polygons can be large; prefer simplified geometry for client-side map rendering.
- Consider server-side simplification or using vector tiles for very large datasets.
- Avoid re-rendering heavy maps on every parent state change — use memoization for geography rendering where possible.

## Run & debug

- Ensure map GeoJSON files exist in `public/geoJsonStates/` and `public/Indian_States.geojson`.
- Start the backend and frontend; the pages call `/state_stats` and `/district_stats`.
- If the map appears blank or centers poorly, check `console` for exceptions from `computeFitForState` and validate GeoJSON coordinate arrays.

## Next steps & suggestions

- Add a legend slider to let users adjust percentile threshold (e.g., P90 vs P95) live.
- Add an export of district hotspot CSV.
- Add server-side progressive detail (tile-based) for large territories.

---

If you'd like, I can add a small visual diagram or an example API response snippet to the doc.
