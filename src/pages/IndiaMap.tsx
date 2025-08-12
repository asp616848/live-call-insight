import React, { useState, useEffect, useRef } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { motion } from 'framer-motion';
import { Map as MapIcon } from 'lucide-react';
import { geoMercator } from 'd3-geo';

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

function getDistrictName(props: Record<string, any> = {}) {
  return (
    props.Dist_Name ||
    props.DISTRICT ||
    props.District ||
    props.district ||
    props.DistName ||
    props.Dist ||
    props.NAME_2 ||
    props.NAME2 ||
    props.NAME ||
    props.name ||
    'Unknown district'
  );
}

// Load state options from public/state-options.json at runtime
type StateOption = { value: string; label: string; file: string };

// Map state option values -> GeoJSON files in public/geoJsonStates
const GEOJSON_STATE_FILES: Record<string, string> = {
  andamannicobarislands: '/geoJsonStates/Andaman.geojson',
  andhrapradesh: '/geoJsonStates/AndhraPradesh.geojson',
  arunachalpradesh: '/geoJsonStates/Arunachal.geojson',
  assam: '/geoJsonStates/Assam.geojson',
  bihar: '/geoJsonStates/Bihar.geojson',
  chandigarh: '/geoJsonStates/Chandigarh.geojson',
  chhattisgarh: '/geoJsonStates/Chhattisgarh.geojson',
  delhi: '/geoJsonStates/Delhi.geojson',
  'dnh-and-dd': '/geoJsonStates/Dadra.geojson', // best available split file
  goa: '/geoJsonStates/Goa.geojson',
  gujarat: '/geoJsonStates/Gujrat.geojson', // note: file name spelled Gujrat
  haryana: '/geoJsonStates/Haryana.geojson',
  himachalpradesh: '/geoJsonStates/Himanchal.geojson', // note: file name spelled Himanchal
  jammukashmir: '/geoJsonStates/JammuAndKashmir.geojson',
  jharkhand: '/geoJsonStates/Jharkhand.geojson',
  karnataka: '/geoJsonStates/Karnataka.geojson',
  kerala: '/geoJsonStates/Kerala.geojson',
  // ladakh: '/geoJsonStates/Ladakh.geojson', // not present in repo
  lakshadweep: '/geoJsonStates/Lakshadweep.geojson',
  madhyapradesh: '/geoJsonStates/MadhyaPradesh.geojson',
  maharashtra: '/geoJsonStates/Maharashtra.geojson',
  manipur: '/geoJsonStates/Manipur.geojson',
  meghalaya: '/geoJsonStates/Meghalaya.geojson',
  mizoram: '/geoJsonStates/Mizoram.geojson',
  nagaland: '/geoJsonStates/Nagaland.geojson',
  odisha: '/geoJsonStates/Orissa.geojson', // file uses old name
  puducherry: '/geoJsonStates/Puducherry.geojson',
  punjab: '/geoJsonStates/Punjab.geojson',
  rajasthan: '/geoJsonStates/Rajasthan.geojson',
  sikkim: '/geoJsonStates/Sikkim.geojson',
  tamilnadu: '/geoJsonStates/TamilNadu.geojson',
  telangana: '/geoJsonStates/Telangana.geojson',
  tripura: '/geoJsonStates/Tripura.geojson',
  uttarakhand: '/geoJsonStates/Uttarakhand.geojson',
  uttarpradesh: '/geoJsonStates/UttarPradesh.geojson',
  westbengal: '/geoJsonStates/WestBengal.geojson',
};

function traverseCoords(coords: any, cb: (pt: [number, number]) => void) {
  if (!coords) return;
  if (typeof coords[0] === 'number') {
    cb(coords as [number, number]);
  } else if (Array.isArray(coords)) {
    coords.forEach((c) => traverseCoords(c, cb));
  }
}

// Compute a precise center + zoom that fits the state's GeoJSON into the given SVG size
const INDIA_CENTER: [number, number] = [78.9629, 22.5937];
const BASE_SCALE = 1000; // must match ComposableMap projectionConfig.scale in the state map

