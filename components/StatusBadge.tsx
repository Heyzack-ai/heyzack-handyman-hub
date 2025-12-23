import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { JobStatus } from "@/types/job";
import Colors from "@/constants/colors";
import { useTranslation } from "react-i18next";



type StatusBadgeProps = {
  status?: JobStatus | string;
  size?: "small" | "medium" | "large";
};

export default function StatusBadge({ status, size = "medium" }: StatusBadgeProps) {
  const normalizedStatus = typeof status === "string" ? status.toLowerCase().trim() : "";
  const { t } = useTranslation();
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
      case "job_completed":
        return Colors.light.success;
      case "job_approved":
        return Colors.light.info;
      case "customer_approved":
        return Colors.light.info;
      default:
        return Colors.light.gray[500];
    }
  };

  const getStatusText = () => {
    switch (normalizedStatus) {
      case "scheduled":
        return t("status.scheduled");
      case "pending":
        return t("status.pending");
      case "stock_collected":
        return t("status.stock_collected");
      case "en_route":
        return t("status.en_route");
      case "started":
        return t("status.started");
      case "completed":
        return t("status.completed");
      case "sent":
        return t("status.sent");
      case "not_sent":
        return t("status.not_sent");
      case "contract_sent":
        return t("status.contract_sent");
      case "draft":
        return t("status.draft");
      case "contract_signed":
        return t("status.contract_signed");
      case "assigned":
        return t("status.assigned");
      case "accepted":
        return t("status.accepted");
      case "job_completed":
        return t("status.job_completed");
      case "job_approved":
        return t("status.job_approved");
      case "customer_approved":
        return t("status.customer_approved");
      default:
        return t("status.unknown");
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