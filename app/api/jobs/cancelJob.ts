import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import * as SecureStore from "expo-secure-store";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export function useCancelJob() {
  return useMutation({
    mutationFn: async ({
      jobId,
      reason,
    }: {
      jobId: string;
      reason: string;
    }) => {
      try {
        const token = await SecureStore.getItemAsync("auth_token");
        if (!token) {
          throw new Error("Authentication token not found");
        }

        const response = await axios.post(
          `${BASE_URL}/jobs/${jobId}/cancel`,
          {
            reason,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("cancelJob", response.data);

        return response.data;
      } catch (error: any) {
        console.error("Failed to cancel job:", error);
        throw error instanceof Error ? error : new Error("Failed to cancel job");
      }
    },
  });
}
