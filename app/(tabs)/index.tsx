import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Calendar as CalendarIcon, Briefcase, Euro } from "lucide-react-native";
import { useJobStore } from "@/store/job-store";
import JobCard from "@/components/JobCard";
import ActionButton from "@/components/ActionButton";
import Calendar from "@/components/Calendar";
import Colors from "@/constants/colors";
import { Job as JobType } from "@/types/job";
import { Bell } from "lucide-react-native";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { useGetJobs } from "@/app/api/jobs/getJobs";

import Job from "@/components/Job";
import { useGetCustomer } from "@/app/api/customer/getCustomer";

export default function HomeScreen() {
  const router = useRouter();
  // const jobs = useJobStore((state) => state.jobs);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [token, setToken] = useState<string | null>(null);
  const { data: jobsData } = useGetJobs();
  const { data: customerData, error: customerError } = useGetCustomer(jobsData?.data[0].customer);
  const today = new Date().toISOString().split("T")[0];

  const completedJobsCount =
    jobsData?.data?.filter((job: any) => job.status === "Completed").length ||
    0;
  const pendingJobsCount =
    jobsData?.data?.filter(
      (job: any) => job.status !== "Completed" && job.status !== "On Hold"
    ).length || 0;
  const earnings =
    jobsData?.data
      ?.filter((job: any) => job.status === "Completed")
      .reduce((acc: number, job: any) => acc + job.installation_fare, 0) || 0;

  // Only try to access SecureStore on native platforms
  useEffect(() => {
    if (Platform.OS !== "web") {
      SecureStore.getItemAsync("auth_token").then((value) => {
        setToken(value);
      });
    }
  }, []);



  if (customerError) {
    console.log("Customer Error", customerError);
  }

 


  const selectedDateJobs = jobsData?.data?.filter(
    (job: any) => job.scheduled_date?.slice(0, 10) === selectedDate
  ) || [];

  const todayJobs = jobsData?.data?.filter(
    (job: any) => job.scheduled_date === today
  );

  const upcomingJobs = (jobsData?.data || [])
    .filter((job: any) => job.scheduled_date > today)
    .slice(0, 3);

  // Calculate stats
  // const completedJobs = jobs.filter((j) => j.status === "completed").length;
  // const pendingJobs = jobs.filter((j) => j.status !== "completed").length;
  // const earnings = "€1,240"; // Mock earnings data

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const isToday = selectedDate === today;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          marginHorizontal: 16,
        }}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, Technician</Text>
          <Text style={styles.subtitle}>
            {isToday
              ? "Here's your schedule for today"
              : `Schedule for ${selectedDate}`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push("/notifications")}
        >
          <Bell size={24} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: "100%", marginBottom: 16 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Job title="Completed Jobs" number={completedJobsCount} />
            <Job title="Pending Jobs" number={pendingJobsCount} />
          </View>

          <View style={{ marginTop: 16, height: 100 }}>
            <Job title="Earnings" number={earnings} style={{ width: "100%" }} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CalendarIcon size={20} color={Colors.light.primary} />
            <Text style={styles.sectionTitle}>Schedule</Text>
          </View>

          {/* <Calendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            jobs={jobs}
          /> */}

          <Calendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            jobs={jobsData?.data || []}
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
            selectedDateJobs.map((job: JobType) => (
              <JobCard
                key={job.name}
                job={{
                  ...job,
                  customer:
                    customerData && (
                      (typeof job.customer === 'string' && job.customer === customerData.name) ||
                      (typeof job.customer === 'object' && job.customer.name === customerData.name)
                    )
                      ? customerData
                      : job.customer
                }}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <CalendarIcon size={40} color={Colors.light.gray[400]} />
              <Text style={styles.emptyText}>
                {isToday
                  ? "No jobs scheduled for today"
                  : "No jobs scheduled for this date"}
              </Text>
            </View>
          )}
        </View>

        {upcomingJobs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Jobs</Text>
            </View>

            {upcomingJobs.map((job: JobType) => (
             <JobCard
             key={job.name}
             job={{
               ...job,
               customer:
                 customerData && (
                   (typeof job.customer === 'string' && job.customer === customerData.name) ||
                   (typeof job.customer === 'object' && job.customer.name === customerData.name)
                 )
                   ? customerData
                   : job.customer
             }}
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
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
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
  },
});
