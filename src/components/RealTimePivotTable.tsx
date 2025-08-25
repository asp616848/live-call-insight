import { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import Papa from 'papaparse';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';

interface PivotData {
  headers: string[];
  rows: Record<string, string>[];
}

async function fetchPivotData(): Promise<PivotData> {
  try {
    const response = await apiFetch('/pivot_data');
    const csvText = await response.text();
    const parsed = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true });
    return {
      headers: parsed.meta.fields || [],
      rows: parsed.data,
    };
  } catch (error) {
    console.error("Failed to fetch pivot data:", error);
    return { headers: [], rows: [] };
  }
}

const cellVariants: Variants = {
  hidden: { opacity: 0, y: -15, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.04,
      duration: 0.35,
      ease: "easeOut"
    }
  })
};

const statusColor: { [key: string]: string } = {
  'Normal': 'bg-green-500/20 text-green-300 border-green-400/40 shadow-[0_0_10px_rgba(34,197,94,0.3)]',
  'Warning': 'bg-yellow-500/20 text-yellow-300 border-yellow-400/40 shadow-[0_0_10px_rgba(250,204,21,0.3)]',
  'Elevated': 'bg-orange-500/20 text-orange-300 border-orange-400/40 shadow-[0_0_10px_rgba(249,115,22,0.3)]',
  'Critical': 'bg-red-500/20 text-red-300 border-red-400/40 shadow-[0_0_10px_rgba(239,68,68,0.4)]',
};

export const RealTimePivotTable = () => {
  const [data, setData] = useState<PivotData>({ headers: [], rows: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPivotData().then(pivotData => {
        setData(pivotData);
        setIsLoading(false);
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-xl animate-pulse">
        <p className="text-slate-400 text-lg tracking-wide">⚡ Syncing Real-time Parameters...</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="relative bg-gradient-to-br from-[#0B0F19] via-[#111827] to-[#0B0F19] rounded-2xl p-6 shadow-2xl border border-slate-700/50 overflow-hidden"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Glow aura */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-indigo-500/5 to-pink-500/10 blur-2xl"></div>

      <h3 className="text-lg font-semibold mb-6 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-md">
        Demographics Analysis
      </h3>
      <p className="text-slate-400 text-sm mb-4">Detailed breakdown of approval ratings, concerns, and persuasion metrics by demographic group</p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse backdrop-blur">
          <thead className="border-b border-slate-700/60">
            <tr>
              {data.headers.map((header, i) => (
                <motion.th 
                  key={header} 
                  className="p-3 font-medium text-slate-400 tracking-wide uppercase text-xs"
                  variants={cellVariants}
                  initial="hidden"
                  animate="visible"
                  custom={i}
                >
                  {header}
                </motion.th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <motion.tr 
                key={rowIndex} 
                className="hover:bg-slate-700/30 transition-colors duration-300 border-b border-slate-700/40 last:border-b-0"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { 
                    opacity: 1,
                    transition: { 
                      delay: rowIndex * 0.08,
                      staggerChildren: 0.05
                    }
                  }
                }}
              >
                {data.headers.map((header, colIndex) => (
                  <motion.td 
                    key={`${rowIndex}-${colIndex}`} 
                    className="p-3 text-slate-300 align-middle"
                    variants={cellVariants}
                  >
                    {header === 'Approval Rating' ? (
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                          <div className="h-2 rounded-full bg-indigo-500" style={{ width: row[header] }}></div>
                        </div>
                        <span className="text-slate-200 font-semibold">{row[header]}</span>
                      </div>
                    ) : header === 'Persuasion Shift' ? (
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                          <div
                            className={cn(
                              "h-2 rounded-full",
                              parseFloat(row[header]) >= 0 ? "bg-green-500" : "bg-red-500"
                            )}
                            style={{ width: Math.min(Math.abs(parseFloat(row[header])) * 3, 80) + "%" }}
                          ></div>
                        </div>
                        <span className={cn(
                          "font-medium",
                          parseFloat(row[header]) >= 0 ? "text-green-400" : "text-red-400"
                        )}>
                          {row[header]}
                        </span>
                      </div>
                    ) : header === 'Status' ? (
                      <span className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium border inline-block backdrop-blur-sm",
                        statusColor[row[header]] || 'bg-gray-500/20 text-gray-300 border-gray-400/30'
                      )}>
                        {row[header]}
                      </span>
                    ) : (
                      <span className="text-slate-200">{row[header]}</span>
                    )}
                  </motion.td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};
