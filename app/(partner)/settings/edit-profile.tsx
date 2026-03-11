import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Building2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Save,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { authClient } from "@/lib/auth-client";
import { getPartnerProfile, updatePartnerProfile } from "@/lib/api/partner-api";

interface CompanyData {
  name: string;
  address: string;
  phone: string;
  email: string;
}

export default function PartnerSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const [companyData, setCompanyData] = useState<CompanyData>({
    name: "",
    address: "",
    phone: "",
    email: "",
  });
  const [initialCompanyData, setInitialCompanyData] = useState<CompanyData>({
    name: "",
    address: "",
    phone: "",
    email: "",
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const profile: any = await getPartnerProfile();
        const initial = {
          name: profile?.name || profile?.companyName || "",
          address: profile?.address || "",
          phone: profile?.phone || "",
          email: profile?.email || "",
        };
        setCompanyData(initial);
        setInitialCompanyData(initial);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        Alert.alert(
          t("common.error", "Error"),
          t("toastMessages.failedLoadProfile", "Failed to load profile")
        );
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [t]);

  const hasProfileChanges = useMemo(() => {
    return (
      companyData.name !== initialCompanyData.name ||
      companyData.phone !== initialCompanyData.phone ||
      companyData.address !== initialCompanyData.address
    );
  }, [companyData, initialCompanyData]);

  const handleSave = async () => {
    try {
      if (!hasProfileChanges) {
        Alert.alert(t("common.info", "Info"), t("settings.noChanges", "No changes to save"));
        return;
      }

      setIsSavingProfile(true);
      await updatePartnerProfile({
        name: companyData.name,
        phone: companyData.phone,
        address: companyData.address,
      });

      const updatedInitial = {
        name: companyData.name,
        phone: companyData.phone,
        address: companyData.address,
        email: companyData.email,
      };
      setInitialCompanyData(updatedInitial);

      Alert.alert(
        t("common.success", "Success"),
        t("settings.saveSuccess", "Profile updated successfully")
      );
    } catch (error) {
      console.error(error);
      Alert.alert(
        t("common.error", "Error"),
        t("settings.general.saveError", "Failed to update profile")
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const validatePasswordForm = () => {
    const { oldPassword, newPassword, confirmPassword } = passwords;

    if (!oldPassword.trim()) {
      Alert.alert(
        t("common.error", "Error"),
        t("settings.general.changePassword.validation.oldPasswordRequired", "Old password is required")
      );
      return false;
    }

    if (!newPassword.trim()) {
      Alert.alert(
        t("common.error", "Error"),
        t("settings.general.changePassword.validation.newPasswordRequired", "New password is required")
      );
      return false;
    }

    if (newPassword.length < 8) {
      Alert.alert(
        t("common.error", "Error"),
        t("settings.general.changePassword.validation.passwordTooShort", "Password must be at least 8 characters")
      );
      return false;
    }

    if (!confirmPassword.trim()) {
      Alert.alert(
        t("common.error", "Error"),
        t("settings.general.changePassword.validation.confirmPasswordRequired", "Please confirm your new password")
      );
      return false;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        t("common.error", "Error"),
        t("settings.general.changePassword.validation.passwordsDoNotMatch", "New passwords do not match")
      );
      return false;
    }

    if (oldPassword === newPassword) {
      Alert.alert(
        t("common.error", "Error"),
        t("settings.general.changePassword.validation.samePassword", "New password must be different")
      );
      return false;
    }

    return true;
  };

  const resetPasswordForm = () => {
    setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleTogglePasswordFields = () => {
    const next = !showPasswordFields;
    setShowPasswordFields(next);
    if (!next) {
      resetPasswordForm();
    }
  };

  const handleUpdatePassword = async () => {
    if (!validatePasswordForm()) return;

    setIsUpdatingPassword(true);
    try {
      const { oldPassword, newPassword } = passwords;
      const changeFn = (authClient as any)?.changePassword;

      if (typeof changeFn !== "function") {
        Alert.alert(
          t("common.error", "Error"),
          t("settings.general.changePassword.errors.updateFailed", "Password change is not available")
        );
        return;
      }

      const result = await changeFn({
        currentPassword: oldPassword,
        newPassword,
      });

      if (result?.error) {
        Alert.alert(
          t("common.error", "Error"),
          result.error.message ||
            t("settings.general.changePassword.errors.updateFailed", "Failed to update password")
        );
        return;
      }

      Alert.alert(
        t("common.success", "Success"),
        t("settings.general.changePassword.success.passwordUpdated", "Password updated successfully")
      );
      setShowPasswordFields(false);
      resetPasswordForm();
    } catch (error: any) {
      console.error("Password update error:", error);
      const msg = String(error?.message || "").toLowerCase();

      if (msg.includes("current password") || msg.includes("incorrect")) {
        Alert.alert(
          t("common.error", "Error"),
          t("settings.general.changePassword.errors.incorrectOldPassword", "Current password is incorrect")
        );
      } else if (msg.includes("network") || msg.includes("fetch")) {
        Alert.alert(
          t("common.error", "Error"),
          t("settings.general.changePassword.errors.networkError", "Network error. Please try again")
        );
      } else {
        Alert.alert(
          t("common.error", "Error"),
          error?.message ||
            t("settings.general.changePassword.errors.updateFailed", "Failed to update password")
        );
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={() => router.replace("/(partner)/settings")}
            style={styles.backBtn}
          >
            <ArrowLeft size={18} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{t("settings.profile", "Edit Profile")}</Text>
        </View>
        <Text style={styles.description}>{t("settings.description", "Manage your account settings")}</Text>
      </View>

      {isLoadingProfile ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.light.primary} />
          <Text style={styles.loadingText}>{t("common.loading", "Loading...")}</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t("settings.tabs.general", "General")}</Text>

            <View style={styles.innerCard}>
              <View style={styles.sectionHeader}>
                <Building2 size={18} color={Colors.light.gray[700]} />
                <Text style={styles.sectionTitle}>
                  {t("settings.general.companyProfile.title", "Company Profile")}
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t("settings.general.companyProfile.companyName", "Company Name")}</Text>
                <TextInput
                  style={styles.input}
                  value={companyData.name}
                  onChangeText={(text) => setCompanyData((prev) => ({ ...prev, name: text }))}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t("settings.general.companyProfile.email", "Email")}</Text>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={companyData.email}
                  editable={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t("settings.general.companyProfile.address", "Address")}</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  multiline
                  value={companyData.address}
                  onChangeText={(text) => setCompanyData((prev) => ({ ...prev, address: text }))}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t("settings.general.companyProfile.phone", "Phone")}</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="phone-pad"
                  value={companyData.phone}
                  onChangeText={(text) => setCompanyData((prev) => ({ ...prev, phone: text }))}
                />
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.primaryButton, isSavingProfile && styles.buttonDisabled]}
                  disabled={isSavingProfile}
                  onPress={handleSave}
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 size={16} color="white" />
                      <Text style={styles.primaryButtonText}>{t("common.loading", "Saving...")}</Text>
                    </>
                  ) : (
                    <>
                      <Save size={16} color="white" />
                      <Text style={styles.primaryButtonText}>{t("settings.saveChanges", "Save Changes")}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.innerCard}>
              <View style={styles.sectionHeaderRowBetween}>
                <View style={styles.sectionHeader}>
                  <KeyRound size={18} color={Colors.light.gray[700]} />
                  <Text style={styles.sectionTitle}>{t("settings.general.security.title", "Security")}</Text>
                </View>

                <TouchableOpacity style={styles.secondaryButton} onPress={handleTogglePasswordFields}>
                  <KeyRound size={14} color={Colors.light.text} />
                  <Text style={styles.secondaryButtonText}>
                    {showPasswordFields
                      ? t("common.hide", "Hide")
                      : t("settings.general.resetPassword.button", "Change Password")}
                  </Text>
                </TouchableOpacity>
              </View>

              {showPasswordFields ? (
                <View style={styles.passwordBlock}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t("settings.general.resetPassword.oldPassword", "Current Password")}</Text>
                    <View style={styles.passwordInputWrap}>
                      <TextInput
                        style={styles.passwordInput}
                        secureTextEntry={!showOldPassword}
                        value={passwords.oldPassword}
                        onChangeText={(text) => setPasswords((prev) => ({ ...prev, oldPassword: text }))}
                        editable={!isUpdatingPassword}
                      />
                      <TouchableOpacity onPress={() => setShowOldPassword((s) => !s)}>
                        {showOldPassword ? (
                          <EyeOff size={18} color={Colors.light.gray[500]} />
                        ) : (
                          <Eye size={18} color={Colors.light.gray[500]} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t("settings.general.resetPassword.newPassword", "New Password")}</Text>
                    <View style={styles.passwordInputWrap}>
                      <TextInput
                        style={styles.passwordInput}
                        secureTextEntry={!showNewPassword}
                        value={passwords.newPassword}
                        onChangeText={(text) => setPasswords((prev) => ({ ...prev, newPassword: text }))}
                        editable={!isUpdatingPassword}
                      />
                      <TouchableOpacity onPress={() => setShowNewPassword((s) => !s)}>
                        {showNewPassword ? (
                          <EyeOff size={18} color={Colors.light.gray[500]} />
                        ) : (
                          <Eye size={18} color={Colors.light.gray[500]} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t("settings.general.resetPassword.confirmPassword", "Confirm New Password")}</Text>
                    <View style={styles.passwordInputWrap}>
                      <TextInput
                        style={styles.passwordInput}
                        secureTextEntry={!showConfirmPassword}
                        value={passwords.confirmPassword}
                        onChangeText={(text) => setPasswords((prev) => ({ ...prev, confirmPassword: text }))}
                        editable={!isUpdatingPassword}
                      />
                      <TouchableOpacity onPress={() => setShowConfirmPassword((s) => !s)}>
                        {showConfirmPassword ? (
                          <EyeOff size={18} color={Colors.light.gray[500]} />
                        ) : (
                          <Eye size={18} color={Colors.light.gray[500]} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.passwordActionsRow}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => {
                        setShowPasswordFields(false);
                        resetPasswordForm();
                      }}
                      disabled={isUpdatingPassword}
                    >
                      <Text style={styles.cancelButtonText}>{t("common.cancel", "Cancel")}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.updatePasswordButton, isUpdatingPassword && styles.buttonDisabled]}
                      disabled={isUpdatingPassword}
                      onPress={handleUpdatePassword}
                    >
                      <Text style={styles.updatePasswordButtonText}>
                        {isUpdatingPassword
                          ? t("common.loading", "Updating...")
                          : t("settings.general.changePassword.updatePassword", "Update Password")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
            </View>
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.text,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
  description: {
    fontSize: 13,
    color: Colors.light.gray[600],
    marginTop: 4,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: Colors.light.gray[600],
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 14,
    gap: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
  },
  innerCard: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    backgroundColor: "#fff",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionHeaderRowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.text,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: Colors.light.gray[600],
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: "white",
  },
  disabledInput: {
    backgroundColor: Colors.light.gray[100],
    color: Colors.light.gray[500],
  },
  textArea: {
    minHeight: 78,
    textAlignVertical: "top",
  },
  actionsRow: {
    alignItems: "flex-end",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "white",
  },
  secondaryButtonText: {
    color: Colors.light.text,
    fontSize: 12,
    fontWeight: "600",
  },
  passwordBlock: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    padding: 10,
    backgroundColor: Colors.light.gray[50],
    gap: 10,
  },
  passwordInputWrap: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    paddingVertical: 9,
    paddingRight: 8,
  },
  passwordActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 2,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "white",
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.text,
  },
  updatePasswordButton: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#dc2626",
  },
  updatePasswordButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "white",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
