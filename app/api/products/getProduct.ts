import { Product } from "@/types/job";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export function useGetProduct(productId: string) {
    return useQuery<Product>({
      queryKey: ["product", productId],
      queryFn: async () => {
        try {
          const token = await SecureStore.getItemAsync('auth_token');
          if (!token) {
            throw new Error("Authentication token not found");
          }
          const searchParams = new URLSearchParams();
        //   searchParams.append('filter', `[["name", "=", "${productId}"]]`);
          searchParams.append('fields', JSON.stringify(['item_name']));
          const response = await axios.get<{ data: Product }>(`${BASE_URL}/erp/resource/Heyzack Item/${productId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
  
          console.log("Product", response.data);
  
          if (!response.data) {
            throw new Error("Product not found");
          }
  
          return response.data.data;
        } catch (error) {
          console.error("Failed to fetch product:", error);
          throw error instanceof Error
            ? error
            : new Error("Failed to fetch product data");
        }
      },
      enabled: !!productId,
      staleTime: 5 * 60 * 1000,
    });
  }