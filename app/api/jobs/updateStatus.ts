import { useMutation, useQuery } from "@tanstack/react-query";
import * as SecureStore from 'expo-secure-store';
import axios from "axios";
import { Job } from "@/types/job";
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

export function useUpdateJobStatus() {
    return useMutation<Job, Error, { jobId: string, status: string }>({
      mutationFn: async ({ jobId, status }) => {
       
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
          
          const searchParams = new URLSearchParams();
          searchParams.append('filter', `[["handyman", "=", "${extendedUser.erpId}"]]`);
          
          const response = await axios.put<{ data: Job }>(`${BASE_URL}/erp/resource/Installation/${jobId}`, 
            {
                status: status,
            }, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
  
          console.log(response.data);
  
          if (!response.data?.data) {
            throw new Error("Job not found");
          }
  
          return response.data.data;
        } catch (error) {
          console.error("Failed to update job status:", error);
          throw error instanceof Error
            ? error
            : new Error("Failed to update job status");
        }
      },
    });
  }