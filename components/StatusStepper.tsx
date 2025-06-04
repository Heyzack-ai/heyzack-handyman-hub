import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { JobStatus } from "@/types/job";
import Colors from "@/constants/colors";

type StatusStepperProps = {
  currentStatus: JobStatus;
};

export default function StatusStepper({ currentStatus }: StatusStepperProps) {
  const statuses: JobStatus[] = [
    "scheduled",
    "stock_collected",
    "en_route",
    "started",
    "completed",
  ];

  const getStatusLabel = (status: JobStatus): string => {
    switch (status) {
      case "scheduled":
        return "Scheduled";
      case "stock_collected":
        return "Collect Stock";
      case "en_route":
        return "En Route";
      case "started":
        return "Start Job";
      case "completed":
        return "Complete";
      default:
        return "";
    }
  };

  const getCurrentStatusIndex = (): number => {
    return statuses.findIndex((status) => status === currentStatus);
  };

  const isCompleted = (index: number): boolean => {
    return index < getCurrentStatusIndex();
  };

  const isCurrent = (index: number): boolean => {
    return index === getCurrentStatusIndex();
  };

  return (
    <View style={styles.container}>
      <View style={styles.stepsContainer}>
        {statuses.map((status, index) => (
          <React.Fragment key={status}>
            {/* Step circle */}
            <View
              style={[
                styles.stepCircle,
                isCompleted(index) && styles.completedStep,
                isCurrent(index) && styles.currentStep,
              ]}
            >
              {isCompleted(index) && (
                <View style={styles.checkmark} />
              )}
            </View>

            {/* Connector line */}
            {index < statuses.length - 1 && (
              <View
                style={[
                  styles.connector,
                  isCompleted(index) && styles.completedConnector,
                ]}
              />
            )}
          </React.Fragment>
        ))}
      </View>

      <View style={styles.labelsContainer}>
        {statuses.map((status, index) => (
          <View key={`label-${status}`} style={styles.labelContainer}>
            <Text
              style={[
                styles.label,
                (isCompleted(index) || isCurrent(index)) && styles.activeLabel,
              ]}
              numberOfLines={1}
            >
              {getStatusLabel(status)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  stepsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.gray[200],
    borderWidth: 2,
    borderColor: Colors.light.gray[300],
    justifyContent: "center",
    alignItems: "center",
  },
  completedStep: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  currentStep: {
    borderColor: Colors.light.primary,
    borderWidth: 2,
  },
  checkmark: {
    width: 10,
    height: 5,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: "white",
    transform: [{ rotate: "-45deg" }],
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.light.gray[300],
    marginHorizontal: 4,
  },
  completedConnector: {
    backgroundColor: Colors.light.primary,
  },
  labelsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  labelContainer: {
    width: 70,
    alignItems: "center",
  },
  label: {
    fontSize: 12,
    color: Colors.light.gray[500],
    textAlign: "center",
  },
  activeLabel: {
    color: Colors.light.text,
    fontWeight: "500",
  },
});