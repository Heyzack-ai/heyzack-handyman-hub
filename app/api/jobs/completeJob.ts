import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export function useCompleteJob() {
  return useMutation({
    mutationFn: async ({
      jobId,
      customer_tuya_email,
    }: {
      jobId: string;
      customer_tuya_email: string;
    }) => {
      try {
        const token = await SecureStore.getItemAsync("auth_token");
        if (!token) {
          throw new Error("Authentication token not found");
        }

        const response = await axios.post(
          `${BASE_URL}/jobs/${jobId}/complete`,
          {
            customer_tuya_email,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("completeJob", response.data);

        return response.data;
      } catch (error: any) {
        console.error("Failed to complete job:", error.response?.data || error.message);
        throw error instanceof Error ? error : new Error("Failed to complete job");
      }
    },
  });
}