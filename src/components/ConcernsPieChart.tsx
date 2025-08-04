import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

async function fetchTopConcerns() {
  try {
    const response = await fetch('http://127.0.0.1:5000/top_concerns');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Top concerns data loaded:", data);
    return data;
  } catch (error) {
    console.error("Failed to fetch top concerns:", error);
    return [];
  }
}

export const ConcernsPieChart = () => {
  const [concerns, setConcerns] = useState([]);

  useEffect(() => {
    fetchTopConcerns().then(setConcerns);
  }, []);

  if (!concerns || concerns.length === 0) {
    return (
      <div className="glass rounded-2xl p-4 flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading concerns data...</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="glass rounded-2xl p-4 h-full flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <h3 className="text-lg font-semibold mb-2 gradient-text text-center">Top 3 Concerns</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={concerns}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {concerns.map((entry, index) => (
              <Cell key={`cell-` + index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
             contentStyle={{
              background: 'rgba(30, 41, 59, 0.8)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '0.5rem',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
};
