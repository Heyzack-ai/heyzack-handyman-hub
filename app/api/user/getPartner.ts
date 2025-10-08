import { authClient } from "@/lib/auth-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import * as SecureStore from 'expo-secure-store';
import { Handyman } from "@/types/handyman";
import { getUnassignedPartners } from "@/lib/partner-client";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

type Partner = {
  id: string;
  name: string;
  partner_name?: string;
  partner_code?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export function useGetPartner(partnerCode: string) {
  return useQuery<Partner | null>({
    queryKey: ["partner", partnerCode],
    queryFn: async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) {
          throw new Error("Authentication token not found");
        }
        
        // API returns { message: string; partner: Partner | null }
        const response = await axios.get<{ message: string; partner: Partner | null }>(`${BASE_URL}/profile/partner`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log("partner", response.data);

        // Return partner object (or null when not assigned)
        return response.data?.partner ?? null;
      } catch (error: any) {
        console.error("Failed to fetch partner:", error);
        throw error instanceof Error
          ? error
          : new Error("Failed to fetch partner data");
      }
    },
    enabled: !!partnerCode,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGetPartnerById(name: string) {
  return useQuery<Partner>({
    queryKey: ["partner", name],
    queryFn: async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) {
          throw new Error("Authentication token not found");
        }
       console.log("Fetching partner by ID:", name);
        const response = await axios.get< Partner >(`${BASE_URL}/partners/${name}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log(response.data);

       

        return response.data;
      } catch (error) {
        console.error("Failed to fetch partner:", error);
        throw error instanceof Error
          ? error
          : new Error("Failed to fetch partner data");
      }
    },
    enabled: !!name,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGetUnassignedPartners() {
  return useQuery({
    queryKey: ["unassigned-partners"],
    queryFn: getUnassignedPartners,
    staleTime: 5 * 60 * 1000,
  });
}

