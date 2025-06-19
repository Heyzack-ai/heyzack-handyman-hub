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

export function useGetJobs() {
    return useQuery({
        queryKey: ["get-jobs"],
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
                searchParams.append('filter', `[["handyman", "=", "${extendedUser.erpId}"]]`);
                searchParams.append('fields', JSON.stringify(['title', 'description', 'rating', 'customer', 'scheduled_date', 'handyman', 'status', 'completion_photos', 'customer_signature', 'notes', 'installation_fare', 'name', 'duration', 'products', 'partner', 'contractsent']));

                const response = await axios.get(`${BASE_URL}/resource/Installation?${searchParams.toString()}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                console.log("Jobs", response.data.data);

                

                return response.data;
            } catch (error) {
                console.error("Failed to get jobs:", error);
                throw error instanceof Error ? error : new Error("Failed to get jobs");
            }
        },
    });
};

export function useGetJobById(id: string) {
    return useQuery({
        queryKey: ["get-jobs", id],
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
                searchParams.append('filter', `[["name", "=", "${id}"]]`);
                searchParams.append('fields', JSON.stringify(['title', 'description', 'rating', 'customer', 'scheduled_date', 'handyman', 'status', 'completion_photos', 'customer_signature', 'notes', 'installation_fare', 'name', 'duration', 'products', 'partner', 'contractsent']));

                const response = await axios.get(`${BASE_URL}/resource/Installation/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                console.log("Jobs completion photo", response.data.data);

                

                return response.data;
            } catch (error) {
                console.error("Failed to get jobs:", error);
                throw error instanceof Error ? error : new Error("Failed to get jobs");
            }
        },
    });
};