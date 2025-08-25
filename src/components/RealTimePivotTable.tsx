import { useState, useEffect, useMemo } from 'react';
import { motion, Variants } from 'framer-motion';
import Papa from 'papaparse';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';

interface PivotData {
  headers: string[];
  rows: Record<string, string>[];
}

// --- Fallback CSV (used if /pivot_data fails or returns empty) ---
const FALLBACK_CSV = `Demographic Group,Approval Rating,Pressing Concerns,Avg Call Length,Persuasion Shift,Swing Potential,Trend
White College-Educated,68%,"Economy, Healthcare, +1",12:34,+5.2%,High,📈 
Hispanic Working Class,45%,"Immigration, Jobs, +1",8:45,-2.1%,Medium,📉
Black Urban Voters,72%,"Criminal Justice, Education, +1",15:22,+3.8%,Low,📈 
Rural White Non-College,38%,"Economy, Immigration, +1",6:12,-4.3%,High,📉
Suburban Women,55%,"Healthcare, Education, +1",11:08,+1.7%,High,Stable
Young Voters (18–29),62%,"Climate, Student Debt, +1",9:33,+2.9%,Medium,📈 `;

async function fetchPivotData(): Promise<PivotData> {
  try {
    const response = await apiFetch('/pivot_data');
    const csvText = await response.text();
    const parsed = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true });
    const headers = parsed.meta.fields || [];
    const rows = parsed.data.filter(r => Object.keys(r || {}).length);

    // If API returns nothing useful, fall back to the baked CSV
    if (!headers.length || !rows.length) throw new Error('Empty CSV from API');

    return { headers, rows };
  } catch (error) {
    console.warn('Using fallback CSV due to fetch/parse issue:', error);
    const parsed = Papa.parse<Record<string, string>>(FALLBACK_CSV, { header: true, skipEmptyLines: true });
    return {
      headers: parsed.meta.fields || [],
      rows: parsed.data,
    };
  }
}

const cellVariants: Variants = {
  hidden: { opacity: 0, y: -15, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.04, duration: 0.35, ease: 'easeOut' },
  }),
};

function pctToNum(pct: string | undefined): number {
  if (!pct) return 0;
  const n = parseFloat(pct.toString().replace('%', ''));
  return isNaN(n) ? 0 : n;
}

function timeToSeconds(t: string | undefined): number {
  if (!t) return 0;
  const [m, s] = t.split(':').map(Number);
  return (m || 0) * 60 + (s || 0);
}

