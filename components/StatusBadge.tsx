import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { JobStatus } from "@/types/job";
import Colors from "@/constants/colors";

type StatusBadgeProps = {
  status?: JobStatus | string;
  size?: "small" | "medium" | "large";
};

export default function StatusBadge({ status, size = "medium" }: StatusBadgeProps) {
  const normalizedStatus = typeof status === "string" ? status.toLowerCase().trim() : "";
  const getStatusColor = () => {
    switch (normalizedStatus) {
      case "scheduled":
        return Colors.light.info;
      case "pending":
        return Colors.light.warning;
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
      case "contract_sent":
        return Colors.light.success;
      case "contract_signed":
        return Colors.light.success;
      case "draft":
        return Colors.light.gray[500];
      case "assigned":
        return Colors.light.secondary;
      case "accepted":
        return Colors.light.success;
      case "stock_collected":
        return Colors.light.warning;
      case "job_completed":
        return Colors.light.success;
      default:
        return Colors.light.gray[500];
    }
  };

  const getStatusText = () => {
    switch (normalizedStatus) {
      case "scheduled":
        return "Scheduled";
      case "pending":
        return "Pending";
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
      case "contract_sent":
        return "Contract Sent";
      case "draft":
        return "Draft";
      case "contract_signed":
        return "Contract Signed";
      case "assigned":
        return "Assigned";
      case "accepted":
        return "Accepted";
      case "job_completed":
        return "Completed";
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