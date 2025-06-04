import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, TextInput, Alert, SafeAreaView } from "react-native";
import { Search } from "lucide-react-native";
import { useJobStore } from "@/store/job-store";
import JobCard from "@/components/JobCard";
import ActionButton from "@/components/ActionButton";
import Colors from "@/constants/colors";

export default function JobsScreen() {
  const jobs = useJobStore((state) => state.jobs);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.customer.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scheduledJobs = filteredJobs.filter((job) => job.status === "scheduled");
  const inProgressJobs = filteredJobs.filter(
    (job) =>
      job.status === "stock_collected" ||
      job.status === "en_route" ||
      job.status === "started"
  );
  const completedJobs = filteredJobs.filter((job) => job.status === "completed");
  
  // Filter job requests (jobs with type "job_request" that haven't been accepted yet)
  const jobRequests = filteredJobs.filter(
    (job) => job.status === "pending"
  );

  const handleAcceptJob = (jobId: string) => {
    Alert.alert(
      "Accept Job",
      "Are you sure you want to accept this job?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Accept", 
          onPress: () => {
            useJobStore.getState().updateJobStatus(jobId, "scheduled");
            Alert.alert("Success", "Job has been accepted");
          }
        }
      ]
    );
  };

  const handleDeclineJob = (jobId: string) => {
    Alert.alert(
      "Decline Job",
      "Are you sure you want to decline this job?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Decline", 
          onPress: () => {
            useJobStore.getState().updateJobStatus(jobId, "declined");
            Alert.alert("Success", "Job has been declined");
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
        <Text style={styles.title}>Jobs</Text>
        </View>
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.light.gray[500]} style={styles.searchIcon} />
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
            {jobRequests.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Job Requests</Text>
                  <Text style={[styles.count, styles.requestCount]}>{jobRequests.length}</Text>
                </View>
                
                {jobRequests.map((job) => (
                  <View key={job.id} style={styles.jobRequestCard}>
                    <JobCard job={job} disableNavigation={true} />
                    <View style={styles.jobRequestActions}>
                      <ActionButton
                        title="Decline"
                        variant="outline"
                        onPress={() => handleDeclineJob(job.id)}
                        style={styles.declineButton}
                      />
                      <ActionButton
                        title="Accept"
                        variant="primary"
                        onPress={() => handleAcceptJob(job.id)}
                        style={styles.acceptButton}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}

            {scheduledJobs.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Scheduled</Text>
                  <Text style={styles.count}>{scheduledJobs.length}</Text>
                </View>
                {scheduledJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </View>
            )}

            {inProgressJobs.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>In Progress</Text>
                  <Text style={styles.count}>{inProgressJobs.length}</Text>
                </View>
                {inProgressJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </View>
            )}

            {completedJobs.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Completed</Text>
                  <Text style={styles.count}>{completedJobs.length}</Text>
                </View>
                {completedJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
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
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 16,
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
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.text,
  },
});
