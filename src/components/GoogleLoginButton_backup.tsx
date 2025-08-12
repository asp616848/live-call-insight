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
              <img
                src={user.picture}
                alt={user.name}
                className="w-8 h-8 rounded-full border-2 border-primary/30"
              />
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
              <img
                src={user.picture}
                alt={user.name}
                className="w-8 h-8 rounded-full border-2 border-primary/30"
              />
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

// Alternative custom styled login button
export const CustomGoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ collapsed = false }) => {
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
              <img
                src={user.picture}
                alt={user.name}
                className="w-8 h-8 rounded-full border-2 border-primary/30"
              />
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
              <img
                src={user.picture}
                alt={user.name}
                className="w-8 h-8 rounded-full border-2 border-primary/30"
              />
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
        <motion.button
          className="w-full relative group overflow-hidden rounded-xl p-3 bg-gradient-to-r from-[#4285f4] to-[#34a853] hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            // This would trigger the Google OAuth flow
            // For now, we'll use the GoogleLogin component
          }}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
          
          <div className="relative flex items-center justify-center gap-3">
            <div className="w-5 h-5 bg-white rounded-sm flex items-center justify-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <span className="text-white font-medium">Sign in with Google</span>
          </div>
        </motion.button>
      ) : (
        <motion.button
          className="w-full relative group overflow-hidden rounded-lg p-2 bg-gradient-to-r from-[#4285f4] to-[#34a853] hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Sign in with Google"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
          
          <div className="relative flex items-center justify-center">
            <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
          </div>
        </motion.button>
      )}
    </motion.div>
  );
};
