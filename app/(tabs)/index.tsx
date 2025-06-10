import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Calendar as CalendarIcon, Briefcase, Euro } from "lucide-react-native";
import { useJobStore } from "@/store/job-store";
import JobCard from "@/components/JobCard";
import ActionButton from "@/components/ActionButton";
import Calendar from "@/components/Calendar";
import Colors from "@/constants/colors";
import Job from "@/components/Job";
import {Bell} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';

export default function HomeScreen() {
  const router = useRouter();
  const jobs = useJobStore((state) => state.jobs);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  
  const today = new Date().toISOString().split("T")[0];

  const token = SecureStore.getItemAsync('auth_token');
  
  // Filter jobs by selected date
  const selectedDateJobs = jobs.filter(job => job.scheduledDate === selectedDate);
  
  const todayJobs = jobs.filter(job => job.scheduledDate === today);
  
  const upcomingJobs = jobs.filter(job => {
    return job.scheduledDate > today;
  }).slice(0, 3);

  // Calculate stats
  const completedJobs = jobs.filter(j => j.status === "completed").length;
  const pendingJobs = jobs.filter(j => j.status !== "completed").length;
  const earnings = "€1,240"; // Mock earnings data

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const isToday = selectedDate === today;

  return (
    <SafeAreaView style={styles.safeArea}>
       <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginHorizontal: 16}}> 
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, Technician</Text>
          <Text style={styles.subtitle}>
            {isToday ? "Here's your schedule for today" : `Schedule for ${selectedDate}`}
          </Text>
        </View>
        <TouchableOpacity style={styles.notificationButton} onPress={() => router.push("/notifications")}>  
          <Bell size={24} color={Colors.light.primary} />
        </TouchableOpacity>
        </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

       

       

        <View style={{ width: '100%', marginBottom: 16}}>
          <View style={{flexDirection: 'row', gap: 12}}>
            <Job title="Completed Jobs" number="10" />
            <Job title="Pending Jobs" number="3" />
          </View>

          <View style={{marginTop: 16, height: 100}}>
            <Job title="Earnings" number="$300" style={{width: '100%'}} />
          </View>

        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CalendarIcon size={20} color={Colors.light.primary} />
            <Text style={styles.sectionTitle}>Schedule</Text>
          </View>
        
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            jobs={jobs}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Briefcase size={20} color={Colors.light.primary} />
            <Text style={styles.sectionTitle}>
              {isToday ? "Today's Jobs" : `Jobs for ${selectedDate}`}
            </Text>
            {selectedDateJobs.length > 0 && (
              <Text style={styles.count}>{selectedDateJobs.length}</Text>
            )}
          </View>
        
          {selectedDateJobs.length > 0 ? (
            selectedDateJobs.map((job) => <JobCard key={job.id} job={job} />)
          ) : (
            <View style={styles.emptyState}>
              <CalendarIcon size={40} color={Colors.light.gray[400]} />
              <Text style={styles.emptyText}>
                {isToday ? "No jobs scheduled for today" : "No jobs scheduled for this date"}
              </Text>
            </View>
          )}
        </View>

        {upcomingJobs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Jobs</Text>
            </View>
          
            {upcomingJobs.map((job) => (
              <JobCard 
                key={job.id} 
                job={job} 
              />
            ))}
          
            <ActionButton
              title="View All Jobs"
              variant="outline"
              onPress={() => router.push("/jobs")}
              style={styles.viewAllButton}
            />
          </View>
        )}
      </ScrollView>
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
  content: {
    paddingHorizontal: 16,
  },
  header: {
    // marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.gray[600],
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.gray[600],
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginLeft: 8,
  },
  count: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.gray[600],
    marginTop: 12,
    textAlign: "center",
  },
  viewAllButton: {
    marginTop: 12,
  },
  notificationButton: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 8,
    borderRadius: 16,
  }
});
