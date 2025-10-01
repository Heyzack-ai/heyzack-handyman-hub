import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  SafeAreaView,
  Platform,
  Modal,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Clock } from "lucide-react-native";
import Colors from "@/constants/colors";
import Header from "@/components/Header";
import { useAddAvailability, useGetAvailability } from "../api/user/addAvailability";
import { useQueryClient } from "@tanstack/react-query";
import DateTimePicker from '@react-native-community/datetimepicker';
import { WeekSchedule } from "@/types/availability";
import { useTranslation } from "react-i18next";

export default function AvailabilityScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: availabilityData, isLoading } = useGetAvailability();

  useEffect(() => {
    console.log("Full availabilityData:", JSON.stringify(availabilityData, null, 2));
    
    // Check if data is directly under availabilityData
    if (availabilityData?.availability) {
      console.log("Direct availability found:", JSON.stringify(availabilityData.availability, null, 2));
      let incoming = availabilityData.availability;
      
      // Handle both string and object formats
      if (typeof incoming === "string") {
        try {
          incoming = JSON.parse(incoming);
        } catch {
          incoming = [];
        }
      }
      
      const normalized: WeekSchedule = { ...defaultSchedule };
      
      // Check if incoming is an array (new format) or has availability property (old format)
      let availabilityArray = [];
      if (Array.isArray(incoming)) {
        availabilityArray = incoming;
      } else if (incoming && Array.isArray(incoming.availability)) {
        availabilityArray = incoming.availability;
      }
      
      // Process the availability data
      if (availabilityArray.length > 0) {
        console.log("Processing availability array:", availabilityArray);
        availabilityArray.forEach((item: any) => {
          if (item.day && normalized[item.day]) {
            normalized[item.day] = {
              enabled: !!item.is_active,
              startTime: item.start_time || "09:00",
              endTime: item.end_time || "17:00",
            };
          }
        });
      }
      
      setSchedule(normalized);
      return;
    }
    
    if (availabilityData?.data) {
      console.log("availabilityData.data:", JSON.stringify(availabilityData.data, null, 2));
      let incoming = availabilityData.data.availability;
      
      // Handle both string and object formats
      if (typeof incoming === "string") {
        try {
          incoming = JSON.parse(incoming);
        } catch {
          incoming = [];
        }
      }
      
      const normalized: WeekSchedule = { ...defaultSchedule };
      
      // Check if incoming is an array (new format) or has availability property (old format)
      let availabilityArray = [];
      if (Array.isArray(incoming)) {
        availabilityArray = incoming;
      } else if (incoming && Array.isArray(incoming.availability)) {
        availabilityArray = incoming.availability;
      }
      
      // Process the availability data
      if (availabilityArray.length > 0) {
        availabilityArray.forEach((item: any) => {
          if (item.day && normalized[item.day]) {
            normalized[item.day] = {
              enabled: !!item.is_active,
              startTime: item.start_time || "09:00",
              endTime: item.end_time || "17:00",
            };
          }
        });
      }
      
      setSchedule(normalized);
    }
  }, [availabilityData]);
  
  const defaultSchedule: WeekSchedule = {
    monday: { enabled: false, startTime: "09:00", endTime: "17:00" },
    tuesday: { enabled: false, startTime: "09:00", endTime: "17:00" },
    wednesday: { enabled: false, startTime: "09:00", endTime: "17:00" },
    thursday: { enabled: false, startTime: "09:00", endTime: "17:00" },
    friday: { enabled: false, startTime: "09:00", endTime: "17:00" },
    saturday: { enabled: false, startTime: "09:00", endTime: "17:00" },
    sunday: { enabled: false, startTime: "09:00", endTime: "17:00" }
  };

  const [schedule, setSchedule] = useState<WeekSchedule>(defaultSchedule);

  const days = [
    { key: "monday", label: t("availability.monday") },
    { key: "tuesday", label: t("availability.tuesday") },
    { key: "wednesday", label: t("availability.wednesday") },
    { key: "thursday", label: t("availability.thursday") },
    { key: "friday", label: t("availability.friday") },
    { key: "saturday", label: t("availability.saturday") },
    { key: "sunday", label: t("availability.sunday") },
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

  const { mutate, error, isPending } = useAddAvailability();

  const handleSave = () => {
    setIsSaving(true);
    
    mutate(schedule, {
      onSuccess: () => {
        setIsSaving(false);
        queryClient.invalidateQueries({ queryKey: ["get-availability"] });
        Alert.alert(t("availability.success"), t("availability.availabilityScheduleUpdatedSuccessfully"));
        router.back();
      },
      onError: (error) => {
        setIsSaving(false);
        Alert.alert(t("availability.error"), error instanceof Error ? error.message : t("availability.failedToUpdateAvailability"));
      },
    });

  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${formattedHour}:${minutes} ${period}`;
  };

  const createTimeDate = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    date.setSeconds(0);
    return date;
  };

  // Add state to track which picker is open
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [activeDayKey, setActiveDayKey] = useState("");

  // Add state for custom time picker
  const [showCustomTimePicker, setShowCustomTimePicker] = useState(false);
  const [isStartTime, setIsStartTime] = useState(true);
  const [tempHour, setTempHour] = useState(9);
  const [tempMinute, setTempMinute] = useState(0);

  // Add refs for the ScrollViews
  const hourScrollViewRef = useRef<ScrollView | null>(null);
  const minuteScrollViewRef = useRef<ScrollView | null>(null);

  // Add useEffect to scroll to the selected values when the picker opens
  useEffect(() => {
    if (showCustomTimePicker) {
      // Use setTimeout to ensure the ScrollView has rendered
      setTimeout(() => {
        // Scroll to the selected hour
        hourScrollViewRef.current?.scrollTo({
          y: tempHour * 40, // Approximate height of each item
          animated: false
        });
        
        // Scroll to the selected minute
        minuteScrollViewRef.current?.scrollTo({
          y: tempMinute * 40, // Approximate height of each item
          animated: false
        });
      }, 100);
    }
  }, [showCustomTimePicker]);  // Only trigger on modal open

  // Create a custom time picker component
  const renderCustomTimePicker = () => {
    return (
      <Modal
        visible={showCustomTimePicker}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.timePickerContainer}>
            <Text style={styles.timePickerTitle}>
              {isStartTime ? t("availability.selectStartTime") : t("availability.selectEndTime")}
            </Text>
            
            <View style={styles.timePickerContent}>
              <View style={styles.timePickerColumn}>
                <Text style={styles.timePickerLabel}>{t("availability.hour")}</Text>
                <ScrollView 
                  ref={hourScrollViewRef}
                  style={styles.timePickerScroll} 
                  showsVerticalScrollIndicator={false}
                >
                  {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                    <TouchableOpacity
                      key={`hour-${hour}`}
                      style={[
                        styles.timePickerItem,
                        hour === tempHour && styles.timePickerItemSelected
                      ]}
                      onPress={() => {
                        // Update the hour
                        setTempHour(hour);
                        
                        // Don't auto-scroll after selection
                        // The selected item will be highlighted in place
                      }}
                    >
                      <Text style={[
                        styles.timePickerItemText,
                        hour === tempHour && styles.timePickerItemTextSelected
                      ]}>
                        {hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.timePickerColumn}>
                <Text style={styles.timePickerLabel}>{t("availability.minute")}</Text>
                <ScrollView 
                  ref={minuteScrollViewRef}
                  style={styles.timePickerScroll} 
                  showsVerticalScrollIndicator={false}
                >
                  {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                    <TouchableOpacity
                      key={`minute-${minute}`}
                      style={[
                        styles.timePickerItem,
                        minute === tempMinute && styles.timePickerItemSelected
                      ]}
                      onPress={() => {
                        // Update the minute
                        setTempMinute(minute);
                        
                        // Don't auto-scroll after selection
                      }}
                    >
                      <Text style={[
                        styles.timePickerItemText,
                        minute === tempMinute && styles.timePickerItemTextSelected
                      ]}>
                        {minute.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.timePickerColumn}>
                <Text style={styles.timePickerLabel}>{t("availability.amPm")}</Text>
                <View style={styles.amPmContainer}>
                  <TouchableOpacity
                    style={[
                      styles.amPmButton,
                      tempHour < 12 && styles.amPmButtonSelected
                    ]}
                    onPress={() => {
                      // Update the hour to AM
                      setTempHour(tempHour % 12);
                    }}
                  >
                    <Text style={[
                      styles.amPmButtonText,
                      tempHour < 12 && styles.amPmButtonTextSelected
                      ]}>{t("availability.am")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.amPmButton,
                      tempHour >= 12 && styles.amPmButtonSelected
                    ]}
                    onPress={() => {
                      // Update the hour to PM
                      setTempHour(tempHour % 12 + 12);
                    }}
                  >
                    <Text style={[
                      styles.amPmButtonText,
                      tempHour >= 12 && styles.amPmButtonTextSelected
                    ]}>{t("availability.pm")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <View style={styles.timePickerActions}>
              <TouchableOpacity
                style={styles.timePickerCancel}
                onPress={() => setShowCustomTimePicker(false)}
              >
                <Text style={styles.timePickerCancelText}>{t("availability.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.timePickerConfirm}
                onPress={() => {
                  const hours = tempHour.toString().padStart(2, '0');
                  const minutes = tempMinute.toString().padStart(2, '0');
                  const timeString = `${hours}:${minutes}`;
                  
                  if (isStartTime) {
                    setStartTime(activeDayKey, timeString);
                  } else {
                    setEndTime(activeDayKey, timeString);
                  }
                  
                  setShowCustomTimePicker(false);
                }}
              >
                <Text style={styles.timePickerConfirmText}>{t("availability.confirm")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title={t("availability.setAvailability")} onBack={() => router.back()} />
      
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.description}>
            {t("availability.setAvailabilityDescription")}
          </Text>
          
          <View style={styles.scheduleContainer}>
            {days.map((day) => (
              <View key={day.key} style={styles.dayRow}>
                <View style={styles.dayInfo}>
                  <Text style={styles.dayName}>{day.label}</Text>
                  <Switch
                    value={schedule[day.key]?.enabled ?? false}
                    onValueChange={() => toggleDay(day.key)}
                    trackColor={{ false: Colors.light.gray[300], true: Colors.light.primary + "70" }}
                    thumbColor={schedule[day.key]?.enabled ? Colors.light.primary : Colors.light.gray[100]}
                  />
                </View>
                
                {schedule[day.key].enabled && (
                  <View style={styles.timeSelectors}>
                    <Pressable
                      style={styles.timeSelector}
                      onPress={() => {
                        setActiveDayKey(day.key);
                        setIsStartTime(true);
                        
                        // Set initial values based on current time
                        const [hours, minutes] = schedule[day.key].startTime.split(':');
                        setTempHour(parseInt(hours, 10));
                        setTempMinute(parseInt(minutes, 10));
                        
                        setShowCustomTimePicker(true);
                      }}
                    >
                      <Clock size={16} color={Colors.light.gray[600]} />
                      <Text style={styles.timeText}>
                        {formatTime(schedule[day.key].startTime)}
                      </Text>
                    </Pressable>
                    
                    <Text style={styles.toText}>{t("availability.to")}</Text>
                    
                    <Pressable
                      style={styles.timeSelector}
                      onPress={() => {
                        setActiveDayKey(day.key);
                        setIsStartTime(false);
                        
                        // Set initial values based on current time
                        const [hours, minutes] = schedule[day.key].endTime.split(':');
                        setTempHour(parseInt(hours, 10));
                        setTempMinute(parseInt(minutes, 10));
                        
                        setShowCustomTimePicker(true);
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
            <Text style={styles.infoTitle}>{t("availability.howAvailabilityWorks")}</Text>
            <Text style={styles.infoText}>
              {t("availability.howAvailabilityWorksDescription1")}
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
              {isSaving ? t("availability.saving") : t("availability.saveChanges")}
            </Text>
          </Pressable>
        </View>
      </View>
      {showStartPicker && Platform.OS === "ios" && (
        <DateTimePicker
          value={createTimeDate(schedule[activeDayKey]?.startTime || "09:00")}
          mode="time"
          is24Hour={false}
          display="spinner"
          onChange={(event, date) => {
            setShowStartPicker(false);
            if (event.type === 'set' && date) {
              const hours = date.getHours().toString().padStart(2, '0');
              const minutes = date.getMinutes().toString().padStart(2, '0');
              setStartTime(activeDayKey, `${hours}:${minutes}`);
            }
          }}
        />
      )}

      {showEndPicker && Platform.OS === "ios" && (
        <DateTimePicker
          value={createTimeDate(schedule[activeDayKey]?.endTime || "17:00")}
          mode="time"
          is24Hour={false}
          display="spinner"
          onChange={(event, date) => {
            setShowEndPicker(false);
            if (event.type === 'set' && date) {
              const hours = date.getHours().toString().padStart(2, '0');
              const minutes = date.getMinutes().toString().padStart(2, '0');
              setEndTime(activeDayKey, `${hours}:${minutes}`);
            }
          }}
        />
      )}
      {renderCustomTimePicker()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  timePickerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timePickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timePickerLabel: {
    fontSize: 14,
    color: Colors.light.gray[600],
    marginBottom: 8,
  },
  timePickerScroll: {
    height: 150,
  },
  timePickerItem: {
    height: 40, // Fixed height for consistent scrolling
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePickerItemSelected: {
    backgroundColor: Colors.light.primary + '20',
    borderRadius: 8,
    padding: 10,
  },
  timePickerItemText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  timePickerItemTextSelected: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  amPmContainer: {
    marginTop: 10,
  },
  amPmButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  amPmButtonSelected: {
    backgroundColor: Colors.light.primary + '20',
  },
  amPmButtonText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  amPmButtonTextSelected: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  timePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.light.gray[200],
    paddingTop: 16,
  },
  timePickerCancel: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  timePickerCancelText: {
    fontSize: 16,
    color: Colors.light.gray[600],
  },
  timePickerConfirm: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
  },
  timePickerConfirmText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
});
