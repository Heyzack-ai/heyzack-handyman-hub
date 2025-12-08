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
import { Eye, EyeOff } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useAuth } from "@/lib/auth-context";
import { z } from "zod";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
// Define the validation schema


// Type for form errors
type FormErrors = {
  email?: string;
  password?: string;
};

export default function SignInScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const signInSchema = z.object({
  email: z.string().email(t("auth.invalidEmail")),
  password: z.string().min(8, t("auth.passwordMinLength")),
});

  const validateForm = (): boolean => {
    try {
      signInSchema.parse({ email, password });
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

  const handleSignIn = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const res = await signIn(email, password);
      console.log("signIn response:", res);
    } catch (error: any) {
      console.error(error.response?.data || error);
      Alert.alert(
        t("auth.error"),
        error instanceof Error ? error.message : t("auth.anUnknownErrorOccurred")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push("/auth/forgot-password");
  };

  const handleSignUp = () => {
    router.push("/auth/signup");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 50 : 0}
      >
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

          <Text style={styles.title}>{t("auth.signIn")}</Text>
          <Text style={styles.subtitle}>
            {t("auth.welcomeBackPleaseSignInToContinue")}
          </Text>

          <View style={styles.form}>
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
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t("auth.password")}</Text>
              <View
                style={[
                  styles.passwordContainer,
                  errors.password && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.passwordInput}
                  placeholder={t("auth.enterYourPassword")}
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
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            <Pressable
              onPress={handleForgotPassword}
              style={styles.forgotPassword}
            >
              <Text style={styles.forgotPasswordText}>{t("auth.forgotPassword")}</Text>
            </Pressable>

            <Pressable
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? t("auth.signingIn") : t("auth.signIn")}
              </Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t("auth.dontHaveAnAccount")}</Text>
            <Pressable onPress={handleSignUp}>
              <Text style={styles.signUpText}>{t("auth.signUp")}</Text>
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
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    width: 180,
    height: 80, // Explicit height
  },
  logoText: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.light.gray[500],
  },
  appName: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.text,
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: "500",
  },
  button: {
    backgroundColor: Colors.light.primary,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
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
  signUpText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  inputError: {
    borderColor: Colors.light.error,
  },
  errorText: {
    color: Colors.light.error,
    fontSize: 12,
    marginTop: 4,
  },
});
