import axios from "axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as SecureStore from 'expo-secure-store';
import { authClient } from "@/lib/auth-client";
import { Job } from "@/types/job";

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


export function useUpdateCompletionPhoto() {
    return useMutation({
        mutationKey: ["update-completion-photo"],
        mutationFn: async ({ fileUri, jobId }: { fileUri: string, jobId: string }) => {
          try {
            const token = await SecureStore.getItemAsync('auth_token');
            if (!token) throw new Error("Authentication token not found");
    
            // Upload completion photo
            const formData = new FormData();
            const fileName = fileUri.split("/").pop() || `completion_${Date.now()}.jpg`;
            const fileType = fileUri.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
            
            // For React Native, we need to append the file with proper format
            formData.append("files", {
              uri: fileUri,
              name: fileName,
              type: fileType
            } as any);
            formData.append("is_private", "1");
            
            console.log("Uploading file:", fileName, "Type:", fileType, "JobId:", jobId);
    
            const response = await axios.post(
              `${BASE_URL}/jobs/${jobId}/completion-photos`,
              formData,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "multipart/form-data"
                },
                timeout: 30000,
              }
            );
            
            console.log("Upload response:", JSON.stringify(response.data, null, 2));
            console.log("Response status:", response.status);
            console.log("Response headers:", response.headers);
    
            // Check if response is successful
            if (response.status !== 200 && response.status !== 201) {
              throw new Error(`Upload failed with status: ${response.status}`);
            }
            
            // Handle different response structures
            if (response.data?.data) {
              return response.data.data;
            } else if (response.data) {
              return response.data;
            } else {
              console.warn("Unexpected response structure, but upload appears successful");
              return { success: true, message: "Upload completed" };
            }
            
          } catch (error: any) {
            console.error("Completion photo upload error:", error?.response?.data || error.message);
            if (axios.isAxiosError(error)) {
              if (error.code === "ECONNABORTED") {
                throw new Error("Upload timed out. Please try again with a smaller file.");
              }
              if (error.response) {
                throw new Error(`Server error: ${error.response.status} - ${error.response.data?.message || "Unknown error"}`);
              }
              if (error.request) {
                throw new Error("No response from server. Please check your internet connection.");
              }
            }
            throw error;
          }
        },
      });
}