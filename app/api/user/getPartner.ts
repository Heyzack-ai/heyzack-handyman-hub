import { authClient } from "@/lib/auth-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import * as SecureStore from 'expo-secure-store';
import { Handyman } from "@/types/handyman";
import { getUnassignedPartners } from "@/lib/partner-client";

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

export function useGetPartner(partnerCode: string) {
  return useQuery<Partner>({
    queryKey: ["partner", partnerCode],
    queryFn: async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) {
          throw new Error("Authentication token not found");
        }
        const searchParams = new URLSearchParams();
        searchParams.append('filter', `[["partner_code", "=", "${partnerCode}"]]`);
        searchParams.append('fields', JSON.stringify(['name', 'partner_name', 'partner_code', 'contact_person', 'email', 'phone', 'address']));
        const response = await axios.get<{ data: Partner[] }>(`${BASE_URL}/erp/resource/Installation Partner?${searchParams.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log(response.data);

        if (!response.data?.data?.[0]) {
          throw new Error("Partner not found");
        }

        return response.data.data[0];
      } catch (error) {
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
        const searchParams = new URLSearchParams();
        searchParams.append('filter', `[["name", "=", "${name}"]]`);
        searchParams.append('fields', JSON.stringify(['name', 'partner_name', 'partner_code', 'contact_person', 'email', 'phone', 'address']));
        const response = await axios.get<{ data: Partner[] }>(`${BASE_URL}/erp/resource/Installation Partner?${searchParams.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log(response.data);

        if (!response.data?.data?.[0]) {
          throw new Error("Partner not found");
        }

        return response.data.data[0];
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

