import axios from "axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as SecureStore from 'expo-secure-store';
import { authClient } from "@/lib/auth-client";
import * as ImageManipulator from 'expo-image-manipulator';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;




export function useUploadProfileImage() {
  return useMutation({
    mutationKey: ["upload-profile-image"],
    mutationFn: async ({ fileUri }: { fileUri: string }) => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) throw new Error("Authentication token not found");
        
        const user = await authClient.getSession();
        if (!user.data?.user) throw new Error("User not found");
        
        // Check original file size before compression (backup validation)
        try {
          const fileInfo = await fetch(fileUri);
          const blob = await fileInfo.blob();
          const fileSizeInMB = blob.size / (1024 * 1024);
          
          if (fileSizeInMB > 5) { // 5MB absolute limit before compression
            throw new Error("File is too large (over 5MB). Please select a smaller image.");
          }
          
          console.log(`Original file size: ${fileSizeInMB.toFixed(2)}MB`);
        } catch (sizeError) {
          console.warn("Could not check file size:", sizeError);
          // Continue with compression anyway
        }
        
        // Compress the image before upload to reduce file size and prevent timeouts
        console.log("Compressing image:", fileUri);
        const compressedImage = await ImageManipulator.manipulateAsync(
          fileUri,
          [
            // Resize to max 600x600 for profile images (smaller for faster upload)
            { resize: { width: 600, height: 600 } }
          ],
          {
            compress: 0.6, // 60% quality for better compression
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );
        
        console.log("Original URI:", fileUri);
        console.log("Compressed URI:", compressedImage.uri);
        console.log("Compressed dimensions:", compressedImage.width, "x", compressedImage.height);
        
        // Log file size reduction
        try {
          const compressedFileInfo = await fetch(compressedImage.uri);
          const compressedBlob = await compressedFileInfo.blob();
          const compressedSizeInMB = compressedBlob.size / (1024 * 1024);
          console.log(`Compressed file size: ${compressedSizeInMB.toFixed(2)}MB`);
        } catch (error) {
          console.warn("Could not check compressed file size:", error);
        }

        // Upload profile image using the /profile-image endpoint
        const formData = new FormData();
        const fileName = compressedImage.uri.split("/").pop() || `profile_${Date.now()}.jpg`;
        const fileType = "image/jpeg"; // Always JPEG after compression
        
        // @ts-ignore
        formData.append("file", {
          uri: compressedImage.uri,
          name: fileName,
          type: fileType
        });

        const response = await axios.post(
          `${BASE_URL}/profile-image`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data"
            },
            timeout: 45000, // 45 second timeout (less than server's 60s)
          }
        );

        console.log("Profile image upload response:", response);
        console.log("Profile image upload response.data:", response.data);

        // Validate response structure
        if (!response || !response.data) {
          throw new Error("Invalid response from server");
        }

        if (!response.data.image_url) {
          throw new Error("Image URL not found in response");
        }

        // Return the response as-is since it already has the correct format
        // { "message": "Profile image uploaded successfully", "image_url": "..." }
        return {
          data: response.data
        };
      } catch (error: any) {
        console.error("Profile image upload error:", error);
        if (axios.isAxiosError(error)) {
          if (error.code === "ECONNABORTED") {
            throw new Error("Upload timed out. Please try again with a smaller file.");
          }
          if (error.code === "ECONNRESET") {
            throw new Error("Connection was reset. The file might be too large or the server is busy. Please try again.");
          }
          if (error.response) {
            console.error("Error response:", error.response.data);
            if (error.response.status === 403) {
              throw new Error("Permission denied. You don't have access to update your profile image.");
            }
            if (error.response.status === 500) {
              throw new Error("Server error. Please try again later or contact support.");
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

