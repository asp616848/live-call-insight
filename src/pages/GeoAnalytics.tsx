import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { geoMercator } from 'd3-geo';

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
  const hotspots = [
    { district: 'Patna', concern: 'Loan Repayment', level: 'High' },
    { district: 'Muzaffarpur', concern: 'Irrigation', level: 'High' },
    { district: 'Gaya', concern: 'Crop Prices', level: 'Medium' },
    { district: 'Darbhanga', concern: 'Electricity', level: 'Medium' },
    { district: 'Bhagalpur', concern: 'Fertilizer Costs', level: 'Low' },
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
        {hotspots.map(spot => (
          <div key={spot.district} className="flex justify-between items-center bg-muted/30 p-3 rounded-lg">
            <div>
              <p className="font-semibold">{spot.district}</p>
              <p className="text-sm text-muted-foreground">{spot.concern}</p>
            </div>
            <div className={`px-3 py-1 text-sm rounded-full ${
              spot.level === 'High' ? 'bg-red-500/20 text-red-400' :
              spot.level === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-green-500/20 text-green-400'
            }`}>
              {spot.level}
            </div>
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
  const containerRef = useRef<HTMLDivElement | null>(null);

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
        <StatCard title="High Concern Districts" value="3" icon={AlertTriangle} color="bg-red-500" />
        <StatCard title="Avg. Sentiment Trend" value="+1.2%" icon={TrendingUp} color="bg-green-500" />
        <StatCard title="Total Calls Analyzed" value="1,482" icon={Users} color="bg-blue-500" />
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
            )}
          </motion.div>
        </div>
        <div className="h-[500px] lg:h-auto">
          <ConcernHotspotList />
        </div>
      </div>
    </motion.div>
  );
}