function computeFitForState(
  geojson: any,
  width: number,
  height: number,
  padding: number = 24
): { center: [number, number]; zoom: number } {
  const projection = geoMercator()
    .center(INDIA_CENTER)
    .scale(BASE_SCALE)
    .translate([width / 2, height / 2]);

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  const handleGeometry = (g: any) => {
    if (!g) return;
    traverseCoords(g.coordinates, ([lon, lat]) => {
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) return;
      const pt = projection([lon, lat]);
      if (!pt) return;
      const [x, y] = pt as [number, number];
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });
  };

  if (geojson?.type === 'FeatureCollection') {
    geojson.features?.forEach((f: any) => handleGeometry(f.geometry));
  } else if (geojson?.type === 'Feature') {
    handleGeometry(geojson.geometry);
  } else if (geojson?.coordinates) {
    handleGeometry(geojson);
  }

  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
    return { center: INDIA_CENTER, zoom: 2 };
  }

  const boxW = Math.max(1, maxX - minX);
  const boxH = Math.max(1, maxY - minY);
  const pad = Math.min(padding, width / 4, height / 4);
  const effW = Math.max(1, width - pad * 2);
  const effH = Math.max(1, height - pad * 2);
  const zoom = Math.max(1, Math.min(50, Math.min(effW / boxW, effH / boxH)));

  const centerPx: [number, number] = [(minX + maxX) / 2, (minY + maxY) / 2];
  const center = (projection.invert(centerPx) as [number, number]) || INDIA_CENTER;

  return { center, zoom };
}

export default function IndiaMap() {
  const [hoverInfo, setHoverInfo] = useState<{ name: string } | null>(null);
  const [selectedState, setSelectedState] = useState<string>('');
  const [stateGeoUrl, setStateGeoUrl] = useState<string | null>(null);
  const [stateCenter, setStateCenter] = useState<[number, number] | null>(null);
  const [stateZoom, setStateZoom] = useState<number>(2);
  const [stateOptions, setStateOptions] = useState<StateOption[]>([]);
  const [stateHoverInfo, setStateHoverInfo] = useState<{ name: string } | null>(null);

  // Track the actual container size to compute an exact fit
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mapSize, setMapSize] = useState<{ width: number; height: number }>({ width: 900, height: 500 });

  useEffect(() => {
    const updateSize = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const width = Math.max(300, Math.floor(rect.width));
      const height = Math.max(300, Math.floor(rect.height));
      setMapSize((s) => (s.width !== width || s.height !== height ? { width, height } : s));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Fetch options from public folder
  useEffect(() => {
    fetch('/state-options.json')
      .then((r) => r.json())
      .then((opts: StateOption[]) => setStateOptions(opts))
      .catch(() => setStateOptions([]));
  }, []);

  // When a state is selected, use the GeoJSON from geoJsonStates and compute fit
  useEffect(() => {
    if (!selectedState) {
      setStateGeoUrl(null);
      setStateCenter(null);
      setStateZoom(2);
      return;
    }

    const geojsonPath = GEOJSON_STATE_FILES[selectedState];
    if (!geojsonPath) {
      // No matching GeoJSON available in repo
      setStateGeoUrl(null);
      setStateCenter(null);
      setStateZoom(2);
      return;
    }

    setStateGeoUrl(geojsonPath);
    fetch(geojsonPath)
      .then((r) => r.json())
      .then((geo) => {
        const { center, zoom } = computeFitForState(geo, mapSize.width, mapSize.height);
        setStateCenter(center);
        setStateZoom(zoom);
      })
      .catch(() => {
        setStateCenter(INDIA_CENTER);
        setStateZoom(4);
      });
  }, [selectedState, mapSize.width, mapSize.height]);

  // filter options to those we actually have GeoJSON for
  const filteredOptions = stateOptions.filter((o) => !!GEOJSON_STATE_FILES[o.value]);

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
            {filteredOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {stateGeoUrl && stateCenter && (
          <div className="w-full h-[500px] glass rounded-2xl overflow-hidden relative" ref={containerRef}>
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ scale: BASE_SCALE, center: INDIA_CENTER }}
              width={mapSize.width}
              height={mapSize.height}
              style={{ width: '100%', height: '100%' }}
            >
              <ZoomableGroup center={stateCenter} zoom={stateZoom} minZoom={stateZoom} maxZoom={Math.max(stateZoom, 12)}>
                <Geographies geography={stateGeoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onMouseEnter={() => setStateHoverInfo({ name: getDistrictName(geo.properties as any) })}
                        onMouseLeave={() => setStateHoverInfo(null)}
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
              <strong>{filteredOptions.find((o) => o.value === selectedState)?.label}</strong>
            </div>
            {stateHoverInfo && (
              <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-md shadow-md rounded px-3 py-2 text-sm border border-border/50">
                <strong>{stateHoverInfo.name}</strong>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
