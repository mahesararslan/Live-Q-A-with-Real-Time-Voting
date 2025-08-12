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
          
          // Fetch user data using the getUserDetails API
          try {
            const userData = await authApi.getUserDetails(parseInt(userId));
            setUser(userData);
          } catch (error) {
            console.error('Failed to fetch user details:', error);
            // Clear invalid auth
            authApi.logout();
          }
        } else {
          // Check for stored auth
          const { token, userId } = authApi.getStoredAuth();
          if (token && userId) {
            try {
              // Fetch user data for stored auth
              const userData = await authApi.getUserDetails(parseInt(userId));
              setUser(userData);
            } catch (error) {
              console.error('Failed to fetch user details:', error);
              // Clear invalid auth
              authApi.logout();
            }
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
      
      // Fetch user data using the getUserDetails API
      const userData = await authApi.getUserDetails(authPayload.userId);
      setUser(userData);
    } catch (error) {
      console.error('Sign in failed:', error);
      
      // Enhanced error handling for specific cases
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('Entity not found')) {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      } else if (errorMessage.includes('Cannot return null for non-nullable field')) {
        throw new Error('Account data error. Please try again or contact support.');
      } else {
        throw new Error('Sign in failed. Please try again.');
      }
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
      
      // Enhanced error handling for signup
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('duplicate key value violates unique constraint')) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      } else if (errorMessage.includes('validation failed')) {
        throw new Error('Please check your information and try again.');
      } else {
        throw new Error('Sign up failed. Please try again.');
      }
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
