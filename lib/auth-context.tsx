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
  isInitialSetup: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialSetup, setIsInitialSetup] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const inAuthGroup = segments[0]?.startsWith('auth');
    const isSkillsPage = segments[1] === 'add-skills';
    
    if (!isLoading) {
      if (isAuthenticated && inAuthGroup && !isSkillsPage && !isInitialSetup) {
        router.replace('/(tabs)');
      } else if (!isAuthenticated && !inAuthGroup) {
        router.replace('/auth/signin');
      }
    }
  }, [isAuthenticated, segments, isLoading, isInitialSetup]);

  async function checkAuth() {
    try {
      // Then verify with Better Auth
      const session = await authClient.getSession();
      
      // Check if we have a valid session
      if (session.data) {
        setIsAuthenticated(true);
        return;
      }

      // If no valid session, check stored data
      const sessionData = await SecureStore.getItemAsync('myapp_session');
      const userData = await SecureStore.getItemAsync('myapp_user');
      
     
      
      if (sessionData && userData) {
   
        // Try to restore the session
        const restoredSession = await authClient.getSession();
        
        if (restoredSession.data) {
          setIsAuthenticated(true);
          return;
        }
      }

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

      await SecureStore.setItemAsync('auth_token', response.data?.token || '');
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      if (!response.data) {
        throw new Error('No data received from sign in');
      }

      // Verify the session was created
      const session = await authClient.getSession();
      
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
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      if (!response.data) {
        throw new Error('No data received from sign up');
      }

      // After successful signup, sign in the user
      // await signIn(data.email, data.password);
      setIsInitialSetup(true);
      
    } catch (error) {
      console.error('Sign up error:', error);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const deleteAccount = async (password?: string) => {
   try {
    await authClient.deleteUser();
    await clearSessionData();
    setIsAuthenticated(false);
    router.replace('/auth/signin');
   } catch (error) {
    console.error('Delete account error:', error);
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
    <AuthContext.Provider value={{ signIn, signUp, signOut, deleteAccount, isLoading, isAuthenticated, isInitialSetup }}>
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
