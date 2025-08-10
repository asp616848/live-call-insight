import { 
  BarChart3, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Home,
  Globe,
  FileText,
  Map
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GoogleLoginButton } from './GoogleLoginButton';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: BarChart3, label: 'Call Analytics', path: '/call-analytics' },
  { icon: Globe, label: 'Geo-Analytics', path: '/geo-analytics' },
  { icon: Map, label: 'India Map', path: '/india-map' },
  { icon: FileText, label: 'LangExtract', path: '/lang-extract' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  return (
    <motion.div
      className="relative h-screen glass border-r border-border/30 flex flex-col"
      animate={{
        width: collapsed ? 80 : 280,
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut"
      }}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-glow/10 via-transparent to-cyan-accent/10 pointer-events-none" />
      
      {/* Header */}
      <div className="p-6 border-b border-border/30">
        <motion.div 
          className="flex items-center gap-3"
          animate={{
            justifyContent: collapsed ? 'center' : 'flex-start'
          }}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-glow to-cyan-accent flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-xl font-bold gradient-text">TranzMit Engineering</h1>
              <p className="text-xs text-muted-foreground">Call Analytics</p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          
          return (
            <motion.button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative overflow-hidden ${
                isActive 
                  ? 'bg-primary/20 text-primary border border-primary/30' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {isActive && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-glow/10 to-cyan-accent/10"
                  layoutId="activeTab"
                  transition={{ duration: 0.3 }}
                />
              )}
              
              <item.icon className="w-5 h-5 flex-shrink-0" />
              
              {!collapsed && (
                <motion.span
                  className="font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {item.label}
                </motion.span>
              )}

              {isActive && !collapsed && (
                <motion.div
                  className="ml-auto w-2 h-2 rounded-full bg-primary"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Google Login Section */}
      <div className="p-4 border-t border-border/30">
        <GoogleLoginButton collapsed={collapsed} />
      </div>

      {/* Toggle Button */}
      <div className="p-4 border-t border-border/30">
        <motion.button
          onClick={onToggle}
          className="w-full flex items-center justify-center p-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 mr-2" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    </motion.div>
  );
};
