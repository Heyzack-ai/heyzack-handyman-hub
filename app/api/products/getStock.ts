import { authClient } from "@/lib/auth-client";
import { Product, Stock } from "@/types/job";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export function useGetStock(productId: string) {
    const id = String(productId ?? "").trim();
    return useQuery<Stock>({
        queryKey: ["stock", id],
        queryFn: async () => {
            try {
                const token = await SecureStore.getItemAsync('auth_token');
                if (!token) {
                    throw new Error("Authentication token not found");
                }

                console.log(`Fetching stock for productId: ${id}`);
                console.log(`API URL: ${BASE_URL}/products/${id}/stock`);

                const response = await axios.get(`${BASE_URL}/products/${id}/stock`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                const raw = (response as any).data;
                console.log(`Stock response for ${id}:`, raw);

                // Normalize different server response shapes
                // Shape A: { data: Stock[] }
                if (raw && Array.isArray(raw.data)) {
                    const stockData = (raw.data as Stock[]).find((s) => s.item === id);
                    if (stockData) {
                        console.log(`Stock data (array) for ${id}:`, stockData);
                        return stockData;
                    }
                    console.log(`No matching stock in array for ${id}, returning default`);
                    return { item: id, quantity: 0 };
                }

                // Shape B: { data: Stock }
                if (raw && raw.data && typeof raw.data === 'object' && 'item' in raw.data) {
                    const stockData = raw.data as Stock;
                    console.log(`Stock data (object in data) for ${id}:`, stockData);
                    return stockData;
                }

                // Shape C: Stock
                if (raw && typeof raw === 'object' && 'item' in raw) {
                    const stockData = raw as Stock;
                    console.log(`Stock data (direct object) for ${id}:`, stockData);
                    return stockData;
                }

                console.log(`Unrecognized stock response shape for ${id}, returning default`);
                return { item: id, quantity: 0 };
            } catch (error: any) {
                console.error(`Failed to fetch stock for ${id}:`, error?.response?.data || error);
                // Return default stock data on error
                return {
                    item: id,
                    quantity: 0
                };
            }
        },
        enabled: id.length > 0,
        staleTime: 5 * 60 * 1000,
    });
}