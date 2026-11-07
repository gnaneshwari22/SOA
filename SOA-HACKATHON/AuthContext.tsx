import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (userData: { username: string; email: string; password?: string; role: string; organization: string }) => Promise<void>;
  logout: () => void;
  switchDemoUser: (preset: 'officer' | 'helios' | 'boreas' | 'ecotech') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_PRESETS = [
  {
    key: 'officer' as const,
    label: 'Registry Officer',
    email: 'officer@registry.org',
    role: 'registryOfficer',
    organization: 'Global Clean Energy Registry',
    description: 'Can issue certificates & oversee global registry',
  },
  {
    key: 'helios' as const,
    label: 'Helios Solar Corp',
    email: 'solar@helios-power.com',
    role: 'certificateOwner',
    organization: 'Helios Solar Energy Corp',
    description: 'Owns REC101 & geothermal certificates',
  },
  {
    key: 'boreas' as const,
    label: 'Boreas Wind Parks',
    email: 'wind@boreas-wind.com',
    role: 'certificateOwner',
    organization: 'Boreas Wind Parks LLC',
    description: 'Wind certificate owner & trading counterparty',
  },
  {
    key: 'ecotech' as const,
    label: 'EcoTech Industries',
    email: 'corporate@eco-tech.com',
    role: 'certificateOwner',
    organization: 'EcoTech Industries Inc',
    description: 'Corporate buyer & claimant of hydro certificates',
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('soa_jwt_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('soa_jwt_token');
        if (storedToken) {
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);
        } else {
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        localStorage.removeItem('soa_jwt_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string = 'password') => {
    setIsLoading(true);
    try {
      const data = await authApi.login(email, password);
      localStorage.setItem('soa_jwt_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: { username: string; email: string; password?: string; role: string; organization: string }) => {
    setIsLoading(true);
    try {
      const data = await authApi.register(userData);
      localStorage.setItem('soa_jwt_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('soa_jwt_token');
    setToken(null);
    setUser(null);
  };

  const switchDemoUser = async (preset: 'officer' | 'helios' | 'boreas' | 'ecotech') => {
    const target = DEMO_PRESETS.find(p => p.key === preset);
    if (target) {
      await login(target.email);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, switchDemoUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
