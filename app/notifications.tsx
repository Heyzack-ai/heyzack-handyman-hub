import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, SafeAreaView, StatusBar, Platform } from "react-native";
import { useRouter, Stack } from "expo-router";
import { ArrowLeft, Bell, CheckCircle, AlertCircle, Calendar, Briefcase, Clock } from "lucide-react-native";
import Colors from "@/constants/colors";
import Header from "@/components/Header";

type Notification = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "job" | "schedule" | "system" | "partner";
};

const notifications: Notification[] = [
  {
    id: "1",
    title: "New Job Request",
    message: "You have a new job request for Smart Security System Installation",
    time: "10 minutes ago",
    read: false,
    type: "job"
  },
  {
    id: "2",
    title: "Job Completed",
    message: "You've successfully completed the Full Smart Home Installation job",
    time: "2 hours ago",
    read: false,
    type: "job"
  },
  {
    id: "3",
    title: "Schedule Change",
    message: "Your job on June 8th has been rescheduled to June 10th",
    time: "Yesterday",
    read: true,
    type: "schedule"
  },
  {
    id: "4",
    title: "Payment Received",
    message: "You've received a payment of €450 for job #1234",
    time: "2 days ago",
    read: true,
    type: "system"
  },
  {
    id: "5",
    title: "New Partner",
    message: "Home Solutions Inc. has added you as a partner",
    time: "3 days ago",
    read: true,
    type: "partner"
  },
  {
    id: "6",
    title: "System Maintenance",
    message: "The app will be under maintenance on June 15th from 2-4 AM",
    time: "1 week ago",
    read: true,
    type: "system"
  }
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [notificationsList, setNotificationsList] = useState<Notification[]>(notifications);
  
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

  const unreadCount = notificationsList.filter(n => !n.read).length;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
      <Header title="Notifications" onBack={() => router.back()} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          {/* <Text style={styles.title}>Notifications</Text> */}
          {unreadCount > 0 && (
            <Text style={styles.unreadBadge}>{unreadCount} new</Text>
          )}
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
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
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
});