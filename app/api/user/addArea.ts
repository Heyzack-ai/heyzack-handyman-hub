import axios from "axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as SecureStore from 'expo-secure-store';
import { authClient } from "@/lib/auth-client";

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

export function useAddArea({ current_location, service_area }: { current_location: string, service_area: number }) {
  return useMutation({
    mutationKey: ["add-area"],
    mutationFn: async () => {
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
        
        const areaData = {
         service_area: service_area,
         current_location: current_location
        };
        
        console.log("Add area data:", areaData);

        const response = await axios.put(`${BASE_URL}/profile/area`, areaData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });


        return response.data;
      } catch (error) {
        console.error("Failed to add area:", error);
        throw error instanceof Error ? error : new Error("Failed to add area");
      }
    },
  });
};

export const useGetArea = () => {
  return useQuery({
    queryKey: ["get-area"],
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

        const response = await axios.get(`${BASE_URL}/profile/service-area`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log("Get area data:", response.data);
        
        return response.data;
      } catch (error) {
        console.error("Failed to fetch area:", error);
        throw error;
      }
    },
  });
};

