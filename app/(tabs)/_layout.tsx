import React from "react";
import { Tabs } from "expo-router";
import { Home, Briefcase, User, MessageCircle } from "lucide-react-native";
import Colors from "@/constants/colors";
import { getUnreadCount } from "@/lib/chat-client";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

export default function TabLayout() {
  const { data: session } = authClient.useSession();
  
  // Get real unread count from API
  const { data: totalUnreadCount } = useQuery({
    queryKey: ["unread-count"],
    queryFn: getUnreadCount,
    enabled: !!session?.user.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.secondary,
        tabBarInactiveTintColor: Colors.light.gray[500],
        tabBarStyle: {
          borderTopColor: Colors.light.border,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: "Jobs",
          tabBarIcon: ({ color, size }) => <Briefcase size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
          tabBarBadge: totalUnreadCount && totalUnreadCount > 0 ? totalUnreadCount : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}