import React, { createContext, useContext, useState, useEffect } from 'react';
import { CredentialResponse } from '@react-oauth/google';

interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentialResponse: CredentialResponse) => Promise<void>;
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

  const login = async (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      const payload = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
      const email = payload.email;

      const response = await fetch('/allowed-users.json');
      const allowedUsersData = await response.json();
      
      if (!allowedUsersData.users.includes(email)) {
        logout();
        throw new Error("User not authorized.");
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
