import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Calendar, Clock } from "lucide-react-native";
import StatusBadge from "./StatusBadge";
import { Job } from "@/types/job";
import Colors from "@/constants/colors";

type JobCardProps = {
  job: Job;
  disableNavigation?: boolean;
};

export default function JobCard({ job, disableNavigation = false }: JobCardProps) {
  const router = useRouter();

  const handlePress = () => {
    if (disableNavigation) {
      return;
    }
    
    // Only navigate to job details if the job is not pending
    if (job.status !== "pending") {
      router.push(`/jobs/${job.id}`);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && !disableNavigation && styles.pressed,
      ]}
      onPress={handlePress}
      disabled={disableNavigation || job.status === "pending"}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {job.title}
        </Text>
        <StatusBadge status={job.status} size="small" />
      </View>
      
      <Text style={styles.description} numberOfLines={2}>
        {job.description}
      </Text>
      
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{job.customer.name}</Text>
        <Text style={styles.address} numberOfLines={1}>
          {job.customer.address}
        </Text>
      </View>
      
      <View style={styles.footer}>
        <View style={styles.scheduleItem}>
          <Calendar size={14} color={Colors.light.gray[600]} />
          <Text style={styles.scheduleText}>{job.scheduledDate}</Text>
        </View>
        <View style={styles.scheduleItem}>
          <Clock size={14} color={Colors.light.gray[600]} />
          <Text style={styles.scheduleText}>{job.scheduledTime}</Text>
        </View>
        <Text style={styles.productsCount}>
          {job.products.length} {job.products.length === 1 ? "product" : "products"}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    flex: 1,
    marginRight: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.light.gray[700],
    marginBottom: 12,
  },
  customerInfo: {
    marginBottom: 12,
  },
  customerName: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.text,
  },
  address: {
    fontSize: 13,
    color: Colors.light.gray[600],
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
  },
  scheduleItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  scheduleText: {
    fontSize: 12,
    color: Colors.light.gray[600],
    marginLeft: 4,
  },
  productsCount: {
    fontSize: 12,
    color: Colors.light.gray[600],
    marginLeft: "auto",
  },
});