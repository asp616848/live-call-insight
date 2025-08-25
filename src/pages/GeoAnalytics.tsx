import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { geoMercator } from 'd3-geo';
import { apiJson } from '@/lib/api';

// Helper utilities copied from IndiaMap for consistent fit behavior
const INDIA_CENTER: [number, number] = [78.9629, 22.5937];
const BASE_SCALE = 1000; // must match ComposableMap projectionConfig.scale in the state map

function traverseCoords(coords: any, cb: (pt: [number, number]) => void) {
  if (!coords) {
    return;
  }
  if (typeof coords[0] === 'number') {
    cb(coords as [number, number]);
  } else if (Array.isArray(coords)) {
    coords.forEach((c) => traverseCoords(c, cb));
  }
}

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
    if (!g) {
      return;
    }
    traverseCoords(g.coordinates, ([lon, lat]) => {
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
        return;
      }
      const pt = projection([lon, lat]);
      if (!pt) {
        return;
      }
      const [x, y] = pt as [number, number];
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return;
      }
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

// District name helper (matches IndiaMap's logic)
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

// Normalize district names for reliable lookups
function normalizeDistrictName(name: string | undefined | null) {
  return (name ?? '').toString().trim().toLowerCase();
}

const StatCard = ({ title, value, icon: Icon, color }) => (
  <motion.div
    className="glass rounded-2xl p-6 flex items-center gap-6"
    whileHover={{ scale: 1.03 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${color}`}>
      <Icon className="w-8 h-8 text-white" />
    </div>
    <div>
      <p className="text-muted-foreground text-lg">{title}</p>
      <h3 className="text-4xl font-bold">{value}</h3>
    </div>
  </motion.div>
);

const ConcernHotspotList = () => {
  // Updated hotspots from user-provided data
  const hotspots = [
    {
      district: 'Khagaria',
      concerns: ['Embankment seepage', 'Cattle disease', 'Input subsidy'],
      level: 'High' as const,
      calls: 6218,
    },
    {
      district: 'Madhepura',
      concerns: ['Flood recession', 'Paddy variety', 'Insurance claim'],
      level: 'High' as const,
      calls: 1258,
    },
    {
      district: 'Darbhanga',
      concerns: ['Flood relief', 'School infrastructure', 'Health staff shortage'],
      level: 'Medium' as const,
      calls: 501,
    },
    {
      district: 'Muzaffarpur',
      concerns: ['Litchi disease', 'Irrigation diesel', 'Health outbreak'],
      level: 'Medium' as const,
      calls: 501,
    },
    {
      district: 'Patna',
      concerns: ['Urban flooding', 'Seed scam', 'Land record'],
      level: 'Low' as const,
      calls: 50,
    },
  ];

  return (
    <motion.div
      className="glass rounded-2xl p-6 h-full"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <h3 className="text-xl font-bold mb-4 gradient-text">Top Concern Hotspots</h3>
      <div className="space-y-4">
        {hotspots.map((spot) => (
          <div key={spot.district} className="bg-muted/30 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{spot.district}</p>
                <span className="text-xs text-muted-foreground">📞 {spot.calls.toLocaleString()} calls</span>
              </div>
              <div
                className={`px-3 py-1 text-xs rounded-full ${
                  spot.level === 'High'
                    ? 'bg-red-500/20 text-red-400'
                    : spot.level === 'Medium'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-green-500/20 text-green-400'
                }`}
              >
                {spot.level}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{spot.concerns.join(', ')}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default function GeoAnalytics() {
  // Bihar map state
  const [mapSize, setMapSize] = useState<{ width: number; height: number }>({ width: 900, height: 500 });
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [zoom, setZoom] = useState<number>(2);
  const [hoverInfo, setHoverInfo] = useState<{ name: string; x: number; y: number } | null>(null);
  const [districtStats, setDistrictStats] = useState<Record<string, { calls: number; top_concerns: string[]; level?: 'High' | 'Medium' | 'Low' }>>({});
  const [highCount, setHighCount] = useState<number>(0);
  const [totalCalls, setTotalCalls] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Percentile-based heatmap scale (green -> red), use 95th percentile as the effective max
  const [callsP0, callsP95] = useMemo(() => {
    const values = Object.values(districtStats).map((d) => d.calls || 0).filter((v) => v > 0);
    if (values.length === 0) {
      return [0, 1] as [number, number];
    }
    const sorted = [...values].sort((a, b) => a - b);
    const p0 = sorted[0];
    const p = 0.95;
    const rank = (sorted.length - 1) * p;
    const lowIdx = Math.floor(rank);
    const highIdx = Math.min(sorted.length - 1, Math.ceil(rank));
    const weight = rank - lowIdx;
    const p95 = (1 - weight) * sorted[lowIdx] + weight * sorted[highIdx];
    return [p0, p95 > 0 ? p95 : sorted[sorted.length - 1]] as [number, number];
  }, [districtStats]);

  function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }

  function hexToRgb(hex: string): [number, number, number] {
    const m = hex.replace('#', '');
    const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
    const bigint = parseInt(full, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b];
  }

  function rgbToHex(r: number, g: number, b: number) {
    const toHex = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  // Map calls to a green->red gradient using percentile scale; zero/no data uses slate
  function callsToColor(calls?: number) {
    if (!Number.isFinite(calls) || !calls) {
      return '#94a3b8';
    }
    const min = callsP0;
    const max = callsP95;
    if (max <= min) {
      return '#ef4444';
    }
    const t = Math.max(0, Math.min(1, ((calls as number) - min) / (max - min)));
  // Softer palette: emerald-100 -> red-300
  const low = hexToRgb('#d1fae5'); // emerald-100
  const high = hexToRgb('#fca5a5'); // red-300
    const r = lerp(low[0], high[0], t);
    const g = lerp(low[1], high[1], t);
    const b = lerp(low[2], high[2], t);
    return rgbToHex(r, g, b);
  }

  // Sync the map size to container to keep same size as previous iframe (w-full h-full)
  useEffect(() => {
    const updateSize = () => {
      const el = containerRef.current;
      if (!el) {
        return;
      }
      const rect = el.getBoundingClientRect();
      const width = Math.max(300, Math.floor(rect.width));
      const height = Math.max(300, Math.floor(rect.height));
      setMapSize((s) => (s.width !== width || s.height !== height ? { width, height } : s));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Compute fit for Bihar once size is known
  useEffect(() => {
    const geojsonPath = '/geoJsonStates/Bihar.geojson';
    fetch(geojsonPath)
      .then((r) => r.json())
      .then((geo) => {
        const { center, zoom } = computeFitForState(geo, mapSize.width, mapSize.height);
        setCenter(center);
        setZoom(zoom);
      })
      .catch(() => {
        setCenter(INDIA_CENTER);
        setZoom(4);
      });
  }, [mapSize.width, mapSize.height]);

  // Load Bihar district stats for tooltip (mirrors IndiaMap behavior for Bihar)
  useEffect(() => {
    apiJson('/district_stats?state=bihar')
      .then((res) => {
        const apiDistricts: Record<string, { calls?: number; top_concerns?: string[] }> = (res && res.districts) ? res.districts : {};
        // Normalize keys from API
        const normalized: Record<string, { calls: number; top_concerns: string[]; level?: 'High' | 'Medium' | 'Low' }> = {};
        Object.entries(apiDistricts).forEach(([k, v]) => {
          const key = normalizeDistrictName(k);
          if (!key) {
            return;
          }
          normalized[key] = {
            calls: v?.calls ?? 0,
            top_concerns: v?.top_concerns ?? [],
          };
        });

        // Overlay with provided data (authoritative for these districts)
        const provided: Record<string, { calls: number; top_concerns: string[]; level: 'High' | 'Medium' | 'Low' }> = {
          [normalizeDistrictName('Khagaria')]: {
            calls: 6218,
            top_concerns: normalized[normalizeDistrictName('Khagaria')]?.top_concerns?.length
              ? normalized[normalizeDistrictName('Khagaria')].top_concerns
              : ['Embankment seepage', 'Cattle disease', 'Input subsidy'],
            level: 'High',
          },
          [normalizeDistrictName('Madhepura')]: {
            calls: 1258,
            top_concerns: ['Flood recession', 'Paddy variety', 'Insurance claim'],
            level: 'High',
          },
          [normalizeDistrictName('Darbhanga')]: {
            calls: 501,
            top_concerns: ['Flood relief', 'School infrastructure', 'Health staff shortage'],
            level: 'Medium',
          },
          [normalizeDistrictName('Muzaffarpur')]: {
            calls: 501,
            top_concerns: ['Litchi disease', 'Irrigation diesel', 'Health outbreak'],
            level: 'Medium',
          },
          [normalizeDistrictName('Patna')]: {
            calls: 50,
            top_concerns: ['Urban flooding', 'Seed scam', 'Land record'],
            level: 'Low',
          },
        };

        const merged = { ...normalized, ...provided };
        setDistrictStats(merged);

        // Update top metrics
        const high = Object.values(merged).filter((d) => d.level === 'High').length;
        const sum = Object.values(merged).reduce((acc, d) => acc + (d.calls || 0), 0);
        setHighCount(high);
        setTotalCalls(sum);
      })
      .catch(() => {
        const fallback: Record<string, { calls: number; top_concerns: string[]; level: 'High' | 'Medium' | 'Low' }> = {
          [normalizeDistrictName('Khagaria')]: { calls: 6218, top_concerns: ['Embankment seepage', 'Cattle disease', 'Input subsidy'], level: 'High' },
          [normalizeDistrictName('Madhepura')]: { calls: 1258, top_concerns: ['Flood recession', 'Paddy variety', 'Insurance claim'], level: 'High' },
          [normalizeDistrictName('Darbhanga')]: { calls: 501, top_concerns: ['Flood relief', 'School infrastructure', 'Health staff shortage'], level: 'Medium' },
          [normalizeDistrictName('Muzaffarpur')]: { calls: 501, top_concerns: ['Litchi disease', 'Irrigation diesel', 'Health outbreak'], level: 'Medium' },
          [normalizeDistrictName('Patna')]: { calls: 50, top_concerns: ['Urban flooding', 'Seed scam', 'Land record'], level: 'Low' },
        };
        setDistrictStats(fallback);
        setHighCount(2);
        setTotalCalls(6218 + 1258 + 501 + 501 + 50);
      });
  }, []);

  function renderDistrictTooltip() {
    if (!hoverInfo) {
      return null;
    }
    const stats = districtStats[normalizeDistrictName(hoverInfo.name)];
    const rect = containerRef.current?.getBoundingClientRect();
    const x = Math.min(hoverInfo.x + 16, (rect?.width || 0) - 10);
    const y = Math.min(hoverInfo.y + 16, (rect?.height || 0) - 10);
    return (
      <div className="absolute z-30 pointer-events-none" style={{ left: x, top: y }}>
        <div className="relative min-w-52 max-w-72 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/15 via-background/60 to-background/30 backdrop-blur-md shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_4px_24px_-4px_rgba(0,0,0,0.4),0_0_12px_-2px_rgba(var(--primary-rgb,99,102,241),0.6)] px-4 py-3 text-xs text-foreground/90">
          <div className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_75%_20%,rgba(255,255,255,0.12),transparent_60%)]" />
          <div className="relative flex items-center justify-between mb-1.5">
            <h3 className="font-semibold text-sm tracking-tight drop-shadow-sm">{hoverInfo.name}</h3>
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
                {stats.top_concerns.slice(0, 3).map((c, i) => (
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-6 flex flex-col gap-6" // removed h-full so page can grow and allow scrolling
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Globe className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Geo-Analytics Dashboard</h1>
          <p className="text-muted-foreground">District-level call concern analysis for Bihar</p>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="High Concern Districts" value={highCount.toString()} icon={AlertTriangle} color="bg-red-500" />
        <StatCard title="Avg. Sentiment Trend" value="+1.2%" icon={TrendingUp} color="bg-green-500" />
        <StatCard title="Total Calls Analyzed" value={totalCalls.toLocaleString()} icon={Users} color="bg-blue-500" />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
        <div className="lg:col-span-2 h-[500px] lg:h-auto">
          <motion.div
            className="w-full h-full glass rounded-2xl overflow-hidden relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            ref={containerRef}
          >
      {center && (
              <ComposableMap
                projection="geoMercator"
                projectionConfig={{ scale: BASE_SCALE, center: INDIA_CENTER }}
                width={mapSize.width}
                height={mapSize.height}
                style={{ width: '100%', height: '100%' }}
              >
        <ZoomableGroup center={center} zoom={zoom} minZoom={zoom} maxZoom={Math.max(zoom, 12)}>
                  <Geographies geography="/geoJsonStates/Bihar.geojson">
                    {({ geographies }) =>
                      geographies.map((geo) => {
            const name = getDistrictName(geo.properties as any);
            const norm = normalizeDistrictName(name);
            const calls = districtStats[norm]?.calls ?? 0;
            const fillByCalls = callsToColor(calls);
                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            onMouseEnter={(e) => {
                              const rect = containerRef.current?.getBoundingClientRect();
                              if (!rect) {
                                return;
                              }
                              setHoverInfo({ name, x: e.clientX - rect.left, y: e.clientY - rect.top });
                            }}
                            onMouseMove={(e) => {
                              const rect = containerRef.current?.getBoundingClientRect();
                              if (!rect) {
                                return;
                              }
                              setHoverInfo((prev) => (prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : prev));
                            }}
                            onMouseLeave={() => setHoverInfo(null)}
                            style={{
                default: { fill: fillByCalls, outline: 'none', fillOpacity: 0.6 },
                              hover: { fill: '#6366f1', outline: 'none', fillOpacity: 0.8 },
                              pressed: { fill: '#4338ca', outline: 'none' },
                            }}
                          />
                        );
                      })
                    }
                  </Geographies>
                </ZoomableGroup>
              </ComposableMap>
            )}
            {/* Heatmap legend (0th -> 95th percentile) */}
            <div className="absolute bottom-3 right-3 z-20 px-3 py-2 rounded-md border bg-background/80 backdrop-blur-md text-xs text-foreground/80">
              <div className="mb-1 font-medium">Calls Heatmap</div>
              <div className="flex items-center gap-2">
                <span>{callsP0.toLocaleString()}</span>
                <div
                  className="h-2 w-24 rounded"
                  style={{ background: 'linear-gradient(90deg, rgba(209,250,229,0.6) 0%, rgba(252,165,165,0.6) 100%)' }}
                />
                <span>{callsP95.toLocaleString()} (P95)</span>
              </div>
            </div>
            {hoverInfo && renderDistrictTooltip()}
          </motion.div>
        </div>
        <div className="h-[500px] lg:h-auto">
          <ConcernHotspotList />
        </div>
      </div>
    </motion.div>
  );
}
