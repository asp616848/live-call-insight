import React, { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { motion } from 'framer-motion';
import { Map as MapIcon } from 'lucide-react';

const geoUrl = '/Indian_States.geojson';

function getStateName(props: Record<string, any> = {}) {
  return (
    props.NAME_1 ||
    props.ST_NM ||
    props.state_name ||
    props.name ||
    'Unknown'
  );
}

// Load state options from public/state-options.json at runtime
type StateOption = { value: string; label: string; file: string };

function traverseCoords(coords: any, cb: (pt: [number, number]) => void) {
  if (!coords) return;
  if (typeof coords[0] === 'number') {
    cb(coords as [number, number]);
  } else if (Array.isArray(coords)) {
    coords.forEach((c) => traverseCoords(c, cb));
  }
}

function computeCenterAndZoom(geojson: any) {
  let minLon = Infinity,
    minLat = Infinity,
    maxLon = -Infinity,
    maxLat = -Infinity,
    sumLon = 0,
    sumLat = 0,
    count = 0;

  const handleGeometry = (g: any) => {
    if (!g) return;
    traverseCoords(g.coordinates, ([lon, lat]) => {
      if (Number.isFinite(lon) && Number.isFinite(lat)) {
        minLon = Math.min(minLon, lon);
        minLat = Math.min(minLat, lat);
        maxLon = Math.max(maxLon, lon);
        maxLat = Math.max(maxLat, lat);
        sumLon += lon;
        sumLat += lat;
        count += 1;
      }
    });
  };

  if (geojson?.type === 'FeatureCollection') {
    geojson.features?.forEach((f: any) => handleGeometry(f.geometry));
  } else if (geojson?.type === 'Feature') {
    handleGeometry(geojson.geometry);
  } else if (geojson?.coordinates) {
    handleGeometry(geojson);
  }

  const center: [number, number] = count > 0 ? [sumLon / count, sumLat / count] : [78.9629, 22.5937];
  const spanLon = Math.max(0.1, maxLon - minLon);
  const spanLat = Math.max(0.1, maxLat - minLat);
  const span = Math.max(spanLon, spanLat);
  // Heuristic zoom relative to India-wide span (~35 degrees)
  const zoom = Math.max(2, Math.min(12, 35 / span));
  return { center, zoom } as { center: [number, number]; zoom: number };
}

export default function IndiaMap() {
  const [hoverInfo, setHoverInfo] = useState<{ name: string } | null>(null);
  const [selectedState, setSelectedState] = useState<string>('');
  const [stateGeoUrl, setStateGeoUrl] = useState<string | null>(null);
  const [stateCenter, setStateCenter] = useState<[number, number] | null>(null);
  const [stateZoom, setStateZoom] = useState<number>(2);
  const [stateOptions, setStateOptions] = useState<StateOption[]>([]);

  // Fetch options from public folder
  useEffect(() => {
    fetch('/state-options.json')
      .then((r) => r.json())
      .then((opts: StateOption[]) => setStateOptions(opts))
      .catch(() => setStateOptions([]));
  }, []);

  useEffect(() => {
    if (!selectedState) {
      setStateGeoUrl(null);
      setStateCenter(null);
      setStateZoom(2);
      return;
    }
    const opt = stateOptions.find((o) => o.value === selectedState);
    if (!opt) return;
    setStateGeoUrl(opt.file);
    fetch(opt.file)
      .then((r) => r.json())
      .then((geo) => {
        const { center, zoom } = computeCenterAndZoom(geo);
        setStateCenter(center);
        setStateZoom(zoom);
      })
      .catch(() => {
        // fallback
        setStateCenter([78.9629, 22.5937]);
        setStateZoom(4);
      });
  }, [selectedState, stateOptions]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-6 flex flex-col gap-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <MapIcon className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">India States Map</h1>
          <p className="text-muted-foreground">Rendered from GeoJSON in the public folder</p>
        </div>
      </div>

      {/* Map */}
      <div className="w-full h-[600px] glass rounded-2xl overflow-hidden relative">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 1000, center: [78.9629, 22.5937] }}
          width={900}
          height={600}
          style={{ width: '100%', height: '100%' }}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const name = getStateName(geo.properties as any);
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => setHoverInfo({ name })}
                    onMouseLeave={() => setHoverInfo(null)}
                    style={{
                      default: { fill: '#94a3b8', outline: 'none' },
                      hover: { fill: '#6366f1', outline: 'none' },
                      pressed: { fill: '#4338ca', outline: 'none' },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>

        {hoverInfo && (
          <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md shadow-md rounded px-3 py-2 text-sm border border-border/50">
            <strong>{hoverInfo.name}</strong>
          </div>
        )}
      </div>

      {/* State selector and map */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <label htmlFor="state-select" className="text-sm font-medium text-muted-foreground">
            View a specific state/UT:
          </label>
          <select
            id="state-select"
            className="px-3 py-2 rounded-md border bg-background"
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
          >
            <option value="">Select a state/UT…</option>
            {stateOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {stateGeoUrl && stateCenter && (
          <div className="w-full h-[500px] glass rounded-2xl overflow-hidden relative">
            <ComposableMap
              projection="geoMercator"
              width={900}
              height={500}
              style={{ width: '100%', height: '100%' }}
            >
              <ZoomableGroup center={stateCenter} zoom={stateZoom}>
                <Geographies geography={stateGeoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        style={{
                          default: { fill: '#94a3b8', outline: 'none' },
                          hover: { fill: '#6366f1', outline: 'none' },
                          pressed: { fill: '#4338ca', outline: 'none' },
                        }}
                      />
                    ))
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>
            <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md shadow-md rounded px-3 py-2 text-sm border border-border/50">
              <strong>{stateOptions.find((o) => o.value === selectedState)?.label}</strong>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
