import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { DevToolsProvider } from "../dev-tools";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import '@/src/i18n'
import { LanguageProvider } from "@/src/i18n/LanguageContext";
import { View, ActivityIndicator } from "react-native";
import Splash from "@/components/Splash";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // staleTime: 5 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchInterval: false,
        refetchIntervalInBackground: false,
      },
    },
  });

  useEffect(() => {
    if (error) {
      // console.error(error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      {/* <DevToolsProvider> */}
        <RootLayoutNav queryClient={queryClient} />
      {/* </DevToolsProvider> */}
    </AuthProvider>
  );
}




function RootLayoutNav({ queryClient }: { queryClient: QueryClient }) {
  const { isLoading } = useAuth();

  // Show loading screen while auth is being checked
  if (isLoading) {
    return (
      <Splash />
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
        </Stack>
      </LanguageProvider>
    </QueryClientProvider>
  );
}