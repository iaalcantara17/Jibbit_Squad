import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, UserProfile } from '@/lib/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  deleteAccount: (password: string) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = async () => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    console.log('🔵 Fetching profile from server...');
    const response = await api.getProfile();
    console.log('🔵 Profile fetch response:', response);
    
    if (response.success && response.data) {
      // Also fetch basic info and merge it into user data
      const basicInfoResponse = await api.getBasicInfo();
      let userData = response.data;
      
      if (basicInfoResponse.success && basicInfoResponse.data && basicInfoResponse.data.length > 0) {
        // Merge the first basic info entry into the user data
        userData = {
          ...response.data,
          basicInfo: basicInfoResponse.data[0]
        };
      }
      
      console.log('🔵 Setting user data:', userData);
      setUser(userData);
    } else {
      console.error('❌ Profile fetch failed, clearing auth');
      // Token invalid, clear auth
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    refreshProfile();
  }, [token]);

  const login = async (email: string, password: string) => {
    const response = await api.login({ email, password });
    
    if (response.success && response.data?.token) {
      localStorage.setItem('auth_token', response.data.token);
      setToken(response.data.token);
      return { success: true };
    }
    
    return { 
      success: false, 
      error: response.error?.message || 'Login failed' 
    };
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await api.register({ name, email, password });
    
    if (response.success) {
      // Auto-login after registration
      return login(email, password);
    }
    
    return { 
      success: false, 
      error: response.error?.message || 'Registration failed' 
    };
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    api.logout();
  };

  const deleteAccount = async (password: string) => {
    const response = await api.deleteAccount(password);
    
    if (response.success) {
      // Clear auth state after successful deletion
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
      return { success: true };
    }
    
    return { 
      success: false, 
      error: response.error?.message || 'Account deletion failed' 
    };
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, deleteAccount, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
