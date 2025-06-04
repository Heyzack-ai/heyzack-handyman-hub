import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  SafeAreaView,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Clock } from "lucide-react-native";
import Colors from "@/constants/colors";
import Header from "@/components/Header";

type DaySchedule = {
  enabled: boolean;
  startTime: string;
  endTime: string;
};

type WeekSchedule = {
  [key: string]: DaySchedule;
};

export default function AvailabilityScreen() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  
  const [schedule, setSchedule] = useState<WeekSchedule>({
    monday: { enabled: true, startTime: "09:00", endTime: "17:00" },
    tuesday: { enabled: true, startTime: "09:00", endTime: "17:00" },
    wednesday: { enabled: true, startTime: "09:00", endTime: "17:00" },
    thursday: { enabled: true, startTime: "09:00", endTime: "17:00" },
    friday: { enabled: true, startTime: "09:00", endTime: "17:00" },
    saturday: { enabled: false, startTime: "10:00", endTime: "15:00" },
    sunday: { enabled: false, startTime: "10:00", endTime: "15:00" },
  });

  const days = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ];

  const timeSlots = [
    "00:00", "01:00", "02:00", "03:00", "04:00", "05:00",
    "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
    "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
    "18:00", "19:00", "20:00", "21:00", "22:00", "23:00",
  ];

  const toggleDay = (day: string) => {
    setSchedule({
      ...schedule,
      [day]: {
        ...schedule[day],
        enabled: !schedule[day].enabled,
      },
    });
  };

  const setStartTime = (day: string, time: string) => {
    setSchedule({
      ...schedule,
      [day]: {
        ...schedule[day],
        startTime: time,
      },
    });
  };

  const setEndTime = (day: string, time: string) => {
    setSchedule({
      ...schedule,
      [day]: {
        ...schedule[day],
        endTime: time,
      },
    });
  };

  const handleSave = () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      Alert.alert("Success", "Availability schedule updated successfully");
      router.back();
    }, 1000);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${formattedHour}:${minutes} ${period}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Set Availability" onBack={() => router.back()} />
      
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.description}>
            Set your weekly availability schedule. This helps customers know when you're available for jobs.
          </Text>
          
          <View style={styles.scheduleContainer}>
            {days.map((day) => (
              <View key={day.key} style={styles.dayRow}>
                <View style={styles.dayInfo}>
                  <Text style={styles.dayName}>{day.label}</Text>
                  <Switch
                    value={schedule[day.key].enabled}
                    onValueChange={() => toggleDay(day.key)}
                    trackColor={{ false: Colors.light.gray[300], true: Colors.light.primary + "70" }}
                    thumbColor={schedule[day.key].enabled ? Colors.light.primary : Colors.light.gray[100]}
                  />
                </View>
                
                {schedule[day.key].enabled && (
                  <View style={styles.timeSelectors}>
                    <Pressable
                      style={styles.timeSelector}
                      onPress={() => {
                        // In a real app, show a time picker here
                        Alert.alert(
                          "Select Start Time",
                          "This would open a time picker in a real app"
                        );
                      }}
                    >
                      <Clock size={16} color={Colors.light.gray[600]} />
                      <Text style={styles.timeText}>
                        {formatTime(schedule[day.key].startTime)}
                      </Text>
                    </Pressable>
                    
                    <Text style={styles.toText}>to</Text>
                    
                    <Pressable
                      style={styles.timeSelector}
                      onPress={() => {
                        // In a real app, show a time picker here
                        Alert.alert(
                          "Select End Time",
                          "This would open a time picker in a real app"
                        );
                      }}
                    >
                      <Clock size={16} color={Colors.light.gray[600]} />
                      <Text style={styles.timeText}>
                        {formatTime(schedule[day.key].endTime)}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ))}
          </View>
          
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>How Availability Works</Text>
            <Text style={styles.infoText}>
              • Your availability is used to show customers when you can accept jobs.
            </Text>
            <Text style={styles.infoText}>
              • You'll only receive job requests during your available hours.
            </Text>
            <Text style={styles.infoText}>
              • You can update your availability at any time.
            </Text>
          </View>
        </ScrollView>
        
        <View style={styles.footer}>
          <Pressable
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  description: {
    fontSize: 16,
    color: Colors.light.gray[600],
    marginBottom: 24,
  },
  scheduleContainer: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  dayRow: {
    marginBottom: 16,
  },
  dayInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dayName: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.text,
  },
  timeSelectors: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeSelector: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  timeText: {
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 8,
  },
  toText: {
    marginHorizontal: 8,
    fontSize: 14,
    color: Colors.light.gray[600],
  },
  infoBox: {
    backgroundColor: Colors.light.primary + "10",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.gray[700],
    marginBottom: 4,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: Colors.light.gray[400],
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});
