'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'CUSTOMER';
  avatar?: string;
  phone?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const token = localStorage.getItem('token') || Cookies.get('token');
      if (token) {
        try {
          api.defaults.headers.Authorization = `Bearer ${token}`;
          const response = await api.get('/auth/profile');
          setUser(response.data);
          // Ensure token is in both storage locations
          localStorage.setItem('token', token);
          Cookies.set('token', token, { expires: 7 });
        } catch (error) {
          localStorage.removeItem('token');
          Cookies.remove('token');
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting login with:', { email });
      console.log('🔐 API base URL:', api.defaults.baseURL);
      
      const response = await api.post('/auth/login', { email, password });
      const { access_token, token, user: userData } = response.data;
      const finalToken = access_token || token;
      
      console.log('✅ Login successful!');
      console.log('Login response:', response.data);
      console.log('User data:', userData);
      console.log('User role:', userData?.role);
      
      localStorage.setItem('token', finalToken);
      Cookies.set('token', finalToken, { expires: 7 });
      api.defaults.headers.Authorization = `Bearer ${finalToken}`;
      
      // Update state first
      setUser(userData);
      
      toast.success('Login successful!');
      
      // Redirect after state update with a small delay
      setTimeout(() => {
        if (userData?.role === 'ADMIN') {
          console.log('🔐 Redirecting to admin...');
          router.push('/admin');
        } else {
          console.log('🔐 Redirecting to home...');
          router.push('/');
        }
      }, 100);
    } catch (error: any) {
      console.warn('❌ Login failed!');
      console.warn('Error message:', error.message);
      
      const message = error.response?.data?.message || error.message || 'Login failed';
      toast.error(message);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        name,
      });
      const { access_token, token, user: userData } = response.data;
      const finalToken = access_token || token;
      
      localStorage.setItem('token', finalToken);
      Cookies.set('token', finalToken, { expires: 7 });
      api.defaults.headers.Authorization = `Bearer ${finalToken}`;
      setUser(userData);
      
      toast.success('Registration successful!');
      router.push('/');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    Cookies.remove('token');
    delete api.defaults.headers.Authorization;
    setUser(null);
    toast.success('Logged out successfully');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
