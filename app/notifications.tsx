import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, SafeAreaView, StatusBar, Platform } from "react-native";
import { useRouter, Stack } from "expo-router";
import { ArrowLeft, Bell, CheckCircle, AlertCircle, Calendar, Briefcase, Clock, Trash2 } from "lucide-react-native";
import Colors from "@/constants/colors";
import Header from "@/components/Header";
import NotificationsSkeleton from "@/components/NotificationsSkeleton";
import { useDeleteNotification, useGetNotifications, useGetNotificationCount, type NotificationsResponse } from "@/app/api/notifications/getNotifications";
import { useMarkAllNotifications } from "@/app/api/notifications/markAll";

type Notification = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "job" | "schedule" | "system" | "partner";
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { data: apiData, isLoading, error } = useGetNotifications();
  const { data: countData } = useGetNotificationCount();
  const markAllMutation = useMarkAllNotifications();
  const deleteMutation = useDeleteNotification();
  const notificationsFromApi: Notification[] = (apiData?.notifications || []).map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    time: n.time || "",
    read: Boolean(n.read),
    type: (n.type as Notification["type"]) || "system",
  }));
  const [notificationsList, setNotificationsList] = useState<Notification[]>(notificationsFromApi);
  const unreadCount = (countData?.unreadCount ?? apiData?.unreadCount) ?? notificationsList.filter(n => !n.read).length;

  // Keep local state in sync when API data arrives
  React.useEffect(() => {
    setNotificationsList(notificationsFromApi);
  }, [apiData?.notifications?.length]);

  // Show skeleton while loading notifications
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}> 
        <Header title="Notifications" onBack={() => router.back()} />
        <NotificationsSkeleton />
      </SafeAreaView>
    );
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "job":
        return <Briefcase size={24} color={Colors.light.primary} />;
      case "schedule":
        return <Calendar size={24} color="#FF9500" />;
      case "system":
        return <AlertCircle size={24} color="#FF2D55" />;
      case "partner":
        return <CheckCircle size={24} color="#4CD964" />;
      default:
        return <Bell size={24} color={Colors.light.primary} />;
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark notification as read
    setNotificationsList(prev => 
      prev.map(n => n.id === notification.id ? {...n, read: true} : n)
    );
    
    // Handle navigation based on notification type
    if (notification.type === "job") {
      // Navigate to jobs screen or specific job
      router.push("/jobs");
    } else if (notification.type === "schedule") {
      // Navigate to schedule/calendar view
      router.push("/");
    } else if (notification.type === "partner") {
      // Navigate to partners section
      router.push("/profile/partners");
    }
  };

  // unreadCount displayed above uses API-provided count when available

  return (
    <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
      <Header title="Notifications" onBack={() => router.back()} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          {/* <Text style={styles.title}>Notifications</Text> */}
         {unreadCount > 0 ? (
  <Text style={styles.unreadBadge}>{unreadCount} new</Text>
) : (
  <View style={{ width: 8 }} />
)}
          <View style={styles.headerButton}>
            {unreadCount > 0 && (
            <Pressable style={styles.markAllButton} onPress={async () => {
              try {
                await markAllMutation.mutateAsync();
                setNotificationsList(prev => prev.map(n => ({...n, read: true})));
              } catch (error) {
                console.error("Error marking all notifications as read:", error);
              }
            }}>
              <Text style={styles.markAllText}>Mark all as read</Text>
            </Pressable>
            )}
            {notificationsList.length > 0 && (
            <Pressable style={styles.deleteButton} onPress={async () => {
              try {
                await deleteMutation.mutateAsync();
                setNotificationsList([]);
              } catch (error) {
                console.error("Error deleting notifications:", error);
              }
            }}>
              <Trash2 size={24} color={Colors.light.white} />
            </Pressable>
            )}
          </View>
        </View>
        
        {notificationsList.length > 0 ? (
          <View style={styles.notificationsList}>
            {notificationsList.map((notification) => (
              <Pressable
                key={notification.id}
                style={[
                  styles.notificationItem,
                  !notification.read && styles.unreadItem
                ]}
                onPress={() => handleNotificationPress(notification)}
              >
                <View style={styles.iconContainer}>
                  {getNotificationIcon(notification.type)}
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationMessage}>{notification.message}</Text>
                  <View style={styles.timeContainer}>
                    <Clock size={12} color={Colors.light.gray[500]} />
                    <Text style={styles.timeText}>{notification.time}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Bell size={48} color={Colors.light.gray[400]} />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyText}>
              You don't have any notifications at the moment
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    marginTop: 16,
  },
  headerButton: {
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.text,
  },
  unreadBadge: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 12,
    textAlign: 'left',
  },
  notificationsList: {
    gap: 12,
  },
  notificationItem: {
    flexDirection: "row",
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  unreadItem: {
    backgroundColor: "#F0F8FF", // Light blue background for unread items
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.primary,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: Colors.light.gray[600],
    marginBottom: 8,
    lineHeight: 20,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 12,
    color: Colors.light.gray[500],
    marginLeft: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.gray[600],
    textAlign: "center",
  },
  markAllButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 100,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  markAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.white,
  },
  deleteButton: {
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 100,
    backgroundColor: Colors.light.error,
  },
});
