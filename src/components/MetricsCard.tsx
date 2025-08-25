import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { TrendIndicator } from './TrendIndicator';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'purple' | 'cyan' | 'green' | 'orange' | 'red';
  delay?: number;
}

export const MetricsCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend = 'neutral',
  trendValue,
  color = 'purple',
  delay = 0 
}: MetricsCardProps) => {
  const colorClasses = {
    purple: 'from-purple-glow/20 to-purple-glow/5 border-purple-glow/30 text-purple-glow',
    cyan: 'from-cyan-accent/20 to-cyan-accent/5 border-cyan-accent/30 text-cyan-accent',
    green: 'from-green-success/20 to-green-success/5 border-green-success/30 text-green-success',
    orange: 'from-orange-warning/20 to-orange-warning/5 border-orange-warning/30 text-orange-warning',
    red: 'from-red-danger/20 to-red-danger/5 border-red-danger/30 text-red-danger',
  };

  // Removed emoji bubble; use shadcn-like TrendIndicator

  return (
    <motion.div
      className="glass rounded-2xl p-6 relative overflow-hidden group hover:scale-105 transition-transform duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5 }}
    >
  {/* Background gradient */}
  <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-40 group-hover:opacity-60 transition-opacity duration-300`} />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <Icon className={`w-5 h-5 ${colorClasses[color].split(' ')[3]}`} />
        </div>

        <div className="space-y-2">
          <motion.div
            className="text-2xl font-bold"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: delay + 0.2 }}
          >
            {value}
          </motion.div>

          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}

          {trendValue && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.4 }}>
              <TrendIndicator direction={trend} value={trendValue} />
            </motion.div>
          )}
        </div>
      </div>

      {/* Hover glow effect */}
  <motion.div className="absolute inset-0 opacity-0 group-hover:opacity-15 transition-opacity duration-300" />
    </motion.div>
  );
};