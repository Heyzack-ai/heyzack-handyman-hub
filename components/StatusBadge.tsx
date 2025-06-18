import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { JobStatus } from "@/types/job";
import Colors from "@/constants/colors";

type StatusBadgeProps = {
  status: JobStatus;
  size?: "small" | "medium" | "large";
};

export default function StatusBadge({ status, size = "medium" }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();
  const getStatusColor = () => {
    switch (normalizedStatus) {
      case "scheduled":
        return Colors.light.info;
      case "stock_collected":
        return Colors.light.warning;
      case "en_route":
        return Colors.light.secondary;
      case "started":
        return Colors.light.primary;
      case "completed":
        return Colors.light.success;
      case "sent":
        return Colors.light.success;
      case "not_sent":
        return Colors.light.error;
      default:
        return Colors.light.gray[500];
    }
  };

  const getStatusText = () => {
    switch (normalizedStatus) {
      case "scheduled":
        return "Scheduled";
      case "stock_collected":
        return "Stock Collected";
      case "en_route":
        return "En Route";
      case "started":
        return "In Progress";
      case "completed":
        return "Completed";
      case "sent":
        return "Sent";
      case "not_sent":
        return "Not Sent";
      default:
        return "Unknown";
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          container: { paddingVertical: 2, paddingHorizontal: 6 },
          text: { fontSize: 10 }
        };
      case "large":
        return {
          container: { paddingVertical: 6, paddingHorizontal: 12 },
          text: { fontSize: 16 }
        };
      default:
        return {
          container: { paddingVertical: 4, paddingHorizontal: 8 },
          text: { fontSize: 12 }
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: getStatusColor() + "20" },
        sizeStyles.container
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: getStatusColor() },
          sizeStyles.text
        ]}
      >
        {getStatusText()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  text: {
    fontWeight: "600",
  },
});