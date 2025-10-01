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

export function useAddSkills(skills: string[]) {
  return useMutation({
    mutationKey: ["add-skills"],
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
        
        const skillsData = {
          skills: skills.map((skill) => ({
            name: skill
          }))
        };

        

        const response = await axios.put(`${BASE_URL}/profile/skills`, skillsData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        return response.data;
      } catch (error: any) {
        console.error("Failed to add skills:", error?.response?.data);
        throw error instanceof Error ? error : new Error("Failed to add skills");
      }
    },
  });
};

export const useGetSkills = () => {
  return useQuery({
    queryKey: ["get-skills"],
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

        const response = await axios.get(`${BASE_URL}/profile/skills`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log(response.data);

        return response.data;
      } catch (error: any) {
        console.error("Failed to fetch skills:", error?.response?.data);
        throw error instanceof Error ? error : new Error("Failed to fetch skills");
      }
    },
  });
};

