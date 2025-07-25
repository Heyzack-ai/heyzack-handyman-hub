import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, Pressable, ScrollView, Alert, SafeAreaView, ActivityIndicator, Platform, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { CreditCard, Plus, Trash2 } from "lucide-react-native";
import Colors from "@/constants/colors";
import Header from "@/components/Header";
import { useGetBank, useDeleteBank, useAddBank, useSetDefaultBank } from "@/app/api/user/addBank";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

export default function BankAccountsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: bankData, isLoading } = useGetBank();
  const { mutate: deleteBank } = useDeleteBank();
  const queryClient = useQueryClient();
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);

  console.log("bankData from bankAccounts", bankData);

  useEffect(() => {
    if (bankData && bankData.data && Array.isArray(bankData.data.bank_details)) {
      setBankAccounts([]);
      bankData.data.bank_details.forEach((bank: any, idx: number) => {
        setBankAccounts(prev => [...prev, {
          id: bank.id || bank.iban_number || `${bank.bank_name}-${bank.iban_number}-${prev.length}`,
          bankName: bank.bank_name || "",
          accountType: bank.type || "",
          accountNumber: bank.iban_number || "",
          isDefault: !!bank.is_default,
          accountName: bank.account_holder_name || "",
          bicCode: bank.bic_code || ""
        }]);
      });
    }
  }, [bankData]);

  const handleDeleteAccount = (account: any) => {
    Alert.alert(
      t("bankAccounts.removeBankAccount"),
      t("bankAccounts.removeBankAccountConfirmation"),
      [
        {
          text: t("bankAccounts.cancel"),
          style: "cancel"
        },
        {
          text: t("bankAccounts.remove"),
          style: "destructive",
          onPress: () => {
            deleteBank({
              bankName: account.bankName,
              accountName: account.accountName,
              accountNumber: account.accountNumber,
              bicCode: account.bicCode,
              accountType: account.accountType
            }, {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["get-bank"] });
                setBankAccounts(prev => prev.filter(bank => 
                  bank.bankName !== account.bankName ||
                  bank.accountName !== account.accountName ||
                  bank.accountNumber !== account.accountNumber ||
                  bank.bicCode !== account.bicCode ||
                  bank.accountType !== account.accountType
                ));
                Alert.alert(t("bankAccounts.success"), t("bankAccounts.bankAccountRemovedSuccessfully"));
              },
              onError: (error) => {
                Alert.alert(t("bankAccounts.error"), t("bankAccounts.failedToRemoveBankAccount"));
              }
            });
          }
        }
      ]
    );
  };

  const { mutate: setDefaultBank } = useSetDefaultBank();

  const handleSetDefault = (account: any) => {
    setDefaultBank(account, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["get-bank"] });
      },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
      <Header title={t("bankAccounts.bankAccounts")} />
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>{t("bankAccounts.loadingBankAccounts")}</Text>
        </View>
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          {bankAccounts.length > 0 ? (
            <View style={styles.accountsContainer}>
              {bankAccounts.map((account, idx) => (
                <View key={`account-${account.id || account.accountNumber || ''}-${idx}`} style={styles.accountCard}>
                  <View style={styles.accountIconContainer}>
                    <CreditCard size={24} color={Colors.light.primary} />
                  </View>
                  <View style={styles.accountDetails}>
                    <Text style={styles.bankName}>{account.bankName || "Unknown Bank"}</Text>
                    <Text style={styles.accountInfo}>
                      {account.accountType || "Account"} • {account.accountNumber || "No account number"}
                    </Text>
                    {account.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultText}>{t("bankAccounts.default")}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.accountActions}>
                    {!account.isDefault && (
                      <Pressable
                        style={styles.actionButton}
                        onPress={() => handleSetDefault(account)}
                      >
                        <Text style={styles.actionButtonText}>{t("bankAccounts.setDefault")}</Text>
                      </Pressable>
                    )}
                    <Pressable
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteAccount(account)}
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
              <Text style={styles.emptyTitle}>{t("bankAccounts.noBankAccounts")}</Text>
              <Text style={styles.emptyText}>
                {t("bankAccounts.noBankAccountsText")}
              </Text>
            </View>
          )}

          <Pressable 
            style={styles.addButton}
            onPress={() => router.push("/profile/addBank")}
          >
            <Plus size={20} color="white" />
            <Text style={styles.addButtonText}>{t("bankAccounts.addBankAccount")}</Text>
          </Pressable>

          <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>{t("bankAccounts.aboutBankAccounts")}</Text>
            <Text style={styles.infoText}>
              {t("bankAccounts.aboutBankAccountsText")}
            </Text>
            <Text style={styles.infoText}>
              {t("bankAccounts.aboutBankAccountsText2")}
            </Text>
          </View>
        </ScrollView>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.text,
    marginTop: 10,
  },
});
