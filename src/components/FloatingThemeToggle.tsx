import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

export const FloatingThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <motion.button
      onClick={toggleTheme}
      className="fixed top-6 right-6 z-50 w-12 h-12 rounded-full glass border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all group"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-glow/10 to-cyan-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative w-5 h-5">
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={{
            scale: theme === 'light' ? 1 : 0,
            rotate: theme === 'light' ? 0 : 180,
          }}
          transition={{ duration: 0.3 }}
        >
          <Sun className="w-5 h-5" />
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
          <Moon className="w-5 h-5" />
        </motion.div>
      </div>
    </motion.button>
  );
};
