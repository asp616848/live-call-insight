import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
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

export default function IndiaMap() {
  const [hoverInfo, setHoverInfo] = useState<{ name: string } | null>(null);

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
    </motion.div>
  );
}
