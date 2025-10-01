import { authClient } from "@/lib/auth-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import * as SecureStore from 'expo-secure-store';
import { Handyman } from "@/types/handyman";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;


export function useGetUser(options = {}) {
  return useQuery<Handyman>({
    queryKey: ["user"],

    queryFn: async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) {
          throw new Error("Authentication token not found");
        }

        const user = await authClient.getSession();
        if (!user.data?.user) {
          throw new Error("User not found");
        }



        const response = await axios.get<{data: Handyman}>(`${BASE_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('user', response.data);
        
        // Validate that we have user data
        if (!response.data) {
          throw new Error("No user data received from server");
        }
        
        return response.data as unknown as Handyman;
      } catch (error) {
        console.error("Failed to fetch user:", error);
        throw error instanceof Error 
          ? error 
          : new Error("Failed to fetch user data");
      }
    },
   
    staleTime: 5 * 60 * 1000,

    ...options
  });
};


export const useGetUserMinimal = () => {
  return useGetUser({
    // Don't show loading state if we have cached data
    notifyOnChangeProps: ['data', 'error'],
  });
};


export const useGetUserRealtime = () => {
  return useGetUser({
    // Use a shorter stale time for real-time data
    staleTime: 0,
    // Always refetch on mount
    refetchOnMount: true,
    // Refetch on window focus
    refetchOnWindowFocus: true,
    // Refetch on reconnect
    refetchOnReconnect: true,
  });
};


export const useUpdateUser = () => {
  return useMutation({
    mutationKey: ["update-user"],
    mutationFn: async (user: Handyman) => {
      const token = await SecureStore.getItemAsync('auth_token');
      const response = await axios.put(`${BASE_URL}/profile`, user, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    },
  });
};
