import { authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";

// Define the User type based on the response structure
type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
};

/**
 * Hook to fetch the current user's profile data
 * @param options - Optional configuration for the query
 * @returns Query result with user data
 */
export const useGetUser = (options = {}) => {
  return useQuery<User>({
    queryKey: ["user"],
    queryFn: async () => {
      try {
        const response = await authClient.getSession();
        
        if (!response.data?.user) {
          throw new Error("User not found");
        }
        
        return response.data.user;
      } catch (error) {
        console.error("Failed to fetch user:", error);
        throw error instanceof Error 
          ? error 
          : new Error("Failed to fetch user data");
      }
    },
    // The global QueryClient in _layout.tsx already sets:
    // - staleTime: 24 hours
    // - retry: 2
    // - refetchOnWindowFocus: false
    // - refetchOnMount: false
    // - refetchOnReconnect: false
    
    // Override specific options for user data:
    // Use a shorter stale time for user data (5 minutes instead of 24 hours)
    staleTime: 5 * 60 * 1000,
    // Allow custom options to override defaults
    ...options
  });
};

/**
 * Hook to fetch the current user's profile data with minimal options
 * Useful for components that need user data but don't need to show loading states
 */
export const useGetUserMinimal = () => {
  return useGetUser({
    // Don't show loading state if we have cached data
    notifyOnChangeProps: ['data', 'error'],
  });
};

/**
 * Hook to fetch the current user's profile data with real-time updates
 * Useful for components that need the most up-to-date user data
 */
export const useGetUserRealtime = () => {
  return useGetUser({
    // Use a shorter stale time for real-time data
    staleTime: 0,
    // Always refetch on mount
    refetchOnMount: true,
    // Refetch on window focus
    refetchOnWindowFocus: true,
    // Refetch on reconnect
    refetchOnReconnect: true,
  });
};


