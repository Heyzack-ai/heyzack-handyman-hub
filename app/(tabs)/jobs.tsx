import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Alert,
  SafeAreaView,
  Platform,
  StatusBar,
  RefreshControl,
} from "react-native";
import { Search } from "lucide-react-native";
import { useJobStore } from "@/store/job-store";
import JobCard from "@/components/JobCard";
import ActionButton from "@/components/ActionButton";
import ShimmerCard from "@/components/ShimmerCard";
import Colors from "@/constants/colors";
import { useGetJobs } from "@/app/api/jobs/getJobs";
import { useGetCustomer } from "@/app/api/customer/getCustomer";
import { useGetPendingJobs } from "@/app/api/jobs/getJobs";
import { useAcceptJob } from "@/app/api/jobs/acceptJob";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "@/src/i18n/useTranslations";

export default function JobsScreen() {
  const { t } = useTranslations();
  const jobs = useJobStore((state) => state.jobs);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { data: jobsData, isLoading, refetch: refetchJobs } = useGetJobs();

 

  const { data: requestedJobs, refetch: refetchPendingJobs } = useGetPendingJobs()
  const queryClient = useQueryClient();
  const { mutate: acceptJob } = useAcceptJob();

  const filteredJobs = (jobsData || []).filter(
    (job: any) =>
      (job.jobType || job.installation?.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.installation?.customer?.customerName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.installationAddress || job.installation?.customer?.address || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scheduledJobs = filteredJobs?.filter(
    (job: any) => job.installation?.status === "accepted" || job.response === "accepted"
  );
  const inProgressJobs = filteredJobs?.filter(
    (job: any) =>
    ["started", "in_progress", "contract_sent", "contract_signed"].includes(job?.installation?.status)
  );
  const completedJobs = filteredJobs?.filter(
    (job: any) =>
    ["job_completed", "job_approved", "customer_approved"].includes(job?.installation?.status)
  );

  // Helper to normalize job identifier across different shapes
  const getJobId = (job: any) => job?.jobId || job?.id || job?.name || "";

  // Build ID sets to prevent duplicates across sections using normalized IDs
  const scheduledIds = new Set((scheduledJobs || []).map((j: any) => getJobId(j)));
  const inProgressIds = new Set((inProgressJobs || []).map((j: any) => getJobId(j)));
  const completedIds = new Set((completedJobs || []).map((j: any) => getJobId(j)));

  // Filter requestedJobs to show only true pending requests and exclude any that already appear in other sections
  const pendingJobRequests = (requestedJobs || []).filter((job: any) => {
    const status = (job.installation?.status || job.status || "").toLowerCase();
    const response = (job.response || "").toLowerCase();

    // Treat only truly active statuses as non-pending (exclude 'assigned' from active)
    const activeStatuses = new Set(["started", "in_progress", "completed", "accepted", "contract_sent"]);

    const isPendingByStatus = status === "draft" || status === "pending" || status === "request" || status === "assigned";
    const isPendingByResponse = response === "pending" || response === "assigned";
    const isActive = activeStatuses.has(status) || response === "accepted" || response === "rejected";

    const id = getJobId(job);
    const isDuplicated = scheduledIds.has(id) || inProgressIds.has(id) || completedIds.has(id);

    // Apply search filter to pending job requests
    const matchesSearch = searchQuery === "" || 
      (job.installation?.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.installation?.customer?.customerName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.installation?.customer?.address || job.installationAddress || "").toLowerCase().includes(searchQuery.toLowerCase());

    return (isPendingByStatus || isPendingByResponse) && !isActive && !isDuplicated && matchesSearch;
  });

  // Total jobs count for empty state check
  const totalJobsCount = (filteredJobs?.length || 0) + (pendingJobRequests?.length || 0);
  


  const handleAcceptJob = (jobId: string) => {
    Alert.alert(t("home.acceptJob"), t("home.acceptJobConfirmation"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.accept"),
        onPress: () => {
          acceptJob(
            { jobId, status: "accepted" },
            {
              onSuccess: () => {
                // Invalidate queries to refetch data AFTER mutation succeeds
                queryClient.invalidateQueries({ queryKey: ["get-jobs"] });
                queryClient.invalidateQueries({ queryKey: ["get-pending-jobs"] });
                Alert.alert(t("common.success"), t("home.jobAccepted"));
              },
              onError: (error) => {
                Alert.alert(t("common.error"), t("home.failedToAcceptJob"));
                console.error("Accept job error:", error);
              },
            }
          );
        },
      },
    ]);
  };

  const handleDeclineJob = (jobId: string) => {
    Alert.alert(t("home.declineJob"), t("home.declineJobConfirmation"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.decline"),
        onPress: () => {
          acceptJob(
            { jobId, status: "rejected" },
            {
              onSuccess: () => {
                // Invalidate queries to refetch data AFTER mutation succeeds
                queryClient.invalidateQueries({ queryKey: ["get-jobs"] });
                queryClient.invalidateQueries({ queryKey: ["get-pending-jobs"] });
                Alert.alert(t("common.success"), t("home.jobDeclined"));
              },
              onError: (error) => {
                Alert.alert(t("common.error"), t("home.failedToDeclineJob"));
                console.error("Decline job error:", error);
              },
            }
          );
        },
      },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchJobs(),
        refetchPendingJobs(),
      ]);
      queryClient.invalidateQueries({ queryKey: ["get-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["get-pending-jobs"] });
    } catch (error) {
      console.error("Error refreshing jobs:", error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("jobs.Jobs")}</Text>
      </View>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
      >
        <View style={styles.searchContainer}>
          <Search
            size={20}
            color={Colors.light.gray[500]}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={t("jobs.searchJobs")}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.light.gray[500]}
          />
        </View>

        {isLoading ? (
          // Show shimmer loading state
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t("jobs.loadingJobs")}</Text>
            </View>
            <ShimmerCard height={120} />
            <ShimmerCard height={120} />
            <ShimmerCard height={120} />
            <ShimmerCard height={120} />
          </View>
        ) : totalJobsCount === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t("jobs.noJobs")}</Text>
            <Text style={styles.emptyText}>
              {t("jobs.noJobsText")}
            </Text>
          </View>
        ) : (
          <>
            {pendingJobRequests?.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{t("jobs.jobRequests")}</Text>
                  <Text style={[styles.count, styles.requestCount]}>
                    {pendingJobRequests.length}
                  </Text>
                </View>

                {pendingJobRequests.map((job: any) => {
                  const id = getJobId(job);
                  return (
                  <View key={id} style={styles.jobRequestCard}>
                    <JobCard
                      job={{
                        id: id,
                        name: id,
                        title: job.installation?.title || t("jobs.untitledJob"),
                        description: job.installation?.description || t("jobs.noDescriptionAvailable"),
                        scheduled_date: job.scheduledDate || job.installation?.scheduledDate || "",
                        status: job.installation?.status || job.status || "pending",
                        customer: {
                          id: id,
                          name: job.installation?.customer?.customerName || t("jobs.unknownCustomer"),
                          customer_name: job.installation?.customer?.customerName || t("jobs.unknownCustomer"),
                          phone: job.installation?.customer?.phone || job.customerPhone || "",
                          email: job.installation?.customer?.email || "",
                          address: job.installation?.customer?.address || job.installationAddress || t("jobs.noAddressProvided")
                        },
                        installation: job.installation || {},
                        products: job.installation?.products || [],
                        partner: job.installation?.partner || t("jobs.unknownPartner"),
                        duration: job.estimatedDuration || "",
                        rating: 0,
                        completion_photos: [],
                        notes: [],
                        contractsent: false,
                        type: "job_request",
                        scheduledTime: job.scheduledTime || "",
                        installationPhotos: []
                      }}
                      disableNavigation={true}
                    />
                    <View style={styles.jobRequestActions}>
                      <ActionButton
                        title={t("jobs.decline")}
                        variant="outline"
                        onPress={() => handleDeclineJob(id)}
                        style={styles.declineButton}
                      />
                      <ActionButton
                        title={t("jobs.accept")}
                        variant="primary"
                        onPress={() => handleAcceptJob(id)}
                        style={styles.acceptButton}
                      />
                    </View>
                  </View>
                );})}
              </View>
            )}

            {scheduledJobs?.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{t("jobs.scheduled")}</Text>
                  <Text style={styles.count}>{scheduledJobs.length}</Text>
                </View>
                {scheduledJobs.map((job: any) => (
                  <JobCard
                    key={job.jobId}
                    job={{
                      id: job.id,
                      name: job.jobId,
                      title: job.jobType || job.installation?.title || "Untitled Job",
                      description: job.jobDescription || job.installation?.description || "No description available",
                      scheduled_date: job.scheduledDate || job.installation?.scheduledDate || "",
                      scheduledTime: job.scheduledTime || "",
                      status: job.installation?.status || "scheduled",
                      duration: job.estimatedDuration || "",
                      customer: {
                        id: job.jobId,
                        name: job.installation?.customer?.customerName || "Unknown Customer",
                        customer_name: job.installation?.customer?.customerName || "Unknown Customer",
                        phone: job.installation?.customer?.phone || job.customerPhone || "",
                        email: job.installation?.customer?.email || "",
                        address: job.installation?.customer?.address || job.installationAddress || "No address provided"
                      },
                      installation: job.installation || {},
                      products: job.installation?.products || [],
                      partner: job.installation?.partner?.partnerName || "Unknown Partner",
                      rating: 0,
                      completion_photos: [],
                      notes: [],
                      contractsent: false,
                      type: "booked_installation",
                      installationPhotos: []
                    }}
                  />
                ))}
              </View>
            )}

            {inProgressJobs?.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{t("jobs.inProgress")}</Text>
                  <Text style={styles.count}>{inProgressJobs.length}</Text>
                </View>
                {inProgressJobs.map((job: any) => (
                  <JobCard
                    key={job.jobId}
                    job={{
                      id: job.id,
                      name: job.jobId,
                      title: job.jobType || job.installation?.title || "Untitled Job",
                      description: job.jobDescription || job.installation?.description || "No description available",
                      scheduled_date: job.scheduledDate || job.installation?.scheduledDate || "",
                      scheduledTime: job.scheduledTime || "",
                      status: job.installation?.status || "in_progress",
                      duration: job.estimatedDuration || "",
                      customer: {
                        id: job.jobId,
                        name: job.installation?.customer?.customerName || "Unknown Customer",
                        customer_name: job.installation?.customer?.customerName || "Unknown Customer",
                        phone: job.installation?.customer?.phone || job.customerPhone || "",
                        email: job.installation?.customer?.email || "",
                        address: job.installation?.customer?.address || job.installationAddress || "No address provided"
                      },
                      products: job.installation?.products || [],
                      installation: job.installation || {},
                      partner: job.installation?.partner?.partnerName || "Unknown Partner",
                      rating: 0,
                      completion_photos: [],
                      notes: [],
                      contractsent: false,
                      type: "booked_installation",
                      installationPhotos: []
                    }}
                  />
                ))}
              </View>
            )}

            {completedJobs?.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{t("jobs.completed")}</Text>
                  <Text style={styles.count}>{completedJobs.length}</Text>
                </View>
                {completedJobs.map((job: any) => (
                  <JobCard
                    key={job.jobId}
                    job={{
                      id: job.id,
                      name: job.jobId,
                      title: job.jobType || job.installation?.title || "Untitled Job",
                      description: job.jobDescription || job.installation?.description || "No description available",
                      scheduled_date: job.scheduledDate || job.installation?.scheduledDate || "",
                      scheduledTime: job.scheduledTime || "",
                      status: job.installation?.status || "completed",
                      duration: job.estimatedDuration || "",
                      customer: {
                        id: job.jobId,
                        name: job.installation?.customer?.customerName || "Unknown Customer",
                        customer_name: job.installation?.customer?.customerName || "Unknown Customer",
                        phone: job.installation?.customer?.phone || job.customerPhone || "",
                        email: job.installation?.customer?.email || "",
                        address: job.installation?.customer?.address || job.installationAddress || "No address provided"
                      },
                      products: job.installation?.products || [],
                      installation: job.installation || {},
                      partner: job.installation?.partner || "Unknown Partner",
                      rating: 0,
                      completion_photos: [],
                      notes: [],
                      contractsent: false,
                      type: "booked_installation",
                      installationPhotos: []
                    }}
                  />
                ))}
              </View>
            )}
          </>
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
    paddingBottom: 80,
    marginTop: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: Colors.light.text,
    fontSize: 16,
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
  requestCount: {
    backgroundColor: "#FF9500", // Orange color for job requests
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 32,
    marginTop: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.gray[600],
    textAlign: "center",
  },
  jobRequestCard: {
    marginBottom: 16,
  },
  jobRequestActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    gap: 12,
  },
  declineButton: {
    flex: 1,
  },
  acceptButton: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.text,
  },
});
