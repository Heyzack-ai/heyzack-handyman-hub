import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export function useMarkAllNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["notifications-mark-all"],
    mutationFn: async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) {
        throw new Error("Authentication token not found");
      }

      await axios.patch(`${BASE_URL}/notifications/read-all`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    },
    // Optimistically set unread counter to 0 for immediate UI feedback
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications-count"] });
      const previousCount = queryClient.getQueryData<{ unread: number; total: number; unreadCount: number }>(["notifications-count"]);
      queryClient.setQueryData(["notifications-count"], (old: any) => {
        const total = (old?.total ?? previousCount?.total ?? 0) as number;
        return { unread: 0, total, unreadCount: 0 };
      });
      return { previousCount } as any;
    },
    onError: (_error, _variables, context: any) => {
      if (context?.previousCount) {
        queryClient.setQueryData(["notifications-count"], context.previousCount);
      }
    },
    onSuccess: () => {
      // Ensure notifications list and count refresh after marking all as read
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      // Trigger immediate refetch of active counter queries for instant badge update
      queryClient.refetchQueries({ queryKey: ["notifications-count"], type: 'active' });
    },
  });
}