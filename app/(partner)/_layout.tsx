import React from "react";
import { Tabs, usePathname } from "expo-router";
import {
  Home,
  Users,
  Briefcase,
  UserCircle,
  Package,
  BarChart3,
  MessageCircle,
  LifeBuoy,
  Settings
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { getUnreadCount } from "@/lib/chat-client";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { useTranslation } from "react-i18next";

export default function PartnerTabLayout() {
  const { data: session } = authClient.useSession();
  const { t } = useTranslation();
  const pathname = usePathname();
  const currentPath = pathname || "";
  const isCustomerDetailsRoute =
    /^\/\(partner\)\/customers\/[^/]+$/.test(currentPath) ||
    /^\/customers\/[^/]+$/.test(currentPath);
  const isHandymanDetailsRoute =
    /^\/\(partner\)\/handymen\/[^/]+$/.test(currentPath) ||
    /^\/handymen\/[^/]+$/.test(currentPath);
  const isSettingsEditRoute =
    /^\/\(partner\)\/settings\/edit-profile$/.test(currentPath) ||
    /^\/settings\/edit-profile$/.test(currentPath);
  const isSettingsSubRoute =
    /^\/\(partner\)\/settings\/(edit-profile|language|help)$/.test(currentPath) ||
    /^\/settings\/(edit-profile|language|help)$/.test(currentPath);
  const isPartnerChatRoomRoute =
    /^\/\(partner\)\/chat\/[^/]+$/.test(currentPath) ||
    /^\/chat\/[^/]+$/.test(currentPath);
  const shouldHideTabBar =
    isCustomerDetailsRoute ||
    isHandymanDetailsRoute ||
    isSettingsEditRoute ||
    isSettingsSubRoute ||
    isPartnerChatRoomRoute;

  // Get real unread count from API
  const { data: totalUnreadCount } = useQuery({
    queryKey: ["unread-count"],
    queryFn: getUnreadCount,
    enabled: !!session?.user?.id,
    refetchInterval: 30000,
  });

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.secondary,
        tabBarInactiveTintColor: Colors.light.gray[500],
        tabBarStyle: {
          borderTopColor: Colors.light.border,
          backgroundColor: "#ffffff",
          display: shouldHideTabBar ? "none" : "flex",
        },
        headerShown: false,
      }}
    >
      {/* Dashboard */}
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.dashboard", "Dashboard"),
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />

      {/* Leads */}
      {/* <Tabs.Screen
        name="leads/index"
        options={{
          title: t("tabs.leads", "Leads"),
          tabBarIcon: ({ color, size }) => <Briefcase size={size} color={color} />,
        }}
      /> */}

      {/* Customers */}
      <Tabs.Screen
        name="customers"
        options={{
          title: t("tabs.customers", "Customers"),
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
          popToTopOnBlur: true,
        }}
      />

      {/* Installations */}
      <Tabs.Screen
        name="installations"
        options={{
          title: t("tabs.installations", "Jobs"),
          tabBarIcon: ({ color, size }) => <Package size={size} color={color} />,
        }}
      />

      {/* Handymen */}
      <Tabs.Screen
        name="handymen"
        options={{
          title: t("tabs.handymen", "Team"),
          tabBarIcon: ({ color, size }) => <UserCircle size={size} color={color} />,
        }}
      />

      {/* Inventory */}
      <Tabs.Screen
        name="inventory/index"
        options={{
          title: t("tabs.inventory", "Stock"),
          tabBarIcon: ({ color, size }) => <Package size={size} color={color} />,
        }}
      />

      {/* Reports */}


      {/* Chat - Shared with handymen */}
      <Tabs.Screen
        name="chat"
        options={{
          title: t("tabs.chat", "Chat"),
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
          tabBarBadge: totalUnreadCount && totalUnreadCount > 0 ? totalUnreadCount : undefined,
        }}
      />

      <Tabs.Screen
        name="chat/[id]"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />

      {/* Support */}


      {/* Settings */}
      <Tabs.Screen
        name="settings/index"
        options={{
          title: t("tabs.settings", "Settings"),
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings/edit-profile"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings/language"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings/help"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
