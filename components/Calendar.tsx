import React, { useState } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Job, JobType } from "@/types/job";
import Colors from "@/constants/colors";
import { useTranslations } from "@/src/i18n/useTranslations";

type CalendarProps = {
  selectedDate?: string;
  onDateSelect: (date: string) => void;
  jobs?: Job[];
};

export default function Calendar({ selectedDate, onDateSelect, jobs = [] }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { t } = useTranslations();
  const statuses = [
    "Scheduled",
    "En Route",
    "Stock Collected",
    "Started",
    "On Hold",
    "Completed",
    "Issues Reported",
    "Contract Sent",
    "Customer Approved",
  ];

  const monthNames = [
    t("home.January"), t("home.February"), t("home.March"), t("home.April"), t("home.May"), t("home.June"),
    t("home.July"), t("home.August"), t("home.September"), t("home.October"), t("home.November"), t("home.December")
  ];

  const dayNames = [t("home.Sun"), t("home.Mon"), t("home.Tue"), t("home.Wed"), t("home.Thu"), t("home.Fri"), t("home.Sat") ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const formatDate = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month, day).toISOString().split("T")[0];
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const isToday = (day: number) => {
    const today = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const getScheduledDate = (job: any): string => {
    // Support multiple shapes: scheduled_date, scheduledDate, installation.scheduledDate
    return (
      job?.scheduled_date ||
      job?.scheduledDate ||
      job?.installation?.scheduledDate ||
      ""
    );
  };

  const getStatus = (job: any): string | undefined => {
    // Use top-level status, or installation.status; fall back to response === 'pending'
    const status = job?.status || job?.installation?.status;
    if (status) return String(status).toLowerCase();
    if (job?.response === "pending") return "pending";
    return undefined;
  };

  const getJobTypesForDate = (day: number) => {
    const dateString = formatDate(day);
    const dayJobs = (jobs ?? []).filter(job => getScheduledDate(job)?.startsWith(dateString));

    return {
      hasBookedInstallation: dayJobs.some(job => {
        const status = getStatus(job);
        return !!status && status !== "pending";
      }),
      hasJobRequest: dayJobs.some(job => getStatus(job) === "pending"),
    };
  };

  const isSelected = (day: number) => {
    const dateString = formatDate(day);
    return selectedDate === dateString;
  };

  const days = getDaysInMonth(currentDate);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigateMonth("prev")} style={styles.navButton}>
          <ChevronLeft size={20} color={Colors.light.text} />
        </Pressable>
        
        <Text style={styles.monthYear}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>
        
        <Pressable onPress={() => navigateMonth("next")} style={styles.navButton}>
          <ChevronRight size={20} color={Colors.light.text} />
        </Pressable>
      </View>

      <View style={styles.dayNamesRow}>
        {dayNames.map((dayName) => (
          <Text key={dayName} style={styles.dayName}>
            {dayName}
          </Text>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {days.map((day, index) => {
          if (!day) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }
          
          const { hasBookedInstallation, hasJobRequest } = getJobTypesForDate(day);
          
          return (
            <Pressable
              key={`day-${day}`}
              style={[
                styles.dayCell,
                isToday(day) && styles.todayCell,
                isSelected(day) && styles.selectedCell,
              ]}
              onPress={() => onDateSelect(formatDate(day))}
            >
              <View style={styles.dayCellContent}>
                <Text
                  style={[
                    styles.dayText,
                    isToday(day) && styles.todayText,
                    isSelected(day) && styles.selectedText,
                  ]}
                >
                  {day}
                </Text>
                
                <View style={styles.dotsContainer}>
                  {hasBookedInstallation && (
                    <View style={[styles.dot, styles.bookedDot]} />
                  )}
                  {hasJobRequest && (
                    <View style={[styles.dot, styles.requestDot]} />
                  )}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.bookedDot]} />
          <Text style={styles.legendText}>{t("home.bookedInstallation")}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.requestDot]} />
          <Text style={styles.legendText}>{t("home.jobRequest")}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.gray[100],
  },
  monthYear: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
  },
  dayNamesRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  dayName: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
    color: Colors.light.gray[600],
    paddingVertical: 8,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginBottom: 4,
  },
  dayCellContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  todayCell: {
    backgroundColor: Colors.light.primary + "20",
    borderRadius: 8,
  },
  selectedCell: {
    backgroundColor: Colors.light.secondary + "20",
    borderRadius: 8,
  },
  dayText: {
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 4,
  },
  todayText: {
    color: Colors.light.primary,
    fontWeight: "600",
  },
  selectedText: {
    color: "black",
    fontWeight: "600",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
    height: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bookedDot: {
    backgroundColor: Colors.light.primary, // Blue color
  },
  requestDot: {
    backgroundColor: "#FF9500", // Orange color
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: 24,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: Colors.light.gray[600],
    fontWeight: "500",
  },
});