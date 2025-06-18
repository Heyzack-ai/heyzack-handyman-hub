import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, Pressable, ScrollView, Alert, SafeAreaView, StatusBar, Platform } from "react-native";
import { useRouter } from "expo-router";
import { CreditCard, Building, User, Globe } from "lucide-react-native";
import Colors from "@/constants/colors";
import Header from "@/components/Header";
import { useAddBank, useGetBank } from "../api/user/addBank";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

// Define the validation schema
const bankAccountSchema = z.object({
  bankName: z.string()
    .min(1, "Bank name is required")
    .regex(/^[A-Za-zÀ-ÿ\s\-']+$/, "Bank name should only contain letters, spaces, hyphens and apostrophes"),
  accountName: z.string()
    .min(1, "Account holder name is required")
    .regex(/^[A-Za-zÀ-ÿ\s\-']+$/, "Account holder name should only contain letters, spaces, hyphens and apostrophes"),
  iban: z.string()
    .min(1, "IBAN is required")
    .refine(
      val => /^FR[0-9A-Z]{25}$/.test(val.replace(/\s+/g, "")),
      "Invalid IBAN format. French IBAN should start with FR followed by 25 alphanumeric characters"
    ),
  bicSwift: z.string()
    .min(1, "BIC/SWIFT code is required")
    .regex(/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/, "Invalid BIC/SWIFT format. Should be 8 or 11 characters, e.g. BNPAFRPP or BNPAFRPPXXX")
});

// Type for form errors
type FormErrors = {
  bankName?: string;
  accountName?: string;
  iban?: string;
  bicSwift?: string;
};

export default function AddBank() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [accountType, setAccountType] = useState<"personal" | "business">("personal");
  const [accountName, setAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [iban, setIban] = useState("");
  const [bicSwift, setBicSwift] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const bankData = {
    bank_name: bankName,
    account_holder_name: accountName,
    iban_number: iban,
    bic_code: bicSwift,
    is_default: true
  };

  const { mutate, isPending } = useAddBank(bankData);

  const validateForm = (): boolean => {
    try {
      bankAccountSchema.parse({ bankName, accountName, iban, bicSwift });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        error.errors.forEach((err) => {
          const path = err.path[0] as keyof FormErrors;
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

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

  // Format IBAN as user types
  const formatIban = (text: string) => {
    // Remove all spaces first
    let cleaned = text.replace(/\s/g, '').toUpperCase();
    
    // Ensure it starts with FR
    if (!cleaned.startsWith('FR') && cleaned.length > 0) {
      cleaned = 'FR' + cleaned;
    }
    
    // Add spaces every 4 characters after the country code
    let formatted = cleaned.substring(0, 2);
    
    // Add the rest with spaces every 4 characters
    for (let i = 2; i < cleaned.length; i++) {
      if (i === 2 || (i > 2 && (i - 2) % 4 === 0)) {
        formatted += ' ';
      }
      formatted += cleaned[i];
    }
    
    return formatted.trim();
  };

  const handleIbanChange = (text: string) => {
    const formatted = formatIban(text);
    setIban(formatted);
    
    // Clear error when typing
    if (errors.iban) {
      setErrors((prev) => ({ ...prev, iban: undefined }));
    }
  };

  const handleBicSwiftChange = (text: string) => {
    const upperCaseText = text.toUpperCase();
    setBicSwift(upperCaseText);
    
    // Clear error when typing
    if (errors.bicSwift) {
      setErrors((prev) => ({ ...prev, bicSwift: undefined }));
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
      <Header title="Add Bank Account" />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Bank Name</Text>
            <TextInput
              style={[styles.input, errors.bankName && styles.inputError]}
              placeholder="Enter bank name (e.g., BNP Paribas, Société Générale)"
              value={bankName}
              onChangeText={(text) => {
                setBankName(text);
                if (errors.bankName) {
                  setErrors((prev) => ({ ...prev, bankName: undefined }));
                }
              }}
            />
            {errors.bankName && <Text style={styles.errorText}>{errors.bankName}</Text>}
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Account Holder Name</Text>
            <TextInput
              style={[styles.input, errors.accountName && styles.inputError]}
              placeholder="Enter name on account"
              value={accountName}
              onChangeText={(text) => {
                setAccountName(text);
                if (errors.accountName) {
                  setErrors((prev) => ({ ...prev, accountName: undefined }));
                }
              }}
            />
            {errors.accountName && <Text style={styles.errorText}>{errors.accountName}</Text>}
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>IBAN</Text>
            <TextInput
              style={[styles.input, errors.iban && styles.inputError]}
              placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
              value={iban}
              onChangeText={handleIbanChange}
              autoCapitalize="characters"
            />
            {errors.iban && <Text style={styles.errorText}>{errors.iban}</Text>}
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>BIC/SWIFT Code</Text>
            <TextInput
              style={[styles.input, errors.bicSwift && styles.inputError]}
              placeholder="BNPAFRPPXXX"
              value={bicSwift}
              onChangeText={handleBicSwiftChange}
              autoCapitalize="characters"
            />
            {errors.bicSwift && <Text style={styles.errorText}>{errors.bicSwift}</Text>}
          </View>
        </View>

        <View style={styles.infoBox}>
          <CreditCard size={20} color={Colors.light.primary} />
          <Text style={styles.infoText}>
            For French bank accounts, both IBAN and BIC/SWIFT code are required. Your information is securely stored and will be used for receiving payments for completed jobs.
          </Text>
        </View>

        <Pressable 
          style={[styles.submitButton, isPending && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isPending}
        >
          <Text style={styles.submitButtonText}>
            {isPending ? "Adding..." : "Add Bank Account"}
          </Text>
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
  inputError: {
    borderColor: Colors.light.error,
  },
  errorText: {
    color: Colors.light.error,
    fontSize: 12,
    marginTop: 4,
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
  submitButtonDisabled: {
    backgroundColor: Colors.light.gray[400],
  },
});
