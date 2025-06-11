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

export const useUploadKycDocument = () => {
  return useMutation({
    mutationKey: ["upload-kyc-document"],
    mutationFn: async ({ fileUri }: { fileUri: string }) => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) throw new Error("Authentication token not found");
        
        const user = await authClient.getSession();
        if (!user.data?.user) throw new Error("User not found");
        
        const extendedUser = user.data.user as ExtendedUser;

        // 1. Upload file to ERPNext
        const formData = new FormData();
        const fileName = fileUri.split("/").pop() || `kyc_${Date.now()}.jpg`;
        const fileType = fileUri.toLowerCase().endsWith(".pdf") 
          ? "application/pdf" 
          : fileUri.toLowerCase().endsWith(".png")
            ? "image/png"
            : "image/jpeg";
        
        // @ts-ignore
        formData.append("file", {
          uri: fileUri,
          name: fileName,
          type: fileType
        });
        formData.append("is_private", "1");

        console.log("Starting file upload...");
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

        console.log("uploadRes", uploadRes.data);

        if (!uploadRes.data?.data?.message?.file_url) {
          throw new Error("Invalid file upload response");
        }

        console.log("File uploaded successfully");
        const fileUrl = uploadRes.data.data.message.file_url;

        // 2. Update Handyman record with file URL
        console.log("Updating handyman record...");
        const response = await axios.put(
          `${BASE_URL}/resource/Handyman/${extendedUser.erpId}`,
          { kyc_document: fileUrl },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            timeout: 10000, // 10 second timeout
          }
        );
        
        console.log("Handyman record updated successfully");
        return response.data;
      } catch (error) {
        console.error("KYC document upload error:", error);
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
};

