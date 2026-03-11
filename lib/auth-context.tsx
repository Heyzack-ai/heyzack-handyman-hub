import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { authClient } from './auth-client';
import * as SecureStore from 'expo-secure-store';

type AuthContextType = {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: { email: string; phone: string; password: string; name: string; role: string }) => Promise<void>;
  deleteAccount: (password?: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchAppMode: (mode: 'partner' | 'handyman') => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialSetup: boolean;
  role: string | null;
  appMode: 'partner' | 'handyman' | null;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialSetup, setIsInitialSetup] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [appMode, setAppMode] = useState<'partner' | 'handyman' | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const inAuthGroup = segments[0]?.startsWith('auth');
    const isSkillsPage = segments[1] === 'add-skills';
    const inHandymanGroup = segments[0] === '(handyman)';
    const inPartnerGroup = segments[0] === '(partner)';
    const inChatRoute = segments[0] === 'chat';
    const inProfileRoute = segments[0] === 'profile';
    const inJobsRoute = segments[0] === 'jobs';
    const inProductsRoute = segments[0] === 'products';
    const inHandymenRoute = segments[0] === 'handymen';
    const inNotifications = segments[0] === 'notifications';
    const inModal = segments[0] === 'modal';
    const currentMode =
      appMode || (role === 'partner' ? 'partner' : 'handyman');

    // Only run navigation logic after auth check is complete
    if (!isLoading) {
      if (isAuthenticated && inAuthGroup && !isSkillsPage && !isInitialSetup) {
        // Redirect based on active app mode
        if (currentMode === 'partner') {
          router.replace('/(partner)');
        } else {
          router.replace('/(handyman)');
        }
      } else if (isAuthenticated && !inAuthGroup && !inNotifications && !inModal && !isInitialSetup) {
        const inAllowedPartnerRoute = inPartnerGroup || inChatRoute;
        const inAllowedHandymanRoute =
          inHandymanGroup ||
          inChatRoute ||
          inProfileRoute ||
          inJobsRoute ||
          inProductsRoute ||
          inHandymenRoute;

        if (currentMode === 'partner' && !inAllowedPartnerRoute) {
          router.replace('/(partner)');
        } else if (currentMode === 'handyman' && !inAllowedHandymanRoute) {
          router.replace('/(handyman)');
        }
      } else if (!isAuthenticated && !inAuthGroup && !inChatRoute && !inNotifications && !inModal) {
        router.replace('/auth/signin');
      }
    }
  }, [isAuthenticated, segments, isLoading, isInitialSetup, isMounted, role, appMode]);

  async function checkAuth() {
    try {
      // Then verify with Better Auth
      const session = await authClient.getSession();

      // Check if we have a valid session
      if (session.data) {
        setIsAuthenticated(true);
        // Load stored role
        const storedRole = await SecureStore.getItemAsync('user_role');
        setRole(storedRole as string | null);
        const storedMode = await SecureStore.getItemAsync('app_mode');
        if (storedMode === 'partner' || storedMode === 'handyman') {
          setAppMode(storedMode);
        } else {
          const defaultMode = storedRole === 'partner' ? 'partner' : 'handyman';
          setAppMode(defaultMode);
          await SecureStore.setItemAsync('app_mode', defaultMode);
        }
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
          // Load stored role
          const storedRole = await SecureStore.getItemAsync('user_role');
          setRole(storedRole as string | null);
          const storedMode = await SecureStore.getItemAsync('app_mode');
          if (storedMode === 'partner' || storedMode === 'handyman') {
            setAppMode(storedMode);
          } else {
            const defaultMode = storedRole === 'partner' ? 'partner' : 'handyman';
            setAppMode(defaultMode);
            await SecureStore.setItemAsync('app_mode', defaultMode);
          }
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
      await SecureStore.deleteItemAsync('user_role');
      await SecureStore.deleteItemAsync('app_mode');
    } catch (error) {
      console.error('Error clearing session data:', error);
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const response = await authClient.signIn.email({ email, password });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data) {
        throw new Error('No data received from sign in');
      }

      // Store token and role after successful login
      const token = (response.data as any)?.token || response.data?.session?.token;
      if (token) {
        await SecureStore.setItemAsync('auth_token', token);
      }

      // Store user role from response
      const userRole = (response.data as any)?.user?.role;
      if (userRole) {
        await SecureStore.setItemAsync('user_role', userRole);
        setRole(userRole);
        const defaultMode = userRole === 'partner' ? 'partner' : 'handyman';
        await SecureStore.setItemAsync('app_mode', defaultMode);
        setAppMode(defaultMode);
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
      setRole(null);
      setAppMode(null);
      router.replace('/auth/signin');
    } catch (error) {
      console.error('Sign out error:', error);
      setIsAuthenticated(false);
      setRole(null);
      setAppMode(null);
      router.replace('/auth/signin');
      throw error;
    }
  };

  const switchAppMode = async (mode: 'partner' | 'handyman') => {
    setAppMode(mode);
    await SecureStore.setItemAsync('app_mode', mode);
  };

  return (
    <AuthContext.Provider value={{ signIn, signUp, signOut, deleteAccount, switchAppMode, isLoading, isAuthenticated, isInitialSetup, role, appMode }}>
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
