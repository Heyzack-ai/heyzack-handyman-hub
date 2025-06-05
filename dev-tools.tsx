import { useSyncQueriesExternal } from "react-query-external-sync";
import { QueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import React from "react";

// Create your query client
const queryClient = new QueryClient();

export function DevToolsProvider({ children }: { children: React.ReactNode }) {
  useSyncQueriesExternal({
    queryClient,
    socketURL: "http://localhost:42831",
    deviceName: "HeyZack App",
    platform: Platform.OS,
    deviceId: Platform.OS,
    extraDeviceInfo: {
      appVersion: "1.0.0",
    },
    enableLogs: true,
    envVariables: {
      NODE_ENV: process.env.NODE_ENV,
    },
    // Storage monitoring
    asyncStorage: AsyncStorage,
    secureStorage: SecureStore,
    secureStorageKeys: ["userToken", "refreshToken"],
  });

  return <>{children}</>;
}
