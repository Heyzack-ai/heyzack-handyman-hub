import { authClient } from "@/lib/auth-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import * as SecureStore from 'expo-secure-store';
import { Handyman } from "@/types/handyman";
import { Customer } from "@/types/job";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

type Partner = {
  name: string;
  partner_name?: string;
  partner_code?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export function useGetCustomer(customerCode: string) {
  return useQuery<Customer>({
    queryKey: ["customer", customerCode],
    queryFn: async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) {
          throw new Error("Authentication token not found");
        }
        const searchParams = new URLSearchParams();
        searchParams.append('filter', `[["name", "=", "${customerCode}"]]`);
        searchParams.append('fields', JSON.stringify(['name', 'phone', 'email', 'address', 'customer_name']));
        console.log("Customer Code", customerCode);
        const response = await axios.get<{ data: Customer[] }>(`${BASE_URL}/resource/Heyzack Customer?${searchParams.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log(response.data);

        if (!response.data?.data?.[0]) {
          throw new Error("Customer not found");
        }

        return response.data.data[0];
      } catch (error) {
        console.error("Failed to fetch partner:", error);
        throw error instanceof Error
          ? error
          : new Error("Failed to fetch partner data");
      }
    },
    enabled: !!customerCode,
    staleTime: 5 * 60 * 1000,
  });
}

