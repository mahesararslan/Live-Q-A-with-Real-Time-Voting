"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi, type User, type AuthPayload } from '@/lib/api/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: { firstName: string; lastName: string; email: string; password: string }) => Promise<void>;
  signOut: () => void;
  googleSignIn: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check for stored auth on mount and URL params (for Google OAuth callback)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check URL params first (for Google OAuth callback)
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const userId = urlParams.get('userId');

        if (token && userId) {
          // Store the auth data from URL params
          authApi.storeAuth({ token, userId: parseInt(userId) });
          
          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // TODO: Fetch user data using the token
          // For now, we'll create a mock user object
          setUser({
            id: parseInt(userId),
            firstName: 'User',
            lastName: '',
            email: 'user@example.com'
          });
        } else {
          // Check for stored auth
          const { token, userId } = authApi.getStoredAuth();
          if (token && userId) {
            // TODO: Validate token and fetch user data
            // For now, we'll create a mock user object
            setUser({
              id: parseInt(userId),
              firstName: 'User',
              lastName: '',
              email: 'user@example.com'
            });
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        authApi.logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const authPayload = await authApi.signIn({ email, password });
      authApi.storeAuth(authPayload);
      
      // TODO: Fetch user data using the token
      // For now, we'll create a mock user object
      setUser({
        id: authPayload.userId,
        firstName: 'User',
        lastName: '',
        email: email
      });
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (data: { firstName: string; lastName: string; email: string; password: string }) => {
    try {
      setIsLoading(true);
      const newUser = await authApi.signUp(data);
      
      // After successful signup, sign them in
      await signIn(data.email, data.password);
    } catch (error) {
      console.error('Sign up failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    authApi.logout();
    setUser(null);
  };

  const googleSignIn = () => {
    authApi.googleLogin();
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    signIn,
    signUp,
    signOut,
    googleSignIn,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
