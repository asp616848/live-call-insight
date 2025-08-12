import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import { LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface GoogleLoginButtonProps {
  collapsed?: boolean;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ collapsed = false }) => {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (isAuthenticated && user) {
    return (
      <motion.div
        className="w-full p-3 rounded-xl glass border border-border/30 backdrop-blur-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="relative">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border-2 border-primary/30"
                />
              ) : (
                <div className="w-8 h-8 rounded-full border-2 border-primary/30 bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <motion.button
              onClick={logout}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border-2 border-primary/30"
                />
              ) : (
                <div className="w-8 h-8 rounded-full border-2 border-primary/30 bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
            </div>
            <motion.button
              onClick={logout}
              className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Logout"
            >
              <LogOut className="w-3 h-3" />
            </motion.button>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {!collapsed ? (
        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-glow to-cyan-accent rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
          
          <div className="relative bg-background/80 backdrop-blur-sm border border-border/50 rounded-xl p-3 overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-glow/5 via-transparent to-cyan-accent/5"></div>
            
            <GoogleLogin
              onSuccess={login}
              onError={() => console.error('Login Failed')}
              theme="filled_blue"
              size="large"
              text="signin_with"
              shape="rectangular"
              logo_alignment="left"
              width="100%"
            />
          </div>
        </div>
      ) : (
        <motion.div
          className="flex justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="relative group">
            {/* Glow effect for collapsed state */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-glow to-cyan-accent rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
            
            <div className="relative bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg p-2 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-glow/5 via-transparent to-cyan-accent/5"></div>
              
              <GoogleLogin
                onSuccess={login}
                onError={() => console.error('Login Failed')}
                theme="filled_blue"
                size="medium"
                shape="circle"
                logo_alignment="center"
              />
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
