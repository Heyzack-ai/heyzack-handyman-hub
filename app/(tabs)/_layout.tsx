// import React from "react";
// import { Tabs } from "expo-router";
// import { Home, Briefcase, User, MessageCircle } from "lucide-react-native";
// import Colors from "@/constants/colors";
// import { getUnreadCount } from "@/lib/chat-client";
// import { useQuery } from "@tanstack/react-query";
// import { authClient } from "@/lib/auth-client";
// import { useTranslation } from "react-i18next";
// import { useAuth } from "@/lib/auth-context";

// export default function TabLayout() {
//   const { data: session } = authClient.useSession();
//   const { t } = useTranslation();
//   const { role } = useAuth();

//   // Get real unread count from API
//   const { data: totalUnreadCount } = useQuery({
//     queryKey: ["unread-count"],
//     queryFn: getUnreadCount,
//     enabled: !!session?.user.id,
//     refetchInterval: 30000, // Refetch every 30 seconds
//   });

//   return (
//     <Tabs
//       screenOptions={{
//         tabBarActiveTintColor: Colors.light.secondary,
//         tabBarInactiveTintColor: Colors.light.gray[500],
//         tabBarStyle: {
//           borderTopColor: Colors.light.border,
//         },
//         headerShown: false,
//       }}
//     >
//       <Tabs.Screen
//         name="index"
//         options={{
//           title: t("tabs.home"),
//           tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
//         }}
//       />
//       <Tabs.Screen
//         name="jobs"
//         options={{
//           title: t("tabs.jobs"),
//           tabBarIcon: ({ color, size }) => <Briefcase size={size} color={color} />,
//         }}
//       />
//       {role !== "partner" && (
//         <Tabs.Screen
//           name="chat"
//           options={{
//             title: t("tabs.chat"),
//             tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
//             tabBarBadge: totalUnreadCount && totalUnreadCount > 0 ? totalUnreadCount : undefined,
//           }}
//         />
//       )}
//       <Tabs.Screen
//         name="profile"
//         options={{
//           title: t("tabs.profile"),
//           tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
//         }}
//       />
//     </Tabs>
//   );
// }

import React from "react";
import { Tabs } from "expo-router";
import { Home, Briefcase, User, MessageCircle } from "lucide-react-native";
import Colors from "@/constants/colors";
import { getUnreadCount } from "@/lib/chat-client";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth-context";

export default function TabLayout() {
  const { data: session } = authClient.useSession();
  const { t } = useTranslation();
  const { role } = useAuth();

  const { data: totalUnreadCount } = useQuery({
    queryKey: ["unread-count"],
    queryFn: getUnreadCount,
    enabled: !!session?.user.id,
    refetchInterval: 30000,
  });

  const isPartner = role === "partner";

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
          title: t("tabs.home"),
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: t("tabs.jobs"),
          tabBarIcon: ({ color, size }) => <Briefcase size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          href: isPartner ? null : undefined,
          title: t("tabs.chat"),
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
          tabBarBadge: totalUnreadCount && totalUnreadCount > 0 ? totalUnreadCount : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}