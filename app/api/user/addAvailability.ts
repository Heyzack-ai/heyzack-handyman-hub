import axios from "axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as SecureStore from 'expo-secure-store';
import { authClient } from "@/lib/auth-client";
import { WeekSchedule } from "@/types/availability";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

type ExtendedUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
  erpId?: string;
};

export function useAddAvailability() {
  return useMutation({
    mutationKey: ["add-availability"],
    mutationFn: async (availabilityData: WeekSchedule) => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) {
          throw new Error("Authentication token not found");
        }

        const user = await authClient.getSession();
        if (!user.data?.user) {
          throw new Error("User not found");
        }
        
        const extendedUser = user.data.user as ExtendedUser;
        
        // Convert the schedule object to an array format
        const availabilityArray = Object.entries(availabilityData).map(([day, data]: [string, any]) => ({
          day: day,
          start_time: data.startTime,
          end_time: data.endTime,
          is_active: data.enabled
        }));

        const response = await axios.put(`${BASE_URL}/erp/resource/Handyman/${extendedUser.erpId}`, {
          availability: availabilityArray
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        return response.data;
      } catch (error) {
        console.error("Failed to add availability:", error);
        throw error instanceof Error ? error : new Error("Failed to add availability");
      }
    },
  });
};

export const useGetAvailability = () => {
  return useQuery({
    queryKey: ["get-availability"],
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

        const extendedUser = user.data.user as ExtendedUser;

        const response = await axios.get(`${BASE_URL}/resource/Handyman/${extendedUser.erpId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        

        return response.data;
      } catch (error) {
        console.error("Failed to fetch availability:", error);
        throw error;
      }
    },
  });
};

