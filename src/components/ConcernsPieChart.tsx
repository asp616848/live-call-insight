import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { motion } from 'framer-motion';
import { Skeleton } from './ui/skeleton';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 5) * cos;
  const sy = cy + (outerRadius + 5) * sin;
  const mx = cx + (outerRadius + 20) * cos;
  const my = cy + (outerRadius + 20) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 12;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill="white" className="text-sm font-semibold">
        {payload.name}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill={fill} className="text-lg font-bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        cornerRadius={5}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 4}
        outerRadius={outerRadius + 8}
        fill={fill}
        cornerRadius={5}
      />
    </g>
  );
};


async function fetchTopConcerns() {
  try {
    const response = await fetch('http://127.0.0.1:5000/top_concerns');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch top concerns:", error);
    return [];
  }
}

export const ConcernsPieChart = () => {
  const [concerns, setConcerns] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetchTopConcerns().then(data => {
      setConcerns(data);
      setIsLoading(false);
    });
  }, []);

  const onPieEnter = (_, index: number) => {
    setActiveIndex(index);
  };

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-4 h-full flex flex-col items-center justify-center">
        <Skeleton className="w-32 h-6 mb-4" />
        <div className="flex items-center justify-center">
          <Skeleton className="w-48 h-48 rounded-full" />
          <div className="ml-8 space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="glass rounded-2xl p-4 h-full flex flex-col relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-radial from-purple-glow/10 to-transparent animate-spin-slow pointer-events-none" />
      <h3 className="text-lg font-semibold mb-2 gradient-text text-center z-10">Top 3 Concerns</h3>
      <div className="flex-grow flex flex-col md:flex-row items-center">
        <div className="w-full md:w-2/3 h-64 md:h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={concerns}
                cx="50%"
                cy="50%"
                innerRadius={150}
                outerRadius={180}
                fill="#8884d8"
                dataKey="value"
                onMouseEnter={onPieEnter}
                paddingAngle={5}
                cornerRadius={10}
              >
                {concerns.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="stroke-none focus:outline-none" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full md:w-1/3 flex flex-col justify-center space-y-2 z-10 p-4">
          {concerns.map((entry, index) => (
            <motion.div
              key={`legend-${index}`}
              className={`flex items-start p-2 rounded-lg cursor-pointer transition-all ${
                index === activeIndex ? 'bg-primary/20' : 'bg-transparent'
              }`}
              onMouseEnter={() => setActiveIndex(index)}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
            >
              <div
                className="w-3 h-3 rounded-full mr-3 flex-shrink-0 mt-1"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <div className="flex-grow pr-2">
                <span className="text-sm text-foreground break-words whitespace-normal block leading-snug">
                  {entry.name}
                </span>
                <span className="text-xs text-muted-foreground">{entry.value} calls</span>
              </div>
              <span
                className="text-sm font-bold text-foreground text-right"
                style={{ minWidth: '40px' }}
              >
                {`${((entry.value / concerns.reduce((acc, curr) => acc + curr.value, 0)) * 100).toFixed(0)}%`}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
