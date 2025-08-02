import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface LatencyGaugeProps {
  latency: number; // in milliseconds
  maxLatency?: number;
}

export const LatencyGauge = ({ latency, maxLatency = 3000 }: LatencyGaugeProps) => {
  const [displayLatency, setDisplayLatency] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayLatency(latency);
    }, 500);
    return () => clearTimeout(timer);
  }, [latency]);

  // Calculate angle for needle (-90 to 90 degrees)
  const angle = ((displayLatency / maxLatency) * 180) - 90;
  const clampedAngle = Math.max(-90, Math.min(90, angle));

  // Determine color based on latency
  const getLatencyColor = (ms: number) => {
    if (ms <= 500) return 'text-green-success';
    if (ms <= 1000) return 'text-orange-warning';
    return 'text-red-danger';
  };

  const getLatencyStatus = (ms: number) => {
    if (ms <= 500) return { status: 'Excellent', color: 'green-success' };
    if (ms <= 1000) return { status: 'Good', color: 'orange-warning' };
    if (ms <= 2000) return { status: 'Fair', color: 'orange-warning' };
    return { status: 'Poor', color: 'red-danger' };
  };

  const status = getLatencyStatus(displayLatency);

  return (
    <motion.div
      className="glass rounded-3xl p-8 relative overflow-hidden"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-glow/10 via-transparent to-cyan-accent/10 pointer-events-none" />
      
      <div className="relative">
        <h3 className="text-lg font-semibold mb-6 text-center gradient-text">
          Response Latency
        </h3>

        {/* Gauge Container */}
        <div className="relative w-64 h-32 mx-auto mb-6">
          {/* Gauge Background Arc */}
          <svg className="w-full h-full" viewBox="0 0 200 100">
            {/* Background arc */}
            <path
              d="M 20 80 A 80 80 0 0 1 180 80"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
              strokeLinecap="round"
            />
            
            {/* Color segments */}
            <path
              d="M 20 80 A 80 80 0 0 1 100 20"
              fill="none"
              stroke="hsl(var(--green-success))"
              strokeWidth="8"
              strokeLinecap="round"
              opacity="0.6"
            />
            <path
              d="M 100 20 A 80 80 0 0 1 150 35"
              fill="none"
              stroke="hsl(var(--orange-warning))"
              strokeWidth="8"
              strokeLinecap="round"
              opacity="0.6"
            />
            <path
              d="M 150 35 A 80 80 0 0 1 180 80"
              fill="none"
              stroke="hsl(var(--red-danger))"
              strokeWidth="8"
              strokeLinecap="round"
              opacity="0.6"
            />

            {/* Needle */}
            <motion.g
              initial={{ rotate: -90 }}
              animate={{ rotate: clampedAngle }}
              transition={{ 
                duration: 1.5, 
                ease: "easeOut",
                type: "spring",
                damping: 15,
                stiffness: 100
              }}
              style={{ transformOrigin: "100px 80px" }}
            >
              <line
                x1="100"
                y1="80"
                x2="100"
                y2="30"
                stroke="hsl(var(--foreground))"
                strokeWidth="3"
                strokeLinecap="round"
                filter="drop-shadow(0 0 6px hsl(var(--primary)))"
              />
              <circle
                cx="100"
                cy="80"
                r="6"
                fill="hsl(var(--primary))"
                className="drop-shadow-lg"
              />
            </motion.g>

            {/* Scale marks */}
            {[0, 500, 1000, 1500, 2000, 2500, 3000].map((value, index) => {
              const markAngle = ((value / maxLatency) * 180) - 90;
              const radians = (markAngle * Math.PI) / 180;
              const x1 = 100 + Math.cos(radians) * 70;
              const y1 = 80 + Math.sin(radians) * 70;
              const x2 = 100 + Math.cos(radians) * 75;
              const y2 = 80 + Math.sin(radians) * 75;

              return (
                <g key={value}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth="1"
                  />
                  <text
                    x={100 + Math.cos(radians) * 85}
                    y={80 + Math.sin(radians) * 85}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs fill-muted-foreground"
                    fontSize="8"
                  >
                    {value < 1000 ? `${value}` : `${value / 1000}k`}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Digital Display */}
        <div className="text-center space-y-3">
          <motion.div
            className="text-4xl font-bold font-mono"
            key={displayLatency}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <span className={getLatencyColor(displayLatency)}>
              {displayLatency.toFixed(0)}
            </span>
            <span className="text-2xl text-muted-foreground ml-1">ms</span>
          </motion.div>

          <motion.div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-${status.color}/20 text-${status.color} border border-${status.color}/30`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className={`w-2 h-2 rounded-full bg-${status.color} animate-pulse`} />
            {status.status}
          </motion.div>
        </div>

        {/* Performance tip */}
        <motion.p
          className="text-xs text-muted-foreground text-center mt-4 italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {displayLatency <= 500 && "🚀 Lightning fast response!"}
          {displayLatency > 500 && displayLatency <= 1000 && "✨ Good response time"}
          {displayLatency > 1000 && displayLatency <= 2000 && "⚡ Consider optimization"}
          {displayLatency > 2000 && "🔧 Performance needs attention"}
        </motion.p>
      </div>
    </motion.div>
  );
};