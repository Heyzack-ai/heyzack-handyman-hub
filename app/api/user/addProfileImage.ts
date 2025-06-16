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


export function useUploadProfileImage() {
  return useMutation({
    mutationKey: ["upload-profile-image"],
    mutationFn: async ({ fileUri }: { fileUri: string }) => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) throw new Error("Authentication token not found");
        
        const user = await authClient.getSession();
        if (!user.data?.user) throw new Error("User not found");
        
        const extendedUser = user.data.user as ExtendedUser;

        // 1. Upload file to ERPNext
        const formData = new FormData();
        const fileName = fileUri.split("/").pop() || `profile_${Date.now()}.jpg`;
        const fileType = fileUri.toLowerCase().endsWith(".png") 
          ? "image/png"
          : "image/jpeg";
        
        // @ts-ignore
        formData.append("file", {
          uri: fileUri,
          name: fileName,
          type: fileType
        });
        // Set is_private to 0 for profile images to ensure they're publicly accessible
        formData.append("is_private", "0");

        const uploadRes = await axios.post(
          `${BASE_URL}/upload`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data"
            },
            timeout: 30000, // 30 second timeout
          }
        );

        if (!uploadRes.data?.data?.message?.file_url) {
          throw new Error("Invalid file upload response");
        }

        const fileUrl = uploadRes.data.data.message.file_url;

        // 2. Update Handyman record with file URL
        const response = await axios.put(
          `${BASE_URL}/resource/Handyman/${extendedUser.erpId}`,
          { profile_image: fileUrl },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            timeout: 10000, // 10 second timeout
          }
        );
        
        return response.data;
      } catch (error) {
        console.error("Profile image upload error:", error);
        if (axios.isAxiosError(error)) {
          if (error.code === "ECONNABORTED") {
            throw new Error("Upload timed out. Please try again with a smaller file.");
          }         
          if (error.response) {
            if (error.response.status === 403) {
              throw new Error("Permission denied. You don't have access to update your profile image.");
            }
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
};

