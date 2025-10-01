import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import Shimmer from "@/components/Shimmer";
import Colors from "@/constants/colors";

const NotificationsSkeleton: React.FC = () => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <Shimmer width="40%" height={24} borderRadius={6} />
        <Shimmer width="20%" height={18} borderRadius={12} style={{ marginLeft: 12 }} />
      </View>

      {/* Notifications List Skeleton */}
      <View style={styles.list}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i} style={styles.item}>
            <View style={styles.iconContainer}>
              <Shimmer width={40} height={40} borderRadius={20} />
            </View>
            <View style={styles.content}>
              <Shimmer width="60%" height={16} borderRadius={4} style={{ marginBottom: 6 }} />
              <Shimmer width="90%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
              <Shimmer width="70%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
              <View style={styles.timeRow}>
                <Shimmer width={20} height={12} borderRadius={6} />
                <Shimmer width="30%" height={12} borderRadius={6} style={{ marginLeft: 8 }} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    marginTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 24,
  },
  list: {
    gap: 12,
  },
  item: {
    flexDirection: "row",
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
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
  content: {
    flex: 1,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default NotificationsSkeleton;