import axios from "axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as SecureStore from 'expo-secure-store';
import { authClient } from "@/lib/auth-client";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL_LINK;

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

export function useLinkPartner(partner_code: string) {
    return useMutation({
        mutationKey: ["link-partner"],
        mutationFn: async () => {
            try {
                const token = await SecureStore.getItemAsync('auth_token');
                if (!token) {
                    throw new Error("Authentication token not found");
                }

                const response = await axios.post(`${BASE_URL}/link-handyman-to-partner`, {
                    partner_code,
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                return response.data;
            } catch (error) {
                console.error("Failed to add area:", error);
                throw error instanceof Error ? error : new Error("Failed to add area");
            }
        },
    });
};