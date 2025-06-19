import axios from "axios";
import { useQuery } from "@tanstack/react-query";
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

export function useGetCompletionPhoto(name: string) {
    return useQuery({
        queryKey: ["get-completion-photo", name],
        queryFn: async () => {
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

                // Convert the schedule object to an array format
                const searchParams = new URLSearchParams();
                searchParams.append('filters', `[["installation", "=", "${name}"]]`);
                searchParams.append('fields', JSON.stringify(['installation', 'image']));

                const response = await axios.get(`${BASE_URL}/resource/Completion Images?${searchParams.toString()}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                console.log("Completion photo data:", response.data);

                return response.data;
            } catch (error: any) {
                console.error("Failed to get completion photo:", error);
                
                // Handle permission errors specifically
                if (error?.response?.status === 403) {
                    console.warn("Permission denied for Completion Images. User may not have access to this resource.");
                    return { data: [] }; // Return empty data instead of throwing
                }
                
                throw error instanceof Error ? error : new Error("Failed to get completion photo");
            }
        },
        enabled: !!name, // Only run when name is provided
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1, // Only retry once
    });
};
