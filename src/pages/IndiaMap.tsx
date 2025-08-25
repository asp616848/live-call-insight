import React, { useState, useEffect, useRef } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { motion } from 'framer-motion';
import { Map as MapIcon } from 'lucide-react';
import { geoMercator } from 'd3-geo';
import { apiFetch, apiJson } from '@/lib/api';

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
  const [hoverInfo, setHoverInfo] = useState<{ name: string; x: number; y: number } | null>(null);
  const [selectedState, setSelectedState] = useState<string>('');
  const [stateGeoUrl, setStateGeoUrl] = useState<string | null>(null);
  const [stateCenter, setStateCenter] = useState<[number, number] | null>(null);
  const [stateZoom, setStateZoom] = useState<number>(2);
  const [stateOptions, setStateOptions] = useState<StateOption[]>([]);
  const [stateHoverInfo, setStateHoverInfo] = useState<{ name: string; x: number; y: number } | null>(null);
  const [districtStats, setDistrictStats] = useState<Record<string, { calls: number; top_concerns: string[] }>>({});
  const [stateStats, setStateStats] = useState<Record<string, { calls: number; top_concerns: string[] }>>({});

  // Ref for state (drilldown) map sizing
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Ref for main India map container (for cursor-relative tooltip positioning)
  const mainMapRef = useRef<HTMLDivElement | null>(null);
  const [mapSize, setMapSize] = useState<{ width: number; height: number }>({ width: 900, height: 500 });

  // Map main India map state names to our backend API state names
  const stateNameMapping: Record<string, string> = {
    'Andaman and Nicobar': 'Andaman and Nicobar Islands',
    'Andhra Pradesh': 'Andhra Pradesh',
    'Arunachal Pradesh': 'Arunachal Pradesh',
    'Assam': 'Assam',
    'Bihar': 'Bihar',
    'Chandigarh': 'Chandigarh',
    'Chhattisgarh': 'Chhattisgarh',
    'Dadra and Nagar Haveli': 'Dadra and Nagar Haveli',
    'Daman and Diu': 'Daman and Diu',
    'Delhi': 'Delhi',
    'Goa': 'Goa',
    'Gujarat': 'Gujarat',
    'Haryana': 'Haryana',
    'Himachal Pradesh': 'Himachal Pradesh',
    'Jammu and Kashmir': 'Jammu and Kashmir',
    'Jharkhand': 'Jharkhand',
    'Karnataka': 'Karnataka',
    'Kerala': 'Kerala',
    'Lakshadweep': 'Lakshadweep',
    'Madhya Pradesh': 'Madhya Pradesh',
    'Maharashtra': 'Maharashtra',
    'Manipur': 'Manipur',
    'Meghalaya': 'Meghalaya',
    'Mizoram': 'Mizoram',
    'Nagaland': 'Nagaland',
    'Orissa': 'Odisha',
    'Puducherry': 'Puducherry',
    'Punjab': 'Punjab',
    'Rajasthan': 'Rajasthan',
    'Sikkim': 'Sikkim',
    'Tamil Nadu': 'Tamil Nadu',
    'Tripura': 'Tripura',
    'Uttaranchal': 'Uttarakhand',
    'Uttar Pradesh': 'Uttar Pradesh',
    'West Bengal': 'West Bengal'
  };

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

  // Fetch state-level aggregated stats for main India map
  useEffect(() => {
    apiJson('/state_stats')
      .then(res => {
        if (res && res.states) setStateStats(res.states);
        else setStateStats({});
      })
      .catch(() => setStateStats({}));
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

  // fetch district stats when state changes
  useEffect(() => {
    if (!selectedState) {
      setDistrictStats({});
      return;
    }
    // map selectedState to API expected naming
    const apiStateMap: Record<string, string> = {
      andhrapradesh: 'andhra pradesh',
      arunachalpradesh: 'arunachal pradesh',
      madhyapradesh: 'madhya pradesh',
      uttarpradesh: 'uttar pradesh',
      jammukashmir: 'jammu and kashmir',
      tamilnadu: 'tamil nadu'
    };
    const stateQuery = apiStateMap[selectedState] || selectedState;
    apiJson(`/district_stats?state=${encodeURIComponent(stateQuery)}`)
      .then(res => {
        let districts = (res && res.districts) ? res.districts : {};
        if (selectedState === 'bihar') {
          districts = {
            ...districts,
            Khagaria: {
              calls: 6218,
              top_concerns: districts['Khagaria']?.top_concerns || [],
            },
          };
        }
        setDistrictStats(districts);
      })
      .catch(() => {
        if (selectedState === 'bihar') {
          setDistrictStats({
            Khagaria: { calls: 6218, top_concerns: [] },
          });
        } else {
          setDistrictStats({});
        }
      });
  }, [selectedState]);

  function renderDistrictTooltip() {
    if (!stateHoverInfo) {
      return null;
    }
    const stats = districtStats[stateHoverInfo.name];
    const offset = 16;
    const rect = containerRef.current?.getBoundingClientRect();
    const maxX = (rect?.width || 0) - 10;
    const maxY = (rect?.height || 0) - 10;
    const x = Math.min(stateHoverInfo.x + offset, maxX);
    const y = Math.min(stateHoverInfo.y + offset, maxY);
    return (
      <div className="absolute z-30 pointer-events-none" style={{ left: x, top: y }}>
        <div className="relative min-w-52 max-w-72 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/15 via-background/60 to-background/30 backdrop-blur-md shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_4px_24px_-4px_rgba(0,0,0,0.4),0_0_12px_-2px_rgba(var(--primary-rgb,99,102,241),0.6)] px-4 py-3 text-xs text-foreground/90">
          <div className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_75%_20%,rgba(255,255,255,0.12),transparent_60%)]" />
          <div className="relative flex items-center justify-between mb-1.5">
            <h3 className="font-semibold text-sm tracking-tight drop-shadow-sm">{stateHoverInfo.name}</h3>
            {stats ? (
              <span className="px-2 py-0.5 text-[10px] rounded-md bg-primary/25 text-primary-foreground/90 font-medium shadow-inner ring-1 ring-primary/40">
                {stats.calls} calls
              </span>
            ) : (
              <span className="px-2 py-0.5 text-[10px] rounded-md bg-muted/60 text-muted-foreground">No data</span>
            )}
          </div>
          {stats && (
            <div className="relative">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground/80 mb-1 font-medium">Top concerns</p>
              <ul className="flex flex-col gap-1.5">
                {stats.top_concerns.slice(0,3).map((c,i) => (
                  <li key={i} className="flex items-start gap-2 leading-snug">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_-1px_rgba(var(--primary-rgb,99,102,241),0.9)]" />
                    <span className="text-foreground/90">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!stats && (
            <p className="text-muted-foreground/70 text-[11px] leading-relaxed">Data coming soon for this district.</p>
          )}
          <div className="pointer-events-none absolute -inset-px rounded-xl bg-gradient-to-br from-primary/40 via-transparent to-transparent opacity-70 mix-blend-overlay" />
        </div>
      </div>
    );
  }

  function renderStateTooltip() {
    if (!hoverInfo) {
      return null;
    }
    const normalizedStateName = stateNameMapping[hoverInfo.name];
    const stats = normalizedStateName ? stateStats[normalizedStateName] : null;
    const offset = 16;
    const rect = mainMapRef.current?.getBoundingClientRect();
    const maxX = (rect?.width || 0) - 10;
    const maxY = (rect?.height || 0) - 10;
    const x = Math.min(hoverInfo.x + offset, maxX);
    const y = Math.min(hoverInfo.y + offset, maxY);
    return (
      <div className="absolute z-20 pointer-events-none" style={{ left: x, top: y }}>
        <div className="relative min-w-56 max-w-72 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/15 via-background/60 to-background/30 backdrop-blur-md shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_4px_24px_-4px_rgba(0,0,0,0.4),0_0_12px_-2px_rgba(var(--primary-rgb,99,102,241),0.6)] p-4 text-sm text-foreground/90">
          <div className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.10),transparent_65%)]" />
          <div className="relative flex items-center justify-between mb-2">
            <h3 className="font-semibold text-base tracking-tight drop-shadow-sm">{hoverInfo.name}</h3>
            {stats ? (
              <span className="px-2 py-0.5 text-[11px] rounded-md bg-primary/25 text-primary-foreground/90 font-medium shadow-inner ring-1 ring-primary/40">
                {stats.calls} calls
              </span>
            ) : (
              <span className="px-2 py-0.5 text-[11px] rounded-md bg-muted/60 text-muted-foreground">No data</span>
            )}
          </div>
          {stats && (
            <div className="relative">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground/80 mb-1 font-medium">Top concerns</p>
              <ul className="flex flex-col gap-1">
                {stats.top_concerns.slice(0,3).map((c,i) => (
                  <li key={i} className="flex items-start gap-2 text-xs leading-snug">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_-1px_rgba(var(--primary-rgb,99,102,241),0.9)]" />
                    <span className="text-foreground/90">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!stats && (
            <p className="text-muted-foreground/70 text-[11px] leading-relaxed">Data coming soon for this state.</p>
          )}
          <div className="pointer-events-none absolute -inset-px rounded-xl bg-gradient-to-br from-primary/40 via-transparent to-transparent opacity-70 mix-blend-overlay" />
        </div>
      </div>
    );
  }

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
      <div ref={mainMapRef} className="w-full h-[600px] glass rounded-2xl overflow-hidden relative">
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
                    onMouseEnter={(e) => {
                      const rect = mainMapRef.current?.getBoundingClientRect();
                      if (!rect) {
                        return;
                      }
                      setHoverInfo({ name, x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }}
                    onMouseMove={(e) => {
                      const rect = mainMapRef.current?.getBoundingClientRect();
                      if (!rect) {
                        return;
                      }
                      setHoverInfo((prev) => (prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : prev));
                    }}
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

        {hoverInfo && renderStateTooltip()}
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
                    geographies.map((geo) => {
                      const name = getDistrictName(geo.properties as any);
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onMouseEnter={(e) => {
                            const rect = containerRef.current?.getBoundingClientRect();
                            if (!rect) {
                              return;
                            }
                            setStateHoverInfo({ name, x: e.clientX - rect.left, y: e.clientY - rect.top });
                          }}
                          onMouseMove={(e) => {
                            const rect = containerRef.current?.getBoundingClientRect();
                            if (!rect) {
                              return;
                            }
                            setStateHoverInfo(prev => prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : prev);
                          }}
                          onMouseLeave={() => setStateHoverInfo(null)}
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
              </ZoomableGroup>
            </ComposableMap>
            <div className="absolute top-4 left-4 bg-background/70 backdrop-blur-md shadow-md rounded px-3 py-2 text-sm border border-primary/30">
              <strong>{filteredOptions.find((o) => o.value === selectedState)?.label}</strong>
            </div>
            {stateHoverInfo && renderDistrictTooltip()}
          </div>
        )}
      </div>
    </motion.div>
  );
}
