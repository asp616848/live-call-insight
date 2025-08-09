import React, { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

const geoUrl = "/bihar_districts.json";
const concernsUrl = "/concernData.json";

const colorMap = {
  High: '#f87171',     // red-400
  Medium: '#facc15',   // yellow-400
  Low: '#4ade80',      // green-400
  Unknown: '#e5e7eb'   // gray-200
};

const MapChart = () => {
  const [tooltip, setTooltip] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [concernData, setConcernData] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(geoUrl)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => setGeoData(data))
      .catch(e => {
        console.error("Error fetching geoData:", e);
        setError("Could not load map data.");
      });

    fetch(concernsUrl)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => setConcernData(data))
      .catch(e => {
        console.error("Error fetching concernData:", e);
      });
  }, []);

  if (error) {
    return <div>{error}</div>;
  }

  if (!geoData) {
    return <div>Loading map...</div>;
  }

  return (
    <div className="relative w-full h-full">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 5000, center: [85.3, 25.5] }}
        width={800}
        height={600}
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={geoData}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const districtName = geo.properties.district;
              const concern = concernData[districtName] || { level: 'Unknown', concern: 'No data' };

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={() => setTooltip({ name: districtName, ...concern })}
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    default: {
                      fill: colorMap[concern.level],
                      outline: 'none',
                    },
                    hover: {
                      fill: '#6366f1',
                      outline: 'none',
                    },
                    pressed: {
                      fill: '#4338ca',
                      outline: 'none',
                    },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {tooltip && (
        <div className="absolute top-4 left-4 bg-white shadow-md rounded p-3 text-sm z-10">
          <strong>{tooltip.name}</strong><br />
          Concern: {tooltip.concern}<br />
          Severity: {tooltip.level}
        </div>
      )}
    </div>
  );
};

export default MapChart;
