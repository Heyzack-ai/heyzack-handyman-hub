import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import * as SecureStore from 'expo-secure-store';
import { authClient } from "@/lib/auth-client";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const PENDING_URL = process.env.EXPO_PUBLIC_PENDING_URL;

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
                console.log("Token:", token);

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

                const response = await axios.get(`${BASE_URL}/jobs`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });


                

                return response.data;
            } catch (error) {
                
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
                // Don't make the API call if id is undefined or empty
                if (!id) {
                    throw new Error("Job ID is required");
                }

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

                const response = await axios.get(`${BASE_URL}/jobs/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });


                

                return response.data;
            } catch (error) {
                console.error("Failed to get jobs by id:", error);
                throw error instanceof Error ? error : new Error("Failed to get jobs");
            }
        },
        enabled: !!id, // Only run the query when id is truthy
    });
};

export function useGetPendingJobs() {
    return useQuery({
        queryKey: ["get-pending-jobs"],
        queryFn: async () => {
            try {
                // Don't make the API call if id is undefined or empty


                const token = await SecureStore.getItemAsync('auth_token');
                console.log("Token:", token);
                if (!token) {
                    throw new Error("Authentication token not found");
                }



              
                const response = await axios.get(PENDING_URL || `${BASE_URL}/jobs`, {
                    timeout: 20000,
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                console.log("getPendingJobs response:", response.data);

                return response.data;
            } catch (error) {
                console.error("Failed to get pending jobs:", error);
                throw error instanceof Error ? error : new Error("Failed to get pending jobs");
            }
        },
        enabled: true, // Only run the query when id is truthy
    });
};