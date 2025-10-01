import { authClient } from "@/lib/auth-client";
import { Product, Stock } from "@/types/job";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export function useGetStock(productId: string) {
    return useQuery<Stock>({
        queryKey: ["stock", productId],
        queryFn: async () => {
            try {
                const token = await SecureStore.getItemAsync('auth_token');
                if (!token) {
                    throw new Error("Authentication token not found");
                }
               
                
                console.log(`Fetching stock for productId: ${productId}`);
                console.log(`API URL: ${BASE_URL}/products/${productId}/stock`);
                
                const response = await axios.get<{ data: Stock[] }>(`${BASE_URL}/products/${productId}/stock`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                console.log(`Stock response for ${productId}:`, response.data);

                if (!response.data?.data || response.data.data.length === 0) {
                    console.log(`No stock found for ${productId}, returning default`);
                    // Return default stock data if no stock record found
                    return {
                        item: productId,
                        quantity: 0
                    };
                }

                // Find the stock record that matches the requested productId
                const stockData = response.data.data.find((stock: Stock) => stock.item === productId);
                
                if (!stockData) {
                    console.log(`No matching stock found for ${productId}, returning default`);
                    return {
                        item: productId,
                        quantity: 0
                    };
                }

                console.log(`Stock data for ${productId}:`, stockData);
                return stockData;
            } catch (error: any) {
                console.error(`Failed to fetch stock for ${productId}:`, error?.response?.data || error);
                // Return default stock data on error
                return {
                    item: productId,
                    quantity: 0
                };
            }
        },
        enabled: !!productId,
        staleTime: 5 * 60 * 1000,
    });
}