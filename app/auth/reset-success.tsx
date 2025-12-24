import React from "react";
import { StyleSheet, Text, View, Pressable, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { CheckCircle } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useTranslation } from "react-i18next";

export default function ResetSuccessScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const handleSignIn = () => {
    router.push("/auth/signin");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <CheckCircle size={80} color={Colors.light.success} />
          </View>
          
          <Text style={styles.title}>{t("auth.passwordResetSuccessful")}</Text>
          <Text style={styles.message}>
            {t("auth.yourPasswordHasBeenResetSuccessfullyYouCanNowSignInWithYourNewPassword")}
          </Text>
          
          <Pressable style={styles.button} onPress={handleSignIn}>
            <Text style={styles.buttonText}>{t("auth.signIn")}</Text>
          </Pressable>
        </View>
      </View>
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
    justifyContent: "center",
    padding: 24,
  },
  content: {
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: Colors.light.gray[600],
    textAlign: "center",
    marginBottom: 32,
  },
  button: {
    backgroundColor: Colors.light.primary,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});
