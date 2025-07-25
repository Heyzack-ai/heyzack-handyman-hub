import React, { useState } from "react";
import { StyleSheet, Text, View, FlatList, Pressable, Alert, SafeAreaView, StatusBar, Platform } from "react-native";
import { Stack, useRouter } from "expo-router";
import { DollarSign, CheckCircle, Clock, AlertCircle } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useJobStore } from "@/store/job-store";
import Header from "@/components/Header";
import { useTranslation } from "react-i18next";

export default function PaymentsScreen() {
  const router = useRouter();
  const { jobs } = useJobStore();
  const [activeTab, setActiveTab] = useState<"pending" | "received">("pending");
  const { t } = useTranslation();
  // Filter completed jobs
  const completedJobs = jobs.filter(job => job.status === "completed");
  
  // Mock payment data - in a real app, this would come from the backend
  const pendingPayments = completedJobs.filter(job => !job.paymentReceived);
  const receivedPayments = completedJobs.filter(job => job.paymentReceived);

  const requestPayment = (jobId: string) => {
    Alert.alert(
      t("payments.requestPayment"),
      t("payments.requestPaymentConfirmation"),
      [
        {
          text: t("payments.cancel"),
          style: "cancel"
        },
        {
          text: t("payments.request"),
          onPress: () => {
            try {
              useJobStore.getState().requestPayment(jobId);
              Alert.alert(t("payments.success"), t("payments.paymentRequestSentSuccessfully"));
            } catch (error) {
              console.error("Error requesting payment:", error);
              Alert.alert(t("payments.error"), t("payments.failedToRequestPayment"));
            }
          }
        }
      ]
    );
  };

  const renderPaymentItem = ({ item }: { item: any }) => {
    const isPending = !item.paymentReceived;
    
    return (
      <View style={styles.paymentItem}>
        <View style={styles.paymentHeader}>
          <Text style={styles.paymentTitle}>{item.title}</Text>
          <View style={[
            styles.paymentStatusBadge, 
            { backgroundColor: isPending ? Colors.light.warning + "20" : Colors.light.success + "20" }
          ]}>
            <Text style={[
              styles.paymentStatusText, 
              { color: isPending ? Colors.light.warning : Colors.light.success }
            ]}>
              {isPending ? t("payments.pending") : t("payments.received")}
            </Text>
          </View>
        </View>
        
        <Text style={styles.paymentCustomer}>{item.customer.name}</Text>
        <Text style={styles.paymentDate}>{t("payments.completedOn")} {new Date(item.completedDate || item.scheduledDate).toLocaleDateString()}</Text>
        
        <View style={styles.paymentDetails}>
          <View style={styles.paymentAmount}>
            <Text style={styles.paymentAmountText}>${item.amount || "250.00"}</Text>
          </View>
          
          {isPending && (
            <Pressable 
              style={styles.requestButton}
              onPress={() => requestPayment(item.id)}
            >
              <Text style={styles.requestButtonText}>{t("payments.requestPayment")}</Text>
            </Pressable>
          )}
          
          {!isPending && (
            <View style={styles.receivedInfo}>
              <CheckCircle size={16} color={Colors.light.success} />
              <Text style={styles.receivedText}>{t("payments.receivedOn")} {new Date(item.paymentDate || new Date()).toLocaleDateString()}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const EmptyState = ({ type }: { type: "pending" | "received" }) => (
    <View style={styles.emptyState}>
      {type === "pending" ? (
        <>
          <Clock size={48} color={Colors.light.gray[400]} />
          <Text style={styles.emptyStateTitle}>{t("payments.noPendingPayments")}</Text>
          <Text style={styles.emptyStateText}>{t("payments.allCompletedJobsHaveBeenPaid")}</Text>
        </>
      ) : (
        <>
          <AlertCircle size={48} color={Colors.light.gray[400]} />
          <Text style={styles.emptyStateTitle}>{t("payments.noPaymentsReceived")}</Text>
          <Text style={styles.emptyStateText}>{t("payments.noPaymentsReceivedText")}</Text>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
      <Header title={t("payments.payments")} />
      <Stack.Screen 
        options={{
          title: t("payments.payments"),
          headerTitleStyle: {
            fontWeight: "600",
          },
        }}
      />
      
      <View style={styles.container}>
        <View style={styles.tabContainer}>
          <Pressable 
            style={[
              styles.tab, 
              activeTab === "pending" && styles.activeTab
            ]}
            onPress={() => setActiveTab("pending")}
          >
            <Text style={[
              styles.tabText,
              activeTab === "pending" && styles.activeTabText
            ]}>
              {t("payments.pending")}
            </Text>
          </Pressable>
          <Pressable 
            style={[
              styles.tab, 
              activeTab === "received" && styles.activeTab
            ]}
            onPress={() => setActiveTab("received")}
          >
            <Text style={[
              styles.tabText,
              activeTab === "received" && styles.activeTabText
            ]}>
              {t("payments.received")}
            </Text>
          </Pressable>
        </View>
        
        <FlatList
          data={activeTab === "pending" ? pendingPayments : receivedPayments}
          renderItem={renderPaymentItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState type={activeTab} />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.gray[100],
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: Colors.light.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.gray[600],
  },
  activeTabText: {
    color: Colors.light.primary,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  paymentItem: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  paymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    flex: 1,
  },
  paymentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  paymentCustomer: {
    fontSize: 14,
    color: Colors.light.gray[700],
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 14,
    color: Colors.light.gray[600],
    marginBottom: 12,
  },
  paymentDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  paymentAmount: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentAmountText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.primary,
    marginLeft: 4,
  },
  requestButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  requestButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  receivedInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  receivedText: {
    fontSize: 14,
    color: Colors.light.success,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.light.gray[600],
    textAlign: "center",
  },
});
