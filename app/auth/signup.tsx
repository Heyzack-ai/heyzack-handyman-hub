import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Eye, EyeOff, ArrowLeft } from "lucide-react-native";
import Colors from "@/constants/colors";
import { Image } from "expo-image";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/lib/auth-context";
import { z } from "zod";
import { useTranslation } from "react-i18next";


// Define the validation schema

// Type for form errors
type FormErrors = {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
};

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { t } = useTranslation();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+33"); // Prefilled with France country code
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const signUpSchema = z.object({
  fullName: z.string().min(1, t("auth.fullNameIsRequired")),
  email: z.string().email(t("auth.pleaseEnterAValidEmailAddress")),
  phone: z.string()
    .regex(/^\+33\d{9}$/, t("auth.phoneNumberMustBe9DigitsAfterCountryCode")),
  password: z.string()
    .min(8, t("auth.passwordMustBeAtLeast8Characters"))
    .regex(/[A-Z]/, t("auth.passwordMustContainAtLeastOneUppercaseLetter"))
    .regex(/[0-9]/, t("auth.passwordMustContainAtLeastOneNumber")),
  confirmPassword: z.string().min(1, t("auth.pleaseConfirmYourPassword")),
}).refine(data => data.password === data.confirmPassword, {
  message: t("auth.passwordsDoNotMatch"),
  path: ["confirmPassword"],
});


  const validateForm = (): boolean => {
    try {
      signUpSchema.parse({ fullName, email, phone, password, confirmPassword });
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

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await signUp({
        email,
        password,
        name: fullName,
        phone,
        role: "handyman",
      });
      
      // After successful signup and signin, navigate to skills
      router.replace({
        pathname: "/auth/add-skills",
        params: {
          email,
          password,
        },
      });
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert("Error", error instanceof Error ? error.message : "An error occurred during signup");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = () => {
    router.push("/auth/signin");
  };

  // Handle phone number input with validation
  const handlePhoneChange = (text: string) => {
    // Ensure the country code remains
    if (!text.startsWith("+33")) {
      text = "+33" + text.replace(/^\+33/, "");
    }
    
    // Only allow digits after +33
    const digits = text.substring(3).replace(/\D/g, "");
    
    // Limit to 9 digits after +33
    const limitedDigits = digits.substring(0, 9);
    
    // Set the final value
    const finalValue = "+33" + limitedDigits;
    setPhone(finalValue);
    
    // Clear error when typing
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: undefined }));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 50 : 0}
      >
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </Pressable>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/logo.png")}
              style={styles.logo}
              contentFit="contain"
            />
          </View>

          <Text style={styles.title}>{t("auth.createAccount")}</Text>
          <Text style={styles.subtitle}>
            {t("auth.signUpToStartManagingYourServiceJobs")}
          </Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t("auth.fullName")}</Text>
              <TextInput
                style={[styles.input, errors.fullName && styles.inputError]}
                placeholder={t("auth.enterYourFullName")}
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (errors.fullName) {
                    setErrors((prev) => ({ ...prev, fullName: undefined }));
                  }
                }}
                autoCapitalize="words"
              />
              {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t("auth.email")}</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder={t("auth.enterYourEmail")}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) {
                    setErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>{t("auth.contactNumber")}</Text>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                placeholder={t("auth.enterYourContactNumber")}
                value={phone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
              />
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
             
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t("auth.password")}</Text>
              <View style={[styles.passwordContainer, errors.password && styles.inputError]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder={t("auth.createAPassword")}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={Colors.light.gray[500]} />
                  ) : (
                    <Eye size={20} color={Colors.light.gray[500]} />
                  )}
                </Pressable>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t("auth.confirmPassword")}</Text>
              <View style={[styles.passwordContainer, errors.confirmPassword && styles.inputError]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder={t("auth.confirmYourPassword")}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) {
                      setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <Pressable
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color={Colors.light.gray[500]} />
                  ) : (
                    <Eye size={20} color={Colors.light.gray[500]} />
                  )}
                </Pressable>
              </View>
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>

            <Pressable
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? t("auth.creatingAccount") : t("auth.createAccount")}
              </Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t("auth.alreadyHaveAnAccount")}</Text>
            <Pressable onPress={handleSignIn}>
              <Text style={styles.signInText}>{t("auth.signIn")}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
  },
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  backButton: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
    height: 80, // Explicit height
  },
  logo: {
    width: 180,
    height: 80, // Explicit height
  },
  logoText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.light.gray[500],
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.gray[600],
    marginBottom: 32,
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: "white",
  },
  inputError: {
    borderColor: Colors.light.error || 'red',
  },
  errorText: {
    color: Colors.light.error || 'red',
    fontSize: 12,
    marginTop: 4,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    height: 56,
    backgroundColor: "white",
  },
  passwordInput: {
    flex: 1,
    height: 56,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.light.text,
  },
  eyeIcon: {
    padding: 16,
  },
  button: {
    backgroundColor: Colors.light.primary,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: Colors.light.gray[400],
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: Colors.light.gray[600],
    marginRight: 4,
  },
  signInText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  helperText: {
    fontSize: 12,
    color: Colors.light.gray[500],
    marginTop: 4,
  },
});
