import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleProps {
  collapsed?: boolean;
}

export const ThemeToggle = ({ collapsed = false }: ThemeToggleProps) => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <motion.button
      onClick={toggleTheme}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative overflow-hidden text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent hover:border-primary/20"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.8 }}
      title={collapsed ? `Switch to ${theme === 'light' ? 'dark' : 'light'} mode` : undefined}
    >
      {/* Hover glow effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-purple-glow/5 to-cyan-accent/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
        initial={false}
      />
      
      <div className="relative w-5 h-5 flex-shrink-0">
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={{
            scale: theme === 'light' ? 1 : 0,
            rotate: theme === 'light' ? 0 : 180,
          }}
          transition={{ duration: 0.3 }}
        >
          <Sun className="w-5 h-5 text-orange-warning" />
        </motion.div>
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={{
            scale: theme === 'dark' ? 1 : 0,
            rotate: theme === 'dark' ? 0 : -180,
          }}
          transition={{ duration: 0.3 }}
        >
          <Moon className="w-5 h-5 text-cyan-accent" />
        </motion.div>
      </div>
      
      {!collapsed && (
        <motion.span
          className="font-medium relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </motion.span>
      )}
      
      {/* Active indicator */}
      {!collapsed && (
        <motion.div
          className="ml-auto w-2 h-2 rounded-full bg-primary opacity-60"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4 }}
        />
      )}
    </motion.button>
  );
};