function deriveStatus(row: Record<string, string>): { label: string; classes: string } {
  const approval = pctToNum(row['Approval Rating']);
  const shift = parseFloat((row['Persuasion Shift'] || '0').replace('%', ''));

  // Simple heuristic for a status signal used for badge and row accent
  if (approval < 40 || shift <= -3) {
    return { label: 'Critical', classes: 'bg-red-500/20 text-red-300 border-red-400/40 shadow-[0_0_10px_rgba(239,68,68,0.35)]' };
  }
  if (approval < 50 || shift < 0) {
    return { label: 'Elevated', classes: 'bg-orange-500/20 text-orange-300 border-orange-400/40 shadow-[0_0_10px_rgba(249,115,22,0.3)]' };
  }
  if (approval < 60) {
    return { label: 'Warning', classes: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/40 shadow-[0_0_10px_rgba(250,204,21,0.3)]' };
  }
  return { label: 'Normal', classes: 'bg-green-500/20 text-green-300 border-green-400/40 shadow-[0_0_10px_rgba(34,197,94,0.3)]' };
}

function splitConcerns(val: string | undefined): string[] {
  if (!val) return [];
  return val
    .split(',')
    .map(x => x.trim())
    .filter(Boolean);
}

function swingClasses(swing: string | undefined): string {
  switch ((swing || '').toLowerCase()) {
    case 'high':
      return 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40';
    case 'medium':
      return 'bg-blue-500/20 text-blue-300 border-blue-400/40';
    case 'low':
      return 'bg-slate-500/20 text-slate-300 border-slate-400/40';
    default:
      return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
  }
}

function trendChip(trend: string | undefined): { text: string; classes: string } {
  const t = (trend || '').trim();
  if (t.includes('📈')) return { text: 'Uptrend 📈', classes: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
  if (t.includes('📉')) return { text: 'Downtrend 📉', classes: 'bg-rose-500/15 text-rose-300 border-rose-500/30' };
  return { text: 'Stable', classes: 'bg-slate-500/15 text-slate-300 border-slate-500/30' };
}

export default function RealTimePivotTable() {
  const [data, setData] = useState<PivotData>({ headers: [], rows: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [swingFilter, setSwingFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPivotData().then(pivotData => {
        setData(pivotData);
        setIsLoading(false);
      });
    }, 900); // snappier
    return () => clearTimeout(timer);
  }, []);

  const rows = useMemo(() => {
    const filtered = data.rows.filter(r => {
      const matchesQuery = !query || (r['Demographic Group'] || '').toLowerCase().includes(query.toLowerCase());
      const matchesSwing = swingFilter === 'All' || (r['Swing Potential'] || '').toLowerCase() === swingFilter.toLowerCase();
      return matchesQuery && matchesSwing;
    });

    // Sort by Approval desc by default (stable visual order)
    return filtered.sort((a, b) => pctToNum(b['Approval Rating']) - pctToNum(a['Approval Rating']));
  }, [data.rows, query, swingFilter]);

  // Quick KPI tiles
  const kpis = useMemo(() => {
    if (!rows.length) return { avgApproval: 0, avgCall: 0, positives: 0, negatives: 0 };
    const avgApproval = Math.round((rows.reduce((s, r) => s + pctToNum(r['Approval Rating']), 0) / rows.length) * 10) / 10;
    const avgCall = Math.round((rows.reduce((s, r) => s + timeToSeconds(r['Avg Call Length']), 0) / rows.length));
    const pos = rows.filter(r => parseFloat((r['Persuasion Shift'] || '0').replace('%', '')) >= 0).length;
    const neg = rows.length - pos;
    return { avgApproval, avgCall, positives: pos, negatives: neg };
  }, [rows]);

  return (
    <motion.div
      className="relative bg-gradient-to-br from-[#0B0F19] via-[#111827] to-[#0B0F19] rounded-2xl p-6 shadow-2xl border border-slate-700/50 overflow-hidden"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* Glow aura */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-indigo-500/5 to-pink-500/10 blur-2xl" />

      {/* Header */}
      <div className="relative z-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-md">
            Demographics Analysis
          </h3>
          <p className="text-slate-400 text-sm">Detailed breakdown of approval, concerns, and persuasion metrics by group</p>
        </div>
        <div className="flex gap-2 mt-2">
          <div className="hidden sm:flex gap-2">
            <KpiTile label="Avg Approval" value={`${kpis.avgApproval}%`} hint="Mean across shown rows" />
            <KpiTile label="Avg Call Length" value={`${Math.floor(kpis.avgCall / 60)}:${String(kpis.avgCall % 60).padStart(2, '0')}`} hint="mm:ss" />
            <KpiTile label="Shift: + / -" value={`${kpis.positives} / ${kpis.negatives}`} />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="relative z-10 mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2">
            <span className="text-slate-400 text-xs">Swing</span>
            {(['All','High','Medium','Low'] as const).map(opt => (
              <button
                key={opt}
                onClick={() => setSwingFilter(opt)}
                className={cn('text-xs px-2 py-1 rounded-lg transition',
                  swingFilter === opt ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/40' : 'text-slate-300 hover:text-white')}
              >{opt}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 w-full sm:w-72">
            <svg width="16" height="16" fill="currentColor" className="text-slate-400"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398l3.85 3.85a1 1 0 0 0 1.415-1.415l-3.868-3.833zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg>
            <input
              placeholder="Search group…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="bg-transparent outline-none text-sm text-slate-200 placeholder:text-slate-500 w-full"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="relative z-10 mt-5 overflow-x-auto rounded-xl border border-slate-700/60">
        <table className="w-full text-sm text-left border-collapse backdrop-blur">
          <thead className="bg-slate-800/60 border-b border-slate-700/60 sticky top-0">
            <tr>
              {['Demographic Group','Approval','Concerns','Call Length','Shift','Swing','Trend','Status'].map((header, i) => (
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
            {isLoading && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-slate-400">⚡ Syncing Real-time Parameters…</td>
              </tr>
            )}
            {!isLoading && rows.map((row, rowIndex) => {
              const status = deriveStatus(row);
              const trend = trendChip(row['Trend']);
              const shiftVal = parseFloat((row['Persuasion Shift'] || '0').replace('%', ''));
              const shiftPct = Math.min(Math.abs(shiftVal) * 3, 100); // map ± to width with cap

              return (
                <motion.tr
                  key={rowIndex}
                  className={cn('transition-colors duration-300 border-b border-slate-700/40 last:border-b-0',
                    'hover:bg-slate-700/20')}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: rowIndex * 0.06 }}
                >
                  {/* Demographic Group */}
                  <td className="p-3 text-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-100">{row['Demographic Group']}</span>
                    </div>
                  </td>

                  {/* Approval Rating */}
                  <td className="p-3 text-slate-200 align-middle">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                        <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${pctToNum(row['Approval Rating'])}%` }} />
                      </div>
                      <span className="text-slate-200 font-semibold">{row['Approval Rating']}</span>
                    </div>
                  </td>

                  {/* Pressing Concerns -> bubbles */}
                  <td className="p-3 text-slate-200">
                    <div className="flex flex-wrap gap-2">
                      {splitConcerns(row['Pressing Concerns']).map((c, i) => (
                        <motion.span
                          key={c + i}
                          initial={{ opacity: 0, y: 4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: 0.03 * i }}
                          className={cn(
                            'px-2.5 py-1 rounded-full text-[11px] font-medium border backdrop-blur-sm',
                            c.startsWith('+')
                              ? 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-400/30'
                              : 'bg-slate-700/30 text-slate-200 border-slate-500/30'
                          )}
                        >
                          {c.startsWith('+') ? `Priority ${c}` : c}
                        </motion.span>
                      ))}
                    </div>
                  </td>

                  {/* Avg Call Length */}
                  <td className="p-3 text-slate-200 whitespace-nowrap">{row['Avg Call Length']}</td>

                  {/* Persuasion Shift */}
                  <td className="p-3 text-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                        <div
                          className={cn('h-2 rounded-full', shiftVal >= 0 ? 'bg-green-500' : 'bg-red-500')}
                          style={{ width: `${shiftPct}%` }}
                        />
                      </div>
                      <span className={cn('font-medium', shiftVal >= 0 ? 'text-green-400' : 'text-red-400')}>
                        {row['Persuasion Shift']}
                      </span>
                    </div>
                  </td>

                  {/* Swing Potential */}
                  <td className="p-3 text-slate-200">
                    <span className={cn('px-3 py-1.5 rounded-full text-xs font-medium border inline-block backdrop-blur-sm', swingClasses(row['Swing Potential']))}>
                      {row['Swing Potential']}
                    </span>
                  </td>

                  {/* Trend */}
                  <td className="p-3 text-slate-200">
                    <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium border inline-block backdrop-blur-sm', trend.classes)}>
                      {trend.text}
                    </span>
                  </td>

                  {/* Derived Status */}
                  <td className="p-3 text-slate-200">
                    <span className={cn('px-3 py-1.5 rounded-full text-xs font-medium border inline-block backdrop-blur-sm', status.classes)}>
                      {status.label}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer legend */}
      <div className="relative z-10 mt-4 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
        <span className="px-2 py-1 rounded-md bg-slate-800/60 border border-slate-700/60">Priority +N = pushed issue during canvass</span>
        <span className="px-2 py-1 rounded-md bg-slate-800/60 border border-slate-700/60">Status is derived from approval & shift</span>
      </div>
    </motion.div>
  );
}

function KpiTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 px-3 py-2 min-w-[110px]">
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-slate-100 text-sm font-semibold">{value}</div>
      {hint && <div className="text-[10px] text-slate-500">{hint}</div>}
    </div>
  );
}
