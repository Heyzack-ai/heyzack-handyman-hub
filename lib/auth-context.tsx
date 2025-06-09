import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { authClient } from './auth-client';
import * as SecureStore from 'expo-secure-store';

type AuthContextType = {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: { email: string; phone: string; password: string; name: string; role: string }) => Promise<void>;
  deleteAccount: (password?: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const inAuthGroup = segments[0]?.startsWith('auth');
    
    if (!isLoading) {
      if (isAuthenticated && inAuthGroup) {
        // Redirect authenticated users to home if they're in auth group
        router.replace('/(tabs)');
      } else if (!isAuthenticated && !inAuthGroup) {
        // Redirect unauthenticated users to sign in
        router.replace('/auth/signin');
      }
    }
  }, [isAuthenticated, segments, isLoading]);

  async function checkAuth() {
    try {
      // Then verify with Better Auth
      const session = await authClient.getSession();
      console.log('Better Auth session check:', session);
      
      // Check if we have a valid session
      if (session.data) {
        console.log('Valid session found');
        setIsAuthenticated(true);
        return;
      }

      // If no valid session, check stored data
      const sessionData = await SecureStore.getItemAsync('myapp_session');
      const userData = await SecureStore.getItemAsync('myapp_user');
      
      console.log('Stored session data:', {
        sessionData,
        userData
      });
      
      if (sessionData && userData) {
        console.log('Found stored session data, attempting to restore session');
        // Try to restore the session
        const restoredSession = await authClient.getSession();
        console.log('Restored session:', restoredSession);
        
        if (restoredSession.data) {
          console.log('Successfully restored session');
          setIsAuthenticated(true);
          return;
        }
      }

      console.log('No valid session found, clearing data');
      await clearSessionData();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      await clearSessionData();
    } finally {
      setIsLoading(false);
    }
  }

  async function clearSessionData() {
    try {
      await authClient.signOut();
      await SecureStore.deleteItemAsync('myapp_session');
      await SecureStore.deleteItemAsync('myapp_user');
      await SecureStore.deleteItemAsync('myapp_refresh_token');
      await SecureStore.deleteItemAsync('myapp_access_token');
      await SecureStore.deleteItemAsync('myapp_token');
      await SecureStore.deleteItemAsync('myapp_auth');
    } catch (error) {
      console.error('Error clearing session data:', error);
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const response = await authClient.signIn.email({ email, password });
      console.log('Sign in response:', response);
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      if (!response.data) {
        throw new Error('No data received from sign in');
      }

      // Verify the session was created
      const session = await authClient.getSession();
      console.log('Session after sign in:', session);
      
      if (!session.data) {
        throw new Error('Failed to create session');
      }

      setIsAuthenticated(true);
    } catch (error) {
      console.error('Sign in error:', error);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const signUp = async (data: { email: string; phone: string; password: string; name: string; role: string }) => {
    try {
      const response = await authClient.signUp.email(data);
      console.log('Sign up response:', response);
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      if (!response.data) {
        throw new Error('No data received from sign up');
      }

      // After successful signup, sign in the user
      await signIn(data.email, data.password);
      
      // Don't navigate automatically - let the signup component handle navigation
      // The navigation will be handled in the signup component
    } catch (error) {
      console.error('Sign up error:', error);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const deleteAccount = async (password?: string) => {
    try {
      // First verify we have an active session
      const session = await authClient.getSession();
      console.log('Current session:', session);

      if (!session.data) {
        throw new Error('No active session found');
      }

      // Ensure we're properly authenticated
      if (!isAuthenticated) {
        throw new Error('Not authenticated');
      }

      // Make a direct API call to delete the user
      const response = await fetch('https://api.dev.heyzack.ai/api/v1/auth/user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session.token}`
        },
        body: JSON.stringify({ password })
      });

      console.log('Delete account response:', response);

      if (!response.ok) {
        const error = await response.json();
        console.log('Delete account error:', error);
        throw new Error(error.message || 'Failed to delete account');
      }

      // Only clear session and redirect after successful deletion
      await clearSessionData();
      setIsAuthenticated(false);
      router.replace('/auth/signin');
    } catch (error) {
      console.error('Delete account error:', error);
      // Don't clear session on error
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await clearSessionData();
      setIsAuthenticated(false);
      router.replace('/auth/signin');
    } catch (error) {
      console.error('Sign out error:', error);
      setIsAuthenticated(false);
      router.replace('/auth/signin');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ signIn, signUp, signOut, deleteAccount, isLoading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
