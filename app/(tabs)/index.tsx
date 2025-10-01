import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Platform,
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
import { useQuery, useQueries } from "@tanstack/react-query";
import { useGetJobs } from "@/app/api/jobs/getJobs";
import { useGetCustomer } from "@/app/api/customer/getCustomer";
import ShimmerSkeleton from "@/components/ShimmerSkeleton";
import { useGetPendingJobs } from "@/app/api/jobs/getJobs";
import { useTranslations } from "@/src/i18n/useTranslations";
import { useGetNotificationCount } from "@/app/api/notifications/getNotifications";

import Job from "@/components/Job";

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslations();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [token, setToken] = useState<string | null>(null);
  const { data: jobsData, isLoading } = useGetJobs();
  const { data: pendingJobs } = useGetPendingJobs();
  const { data: notificationCount } = useGetNotificationCount();

  const today = new Date().toISOString().split("T")[0];

  // Get unique customer codes that need to be fetched
  const customerCodes = useMemo(() => {
    if (!jobsData) return [];
    return jobsData
      .map((job: JobType) => job.customer)
      .filter((customer: JobType['customer'], index: number, arr: JobType['customer'][]) => 
        customer && typeof customer === 'string' && arr.indexOf(customer) === index
      );
  }, [jobsData]);

  // Fetch customer data for all unique customers
  const customerQueries = useQueries({
    queries: customerCodes.map((customerCode: string) => ({
      queryKey: ['customer', customerCode],
      queryFn: async () => {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) throw new Error("Authentication token not found");
        
        const axios = require('axios');
        const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
        const searchParams = new URLSearchParams();
        searchParams.append('filter', `[["name", "=", "${customerCode}"]]`);
        searchParams.append('fields', JSON.stringify(['name', 'phone', 'email', 'address', 'customer_name']));
        
        const response = await axios.get(`${BASE_URL}/erp/resource/Heyzack Customer?${searchParams.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        return response.data?.data?.[0] || null;
      },
      enabled: !!customerCode,
    })),
  });

  // Create a map of customer codes to customer data
  const customersMap = useMemo(() => {
    const map = new Map();
    customerQueries.forEach((query, index) => {
      if (query.data) {
        map.set(customerCodes[index], query.data);
      }
    });
    return map;
  }, [customerQueries, customerCodes]);

  // Helper function to get customer data for a specific job
  const getCustomerForJob = (job: any) => {
    // Prefer installation.customer if available
    if (job.installation?.customer) {
      const c = job.installation.customer;
      return {
        id: c.id || job.jobId || job.name || "",
        name: c.customerName || c.name || job.customer,
        customer_name: c.customerName || c.name || `Customer ${job.customer ?? ""}`,
        phone: c.phone || job.customerPhone || '',
        email: c.email || '',
        address: c.address || job.installationAddress || ''
      };
    }
    // If job.customer is already an object with customer data, return it
    if (job.customer && typeof job.customer === 'object' && job.customer.customer_name) {
      return job.customer;
    }
    
    // If job has customer_name directly, use it
    if (job.customer_name) {
      return {
        name: job.customer,
        customer_name: job.customer_name,
        phone: job.customer_phone || '',
        email: job.customer_email || '',
        address: job.customer_address || ''
      };
    }
    
    // If we have fetched customer data for this customer code, use it
    if (job.customer && typeof job.customer === 'string' && customersMap.has(job.customer)) {
      return customersMap.get(job.customer);
    }
    
    // Fallback to basic customer object
    return {
      name: job.customer ?? '',
      customer_name: job.customer ? `Customer ${job.customer}` : t("jobs.unknownCustomer"),
      phone: '',
      email: '',
      address: ''
    };
  };

  // Normalize API job shape to UI Job type
  const normalizeJob = (job: any): JobType => {
    const customer = getCustomerForJob(job);
    return {
      installation: job.installation || {},
      installationPhotos: job.installationPhotos || [],
      id: job.id || job.jobId || job.name || "",
      name: job.name || job.jobId || job.id || "",
      title: job.title || job.jobType || job.installation?.title || t("jobs.untitledJob"),
      description: job.description || job.jobDescription || job.installation?.description || t("jobs.noDescriptionAvailable"),
      status: (job.status || job.installation?.status || "pending") as JobType["status"],
      scheduled_date: job.scheduled_date || job.scheduledDate || job.installation?.scheduledDate || "",
      scheduledTime: job.scheduledTime || "",
      duration: job.duration || job.estimatedDuration || "",
      customer,
      products: job.products || job.installation?.products || [],
      notes: job.notes || [],
      completion_photos: job.completion_photos || [],
      contractsent: job.contractsent || false,
      rating: job.rating,
      type: (job.type || (job.installation ? "booked_installation" : "job_request")) as JobType["type"],
      paymentRequested: job.paymentRequested,
      paymentReceived: job.paymentReceived,
      paymentDate: job.paymentDate,
      amount: job.amount,
      completedDate: job.completedDate,
      partner: job.installation?.partner?.partnerName || job.partner?.partnerName || job.partner || "",
    } as JobType;
  };
  const completedJobsCount =
    (jobsData || [])?.filter((job: any) => job.status === "completed").length ||
    0;
  const pendingJobsCount =
    (jobsData || [])?.filter(
      (job: any) => job.status !== "completed" && job.status !== "on_hold"
    ).length || 0;
  const earnings =
    (jobsData || [])
      ?.filter((job: any) => job.status === "completed")
      .reduce((acc: number, job: any) => acc + (job.installation_fare || 0), 0) || 0;

  // Only try to access SecureStore on native platforms
  useEffect(() => {
    if (Platform.OS !== "web") {
      SecureStore.getItemAsync("auth_token").then((value) => {
        setToken(value);
      });
    }
  }, []);

  const selectedDateJobs = (jobsData || [])?.filter((job: any) => {
    const dateStr =
      job?.scheduled_date?.slice(0, 10) ||
      job?.scheduledDate?.slice(0, 10) ||
      job?.installation?.scheduledDate?.slice(0, 10);
    return dateStr === selectedDate;
  }) || [];

  const todayJobs = (jobsData || [])?.filter((job: any) => {
    const dateStr =
      job?.scheduled_date?.slice(0, 10) ||
      job?.scheduledDate?.slice(0, 10) ||
      job?.installation?.scheduledDate?.slice(0, 10);
    return dateStr === today;
  });

  const upcomingJobs = (jobsData || [])
    .filter((job: any) => {
      const dateStr =
        job?.scheduled_date?.slice(0, 10) ||
        job?.scheduledDate?.slice(0, 10) ||
        job?.installation?.scheduledDate?.slice(0, 10) || "";
      return dateStr > today;
    })
    .slice(0, 3);

  // Calculate stats
  // const completedJobs = jobs.filter((j) => j.status === "completed").length;
  // const pendingJobs = jobs.filter((j) => j.status !== "completed").length;
  // const earnings = "€1,240"; // Mock earnings data

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const isToday = selectedDate === today;

  // Show shimmer loading state while data is loading
  if (isLoading) {
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
                ? t("home.headerSubtitle")
                : t("home.scheduleFor", { date: selectedDate })}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push("/notifications")}
          >
            <Bell size={24} color={Colors.light.primary} />
            {(notificationCount?.unread ?? 0) > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {Math.min(notificationCount?.unread ?? 0, 99)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <ShimmerSkeleton />
      </SafeAreaView>
    );
  }

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
          <Text style={styles.greeting}>{t("home.headerTitle")}</Text>
          <Text style={styles.subtitle}>
            {isToday
              ? t("home.headerSubtitle")
              : t("home.scheduleFor", { date: selectedDate })}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push("/notifications")}
        >
          <Bell size={24} color={Colors.light.primary} />
          {(notificationCount?.unread ?? 0) > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {Math.min(notificationCount?.unread ?? 0, 99)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: "100%", marginBottom: 16 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Job title={t("home.completedJobs")} number={completedJobsCount} />
            <Job title={t("home.pendingJobs")} number={pendingJobsCount} />
          </View>

          <View style={{ marginTop: 16, height: 100 }}>
            <Job title={t("home.earnings")} number={earnings} style={{ width: "100%" }} />
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
            jobs={[...(jobsData || []), ...(pendingJobs || [])]}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Briefcase size={20} color={Colors.light.primary} />
            <Text style={styles.sectionTitle}>
              {isToday ? t("home.today") : t("home.scheduleFor", { date: selectedDate })}
            </Text>
            {selectedDateJobs.length > 0 && (
              <Text style={styles.count}>{selectedDateJobs.length}</Text>
            )}
          </View>

          {selectedDateJobs.length > 0 ? (
            selectedDateJobs.map((job: any) => (
              <JobCard key={job.name || job.jobId || job.id} job={normalizeJob(job)} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <CalendarIcon size={40} color={Colors.light.gray[400]} />
              <Text style={styles.emptyText}>
                {isToday
                  ? t("home.noJobsToday")
                  : t("home.noJobsForDate", { date: selectedDate })}
              </Text>
            </View>
          )}
        </View>

        {upcomingJobs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t("home.upcomingJobs")}</Text>
            </View>

            {upcomingJobs.map((job: any) => (
              <JobCard key={job.name || job.jobId || job.id} job={normalizeJob(job)} />
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
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    right: -4,
    top: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.light.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: Colors.light.white,
    fontSize: 11,
    fontWeight: '700',
  },
});
