import React from "react";
import { StyleSheet, Text, View, Pressable, ScrollView, Alert, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { Stack } from "expo-router";
import { CreditCard, Plus, Trash2 } from "lucide-react-native";
import Colors from "@/constants/colors";
import Header from "@/components/Header";

export default function BankAccountsScreen() {
  const router = useRouter();
  
  // Mock data for bank accounts
  const bankAccounts = [
    {
      id: "1",
      bankName: "Chase Bank",
      accountType: "Checking",
      accountNumber: "****6789",
      isDefault: true
    },
    {
      id: "2",
      bankName: "Bank of America",
      accountType: "Savings",
      accountNumber: "****4321",
      isDefault: false
    }
  ];

  const handleDeleteAccount = (id: string) => {
    Alert.alert(
      "Remove Bank Account",
      "Are you sure you want to remove this bank account?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            // Here you would typically call your backend to delete the account
            Alert.alert("Account Removed", "The bank account has been removed successfully");
          }
        }
      ]
    );
  };

  const handleSetDefault = (id: string) => {
    // Here you would typically call your backend to set this as default
    Alert.alert("Default Updated", "This bank account is now set as your default payment method");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Bank Accounts" />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {bankAccounts.length > 0 ? (
          <View style={styles.accountsContainer}>
            {bankAccounts.map((account) => (
              <View key={account.id} style={styles.accountCard}>
                <View style={styles.accountIconContainer}>
                  <CreditCard size={24} color={Colors.light.primary} />
                </View>
                <View style={styles.accountDetails}>
                  <Text style={styles.bankName}>{account.bankName}</Text>
                  <Text style={styles.accountInfo}>
                    {account.accountType} • {account.accountNumber}
                  </Text>
                  {account.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  )}
                </View>
                <View style={styles.accountActions}>
                  {!account.isDefault && (
                    <Pressable
                      style={styles.actionButton}
                      onPress={() => handleSetDefault(account.id)}
                    >
                      <Text style={styles.actionButtonText}>Set Default</Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteAccount(account.id)}
                  >
                    <Trash2 size={16} color={Colors.light.error} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <CreditCard size={48} color={Colors.light.gray[400]} />
            <Text style={styles.emptyTitle}>No Bank Accounts</Text>
            <Text style={styles.emptyText}>
              Add a bank account to receive payments for your completed jobs
            </Text>
          </View>
        )}

        <Pressable 
          style={styles.addButton}
          onPress={() => router.push("/profile/addBank")}
        >
          <Plus size={20} color="white" />
          <Text style={styles.addButtonText}>Add New Bank Account</Text>
        </Pressable>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>About Bank Accounts</Text>
          <Text style={styles.infoText}>
            Bank accounts are used to receive payments for completed jobs. You can add multiple accounts and set one as default.
          </Text>
          <Text style={styles.infoText}>
            Your bank information is securely stored and protected.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 16,
  },
  accountsContainer: {
    marginBottom: 24,
  },
  accountCard: {
    flexDirection: "row",
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
  },
  accountIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  accountDetails: {
    flex: 1,
  },
  bankName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  accountInfo: {
    fontSize: 14,
    color: Colors.light.gray[600],
  },
  defaultBadge: {
    backgroundColor: Colors.light.primary + "20",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  defaultText: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: "500",
  },
  accountActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.light.gray[100],
  },
  actionButtonText: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: "500",
  },
  deleteButton: {
    backgroundColor: Colors.light.error + "15",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.gray[600],
    textAlign: "center",
    lineHeight: 20,
  },
  addButton: {
    flexDirection: "row",
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  infoBox: {
    backgroundColor: Colors.light.gray[100],
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.gray[600],
    marginBottom: 8,
    lineHeight: 20,
  },
});