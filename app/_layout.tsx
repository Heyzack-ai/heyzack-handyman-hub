// import FontAwesome from "@expo/vector-icons/FontAwesome";
// import { useFonts } from "expo-font";
// import { Stack } from "expo-router";
// import * as SplashScreen from "expo-splash-screen";
// import { useEffect, useState } from "react";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// // import { DevToolsProvider } from "../dev-tools";
// import { AuthProvider, useAuth } from "@/lib/auth-context";
// import '@/src/i18n'
// import { LanguageProvider } from "@/src/i18n/LanguageContext";
// import { View, ActivityIndicator } from "react-native";
// import Splash from "@/components/Splash";

// export const unstable_settings = {
//   // Ensure that reloading on `/modal` keeps a back button present.
//   initialRouteName: "(tabs)",
// };

// // Prevent the splash screen from auto-hiding before asset loading is complete.
// SplashScreen.preventAutoHideAsync();

// export default function RootLayout() {
//   const [loaded, error] = useFonts({
//     ...FontAwesome.font,
//   });

//   const queryClient = new QueryClient({
//     defaultOptions: {
//       queries: {
//         staleTime: 0,
//         gcTime: 5 * 60 * 1000,
//         retry: 2,
//         refetchOnWindowFocus: true,
//         refetchOnMount: true,
//         refetchOnReconnect: true,
//         refetchInterval: false,
//         refetchIntervalInBackground: true,
//       },
//     },
//   });

//   useEffect(() => {
//     if (error) {
//       // console.error(error);
//       throw error;
//     }
//   }, [error]);

//   useEffect(() => {
//     if (loaded) {
//       SplashScreen.hideAsync();
//     }
//   }, [loaded]);

//   if (!loaded) {
//     return null;
//   }

//   return (
//     <AuthProvider>
//       {/* <DevToolsProvider> */}
//         <RootLayoutNav queryClient={queryClient} />
//       {/* </DevToolsProvider> */}
//     </AuthProvider>
//   );
// }




// function RootLayoutNav({ queryClient }: { queryClient: QueryClient }) {
//   const { isLoading } = useAuth();

//   // Show loading screen while auth is being checked
//   if (isLoading) {
//     return (
//       <Splash />
//     );
//   }

//   return (
//     <QueryClientProvider client={queryClient}>
//       <LanguageProvider>
//         <Stack
//           screenOptions={{
//             headerShown: false,
//           }}
//         >
//           <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//           <Stack.Screen name="notifications" options={{ headerShown: false }} />
//           <Stack.Screen name="modal" options={{ presentation: "modal" }} />
//           <Stack.Screen name="auth" options={{ headerShown: false }} />
//         </Stack>
//       </LanguageProvider>
//     </QueryClientProvider>
//   );
// }

import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider, focusManager, onlineManager } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import '@/src/i18n'
import { LanguageProvider } from "@/src/i18n/LanguageContext";
import { AppState, Platform } from "react-native";
import * as Network from 'expo-network';
import type { AppStateStatus } from 'react-native';
import Splash from "@/components/Splash";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

// Configure online manager for Expo
onlineManager.setEventListener((setOnline) => {
  // Check initial network state
  Network.getNetworkStateAsync().then((state) => {
    setOnline(state.isConnected ?? true);
  });

  // Set up interval to check network status
  const interval = setInterval(async () => {
    const state = await Network.getNetworkStateAsync();
    setOnline(state.isConnected ?? true);
  }, 5000); // Check every 5 seconds

  return () => {
    clearInterval(interval);
  };
});

// Configure focus manager for React Native
function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

// Create QueryClient outside component (singleton)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 5 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
  },
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  useEffect(() => {
    // Set up app state listener
    const subscription = AppState.addEventListener('change', onAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (error) {
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
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <Splash />;
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