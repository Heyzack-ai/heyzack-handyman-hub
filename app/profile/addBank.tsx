import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, Pressable, ScrollView, Alert, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { Stack } from "expo-router";
import { CreditCard, Building, User, Globe } from "lucide-react-native";
import Colors from "@/constants/colors";
import Header from "@/components/Header";
import { useAddBank, useGetBank } from "../api/user/addBank";
import { useQueryClient } from "@tanstack/react-query";

export default function addBank() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [accountType, setAccountType] = useState<"personal" | "business">("personal");
  const [accountName, setAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [iban, setIban] = useState("");
  const [bicSwift, setBicSwift] = useState("");

  const bankData = {
    bank_name: bankName,
    account_holder_name: accountName,
    iban_number: iban,
    bic_code: bicSwift,
    is_default: true
  };
  


  const { mutate, error, isPending } = useAddBank(bankData);

  const handleSubmit = () => {
    // Validate inputs for French bank account
    if (!accountName.trim() || !iban.trim() || !bicSwift.trim() || !bankName.trim()) {
      Alert.alert("Missing Information", "Please fill in all fields");
      return;
    }

    // Here you would typically send this data to your backend
    mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["get-bank"] });
        Alert.alert("Bank Account Added", "Your bank account has been successfully added");
        router.back();
      },
      onError: (error) => {
        Alert.alert("Error", error instanceof Error ? error.message : "Failed to add bank account");
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Add Bank Account" />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Bank Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter bank name (e.g., BNP Paribas, Société Générale)"
              value={bankName}
              onChangeText={setBankName}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Account Holder Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter name on account"
              value={accountName}
              onChangeText={setAccountName}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>IBAN</Text>
            <TextInput
              style={styles.input}
              placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
              value={iban}
              onChangeText={setIban}
              autoCapitalize="characters"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>BIC/SWIFT Code</Text>
            <TextInput
              style={styles.input}
              placeholder="BNPAFRPPXXX"
              value={bicSwift}
              onChangeText={setBicSwift}
              autoCapitalize="characters"
            />
          </View>
        </View>

        <View style={styles.infoBox}>
          <CreditCard size={20} color={Colors.light.primary} />
          <Text style={styles.infoText}>
            For French bank accounts, both IBAN and BIC/SWIFT code are required. Your information is securely stored and will be used for receiving payments for completed jobs.
          </Text>
        </View>

        <Pressable 
          style={styles.submitButton}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>Add Bank Account</Text>
        </Pressable>
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
  section: {
    marginBottom: 24,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 16,
  },
   

  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.gray[700],
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: Colors.light.primary + "10",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.gray[700],
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});