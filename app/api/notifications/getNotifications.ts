import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export type ApiNotification = {
  id: string;
  title: string;
  message: string;
  time?: string;
  read?: boolean;
  type?: "job" | "schedule" | "system" | "partner" | string;
  metadata?: Record<string, any>;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt?: string;
};

export type NotificationsResponse = {
  notifications: ApiNotification[];
  unreadCount: number;
};

export function useGetNotifications() {
  return useQuery<NotificationsResponse>({
    queryKey: ["notifications"],
    queryFn: async (): Promise<NotificationsResponse> => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) {
          throw new Error("Authentication token not found");
        }

        const response = await axios.get<{ data?: any[] | { notifications?: any[]; unreadCount?: number } }>(`${BASE_URL}/notifications`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log("getNotifications response:", response.data);

        const raw = Array.isArray((response.data as any)?.data)
          ? (response.data as any).data
          : Array.isArray((response.data as any)?.notifications)
            ? (response.data as any).notifications
            : [];

        // Normalize shape and ensure safe defaults
        const normalized: ApiNotification[] = raw.map((n: any) => ({
          id: String(n?.id ?? n?.name ?? cryptoRandomId()),
          title: String(n?.title ?? n?.message_title ?? "Notification"),
          message: String(n?.message ?? n?.body ?? ""),
          time: typeof n?.time === 'string' ? n.time : formatRelativeTime(n?.createdAt),
          read: Boolean(n?.read ?? false),
          type: (n?.type ?? n?.relatedEntityType ?? "system") as any,
          metadata: n?.metadata ?? {},
          relatedEntityType: n?.relatedEntityType ?? undefined,
          relatedEntityId: n?.relatedEntityId ?? undefined,
          createdAt: n?.createdAt ?? undefined,
        }));

        const unreadCount = normalized.filter(n => !n.read).length;

        return {
          notifications: normalized,
          unreadCount,
        };
      } catch (error: any) {
        console.error("Failed to fetch notifications:", error?.response?.data || error.message);
        // Return safe empty shape to satisfy React Query's requirement
        return { notifications: [], unreadCount: 0 };
      }
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });
}

function cryptoRandomId() {
  // Minimal random ID generator without crypto dependency for RN
  return `notif_${Math.random().toString(36).slice(2, 10)}`;
}

function formatRelativeTime(iso?: string) {
  if (!iso) return undefined;
  try {
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  } catch {
    return undefined;
  }
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["notifications-delete-all"],
    mutationFn: async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) {
        throw new Error("Authentication token not found");
      }

      await axios.delete(`${BASE_URL}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
    },
  });
}

export function useGetNotificationCount() {
  return useQuery<{ unread: number; total: number; unreadCount: number }>({
    queryKey: ["notifications-count"],
    queryFn: async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) {
          throw new Error("Authentication token not found");
        }

        const response = await axios.get<{ total?: number; unread?: number; unreadCount?: number }>(`${BASE_URL}/notifications/count`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log("getNotificationCount response:", response.data);
        const unread = typeof response.data?.unread === 'number'
          ? response.data.unread
          : typeof response.data?.unreadCount === 'number'
            ? response.data.unreadCount
            : 0;
        const total = typeof response.data?.total === 'number' ? response.data.total : 0;
        return { unread, total, unreadCount: unread };
      } catch (error: any) {
        console.error("Failed to fetch notification count:", error?.response?.data || error.message);
        // Return safe empty shape (include both keys for compatibility)
        return { unread: 0, total: 0, unreadCount: 0 };
      }
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });
}
