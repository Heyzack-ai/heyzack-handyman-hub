import { useMutation } from "@tanstack/react-query";
import * as SecureStore from 'expo-secure-store';
import axios from "axios";
import { Job } from "@/types/job";
import { authClient } from "@/lib/auth-client";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;


export function useSendContract() {
    return useMutation<Job, Error, { jobId: string }>({
      mutationFn: async ({ jobId }) => {
       
        try {
          const token = await SecureStore.getItemAsync('auth_token');
          if (!token) {
            throw new Error("Authentication token not found");
          }
  
          const user = await authClient.getSession();
          if (!user.data?.user) {
            throw new Error("User not found");
          }

          console.log("Sending contract for job:", jobId);
          console.log("Token:", token);
          

          const response = await axios.post<Job>(
            `${BASE_URL}/jobs/${jobId}/contract`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          console.log("Response:", response);

          if (!response.data) {
            throw new Error("Job not found");
          }

          return response.data;
        } catch (error: any) {
          console.error("Failed to send contract for job:", error?.response?.data || error.message);
          throw error instanceof Error
            ? error
            : new Error("Failed to send contract for job");
        }
      },
    });
  }