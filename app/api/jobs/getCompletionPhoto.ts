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
        mutationKey: ["upload-kyc-document"],
        mutationFn: async ({ fileUri, jobId, completion_photos }: { fileUri: string, jobId: string, completion_photos: any[] }) => {
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

            console.log("Form Data:", formData);
    
    
            const uploadRes = await axios.post(
              `${BASE_URL}/erp/upload`,
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

            console.log("File URL:", fileUrl);
    
            // 2. Create new completion photo object
            const newCompletionPhoto = {
              installation: jobId,
              image: fileUrl,
            };
            
            // 3. Add new photo to existing photos
            const updatedCompletionPhotos = [
              ...completion_photos,
              newCompletionPhoto
            ];
            
            // 4. Update the Installation resource with the new completion_photos array
            const response = await axios.put<{ data: Job }>(`${BASE_URL}/erp/resource/Installation/${jobId}`, 
              {
                  completion_photos: updatedCompletionPhotos
              }, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
    
            console.log("Installation update response:", response.data);
    
            if (!response.data?.data) {
              throw new Error("Job not found");
            }
    
            return response.data.data;
            
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
}