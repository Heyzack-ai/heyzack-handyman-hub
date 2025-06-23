import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import * as SecureStore from "expo-secure-store";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export function useAcceptJob() {
  return useMutation({
    mutationFn: async ({
      jobId,
      status,
    }: {
      jobId: string;
      status: "accepted" | "rejected";
    }) => {
      try {
        const token = await SecureStore.getItemAsync("auth_token");
        if (!token) {
          throw new Error("Authentication token not found");
        }

        const response = await axios.post(
          `${BASE_URL}/handyman/jobs/${jobId}/response`,
          {
            response: status,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        return response.data;
      } catch (error) {
        console.error("Failed to accept/decline job:", error);
        throw error instanceof Error ? error : new Error("Failed to update job status");
      }
    },
  });
}