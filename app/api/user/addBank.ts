import axios from "axios";
import { useMutation, useQuery } from "@tanstack/react-query";
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

export const useAddBank = (bankData: any) => {
  return useMutation({
    mutationKey: ["add-bank"],
    mutationFn: async () => {
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
        const bankArray = [{
          type: "Partner",
          bank_name: bankData.bank_name,
          account_holder_name: bankData.account_holder_name,
          iban_number: bankData.iban_number,
          bic_code: bankData.bic_code,
          is_default: bankData.is_default
        }];

        console.log("bankArray", bankArray);

        const response = await axios.put(`${BASE_URL}/resource/Handyman/${extendedUser.erpId}`, {
            bank_details: bankArray
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        return response.data;
      } catch (error) {
        console.error("Failed to add availability:", error);
        throw error instanceof Error ? error : new Error("Failed to add availability");
      }
    },
  });
};

export const useGetBank = () => {
  return useQuery({
    queryKey: ["get-bank"],
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

        const response = await axios.get(`${BASE_URL}/resource/Handyman/${extendedUser.erpId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log("API Response:", response.data);
        return response.data;
      } catch (error) {
        console.error("Failed to fetch availability:", error);
        throw error;
      }
    },
  });
};

