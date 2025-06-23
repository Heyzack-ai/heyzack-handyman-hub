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
} from "react-native";
import { Search } from "lucide-react-native";
import { useJobStore } from "@/store/job-store";
import JobCard from "@/components/JobCard";
import ActionButton from "@/components/ActionButton";
import Colors from "@/constants/colors";
import { useGetJobs } from "@/app/api/jobs/getJobs";
import { useGetCustomer } from "@/app/api/customer/getCustomer";
import { useGetPendingJobs } from "@/app/api/jobs/getJobs";
import { useAcceptJob } from "@/app/api/jobs/acceptJob";
import { useQueryClient } from "@tanstack/react-query";

export default function JobsScreen() {
  const jobs = useJobStore((state) => state.jobs);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: jobsData } = useGetJobs();
  const { data: customerData, error: customerError } = useGetCustomer(
    jobsData?.data[0].customer
  );
  const { data: requestedJobs } = useGetPendingJobs()
  const queryClient = useQueryClient();
  const { mutate: acceptJob } = useAcceptJob();

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.customer.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scheduledJobs = jobsData?.data?.filter(
    (job: any) => job.status === "Scheduled"
  );
  const inProgressJobs = jobsData?.data?.filter(
    (job: any) =>
      job.status !== "Completed" && job.status !== "On Hold"
  );
  const completedJobs = jobsData?.data?.filter(
    (job: any) => job.status === "Completed"
  );

  // Filter job requests (jobs with type "job_request" that haven't been accepted yet)
  const jobRequests = jobsData?.data?.filter(
    (job: any) => job.status === "Pending"
  );

  const handleAcceptJob = (jobId: string) => {
    Alert.alert("Accept Job", "Are you sure you want to accept this job?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Accept",
        onPress: () => {
          acceptJob({ jobId, status: "accepted" });
          queryClient.invalidateQueries({ queryKey: ["get-jobs"] });
          queryClient.invalidateQueries({ queryKey: ["get-pending-jobs"] });
          Alert.alert("Success", "Job has been accepted");
        },
      },
    ]);
  };

  const handleDeclineJob = (jobId: string) => {
    Alert.alert("Decline Job", "Are you sure you want to decline this job?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Decline",
        onPress: () => {
          acceptJob({ jobId, status: "rejected" });
          queryClient.invalidateQueries({ queryKey: ["get-jobs"] });
          queryClient.invalidateQueries({ queryKey: ["get-pending-jobs"] });
          Alert.alert("Success", "Job has been declined");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Jobs</Text>
      </View>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchContainer}>
          <Search
            size={20}
            color={Colors.light.gray[500]}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs, customers, or addresses"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.light.gray[500]}
          />
        </View>

        {filteredJobs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No jobs found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your search or check back later for new jobs
            </Text>
          </View>
        ) : (
          <>
            {requestedJobs?.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Job Requests</Text>
                  <Text style={[styles.count, styles.requestCount]}>
                    {requestedJobs.length}
                  </Text>
                </View>

                {requestedJobs.map((job: any) => (
                  <View key={job.jobId} style={styles.jobRequestCard}>
                    <JobCard
                      job={{
                        id: job.jobId,
                        name: job.jobId,
                        title: job.installation?.title || "Untitled Job",
                        description: job.installation?.description || "No description available",
                        scheduled_date: job.installation?.scheduled_date || "",
                        status: "pending",
                        customer: {
                          id: job.jobId,
                          name: job.installation?.customer_name || "Unknown Customer",
                          customer_name: job.installation?.customer_name || "Unknown Customer",
                          phone: "",
                          email: "",
                          address: job.installation?.customer_address || "No address provided"
                        },
                        products: [],
                        partner: job.partner?.name || "Unknown Partner",
                        duration: "",
                        rating: 0,
                        completion_photos: [],
                        notes: [],
                        contractsent: false,
                        type: "job_request",
                        scheduledTime: ""
                      }}
                      disableNavigation={true}
                    />
                    <View style={styles.jobRequestActions}>
                      <ActionButton
                        title="Decline"
                        variant="outline"
                        onPress={() => handleDeclineJob(job.jobId)}
                        style={styles.declineButton}
                      />
                      <ActionButton
                        title="Accept"
                        variant="primary"
                        onPress={() => handleAcceptJob(job.jobId)}
                        style={styles.acceptButton}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}

            {scheduledJobs?.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Scheduled</Text>
                  <Text style={styles.count}>{scheduledJobs.length}</Text>
                </View>
                {scheduledJobs.map((job: any) => (
                  <JobCard
                    key={job.name}
                    job={{
                      ...job,
                      customer:
                        customerData &&
                        ((typeof job.customer === "string" &&
                          job.customer === customerData.name) ||
                          (typeof job.customer === "object" &&
                            job.customer.name === customerData.name))
                          ? customerData
                          : job.customer,
                    }}
                  />
                ))}
              </View>
            )}

            {inProgressJobs?.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>In Progress</Text>
                  <Text style={styles.count}>{inProgressJobs.length}</Text>
                </View>
                {inProgressJobs.map((job: any) => (
                  <JobCard
                    key={job.name}
                    job={{
                      ...job,
                      customer:
                        customerData &&
                        ((typeof job.customer === "string" &&
                          job.customer === customerData.name) ||
                          (typeof job.customer === "object" &&
                            job.customer.name === customerData.name))
                          ? customerData
                          : job.customer,
                    }}
                  />
                ))}
              </View>
            )}

            {completedJobs?.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Completed</Text>
                  <Text style={styles.count}>{completedJobs.length}</Text>
                </View>
                {completedJobs.map((job: any) => (
                  <JobCard
                    key={job.name}
                    job={{
                      ...job,
                      customer:
                        customerData &&
                        ((typeof job.customer === "string" &&
                          job.customer === customerData.name) ||
                          (typeof job.customer === "object" &&
                            job.customer.name === customerData.name))
                          ? customerData
                          : job.customer,
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
