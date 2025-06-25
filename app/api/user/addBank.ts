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

export function useAddBank(bankData: any) {
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
        
        // Fetch current bank details
        const current = await axios.get(`${BASE_URL}/erp/resource/Handyman/${extendedUser.erpId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const existing = current.data.data.bank_details || [];

        // If new bank is default, set all existing to false
        let updatedBanks = existing;
        if (bankData.is_default) {
          updatedBanks = existing.map((b: any) => ({ ...b, is_default: false }));
        }
        const bankArray = [
          ...updatedBanks,
          {
            type: "Handyman",
            bank_name: bankData.bank_name,
            account_holder_name: bankData.account_holder_name,
            iban_number: bankData.iban_number,
            bic_code: bankData.bic_code,
            is_default: bankData.is_default
          }
        ];


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
        console.error("Failed to add bank:", error);
        throw error instanceof Error ? error : new Error("Failed to add bank");
      }
    },
  });
};

export const useDeleteBank = () => {
  return useMutation({
    mutationKey: ["delete-bank"],
    mutationFn: async (bankToDelete: any) => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const user = await authClient.getSession();
      if (!user.data?.user) {
        throw new Error("User not found");
      }

      const extendedUser = user.data.user as ExtendedUser;

      // Get current bank details
      const response = await axios.get(`${BASE_URL}/resource/Handyman/${extendedUser.erpId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Filter out the bank account to delete by matching all fields
      const updatedBankDetails = response.data.data.bank_details.filter((bank: any) => 
        bank.bank_name !== bankToDelete.bankName ||
        bank.account_holder_name !== bankToDelete.accountName ||
        bank.iban_number !== bankToDelete.accountNumber ||
        bank.bic_code !== bankToDelete.bicCode ||
        bank.type !== bankToDelete.accountType
      );

      // Update with filtered bank details
      await axios.put(`${BASE_URL}/resource/Handyman/${extendedUser.erpId}`, {
        bank_details: updatedBankDetails
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
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

        const response = await axios.get(`${BASE_URL}/erp/resource/Handyman/${extendedUser.erpId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        console.log("response from getBank", response.data);
        // Make sure we're not returning any direct text strings
        // that might be rendered outside of Text components
        return {
          ...response.data,
          // Ensure bank_details is always an array
          data: {
            ...response.data.data,
            bank_details: Array.isArray(response.data.data?.bank_details) 
              ? response.data.data.bank_details 
              : []
          }
        };
      } catch (error) {
        console.error("Failed to fetch bank details:", error);
        throw error;
      }
    },
  });
};

export const useSetDefaultBank = () => {
  return useMutation({
    mutationKey: ["set-default-bank"],
    mutationFn: async (selectedAccount: any) => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error("Authentication token not found");
      const user = await authClient.getSession();
      if (!user.data?.user) throw new Error("User not found");
      const extendedUser = user.data.user as ExtendedUser;

      // Fetch current bank details
      const current = await axios.get(`${BASE_URL}/resource/Handyman/${extendedUser.erpId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const existing = current.data.data.bank_details || [];

      // Set selected as default, all others as not default
      const updatedBanks = existing.map((b: any) => {
        const isMatch =
          b.bank_name === selectedAccount.bankName &&
          b.account_holder_name === selectedAccount.accountName &&
          b.iban_number === selectedAccount.accountNumber &&
          b.bic_code === selectedAccount.bicCode &&
          b.type === selectedAccount.accountType;
        return { ...b, is_default: isMatch };
      });

      const response = await axios.put(`${BASE_URL}/resource/Handyman/${extendedUser.erpId}`, {
        bank_details: updatedBanks
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    },
  });
};

