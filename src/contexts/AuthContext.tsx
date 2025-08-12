import React, { createContext, useContext, useState, useEffect } from 'react';
import { CredentialResponse } from '@react-oauth/google';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentialResponse: CredentialResponse) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData: User = JSON.parse(storedUser);
      setUser(userData);
      fetch('http://localhost:5000/update-last-seen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userData.email }),
      });
    }
    setLoading(false);
  }, []);

  const login = async (credentialResponse: CredentialResponse): Promise<boolean> => {
    try {
      if (credentialResponse.credential) {
        const payload = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
        const email = payload.email;

        const response = await fetch('/allowed-users.json');
        const allowedUsersData = await response.json();
        
        if (!allowedUsersData.users.includes(email)) {
          logout();
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You are not authorized to access these services. Please contact your administrator.",
          });
          return false;
        }

        const userData: User = {
          id: payload.sub,
          name: payload.name,
          email: payload.email,
          picture: payload.picture,
        };

        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));

        await fetch('http://localhost:5000/update-last-seen', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: userData.email }),
        });

        toast({
          title: "Welcome!",
          description: `Successfully logged in as ${userData.name}`,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "An error occurred during login. Please try again.",
      });
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
