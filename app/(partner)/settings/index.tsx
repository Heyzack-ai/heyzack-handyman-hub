import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
  User,
  HelpCircle,
  ChevronRight,
  LogOut,
  Languages,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth-context";

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  rightElement?: React.ReactNode;
}

function SettingItem({ icon, title, subtitle, onPress, showArrow = true, rightElement }: SettingItemProps) {
  return (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={!onPress}>
      <View style={styles.settingIconContainer}>{icon}</View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || (showArrow && <ChevronRight size={20} color={Colors.light.gray[400]} />)}
    </TouchableOpacity>
  );
}

export default function PartnerSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { signOut } = useAuth();
  const selectedLanguageLabel = t("language.english", "English");

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("settings.title", "Settings")}</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("settings.account", "Account")}</Text>
          <View style={styles.sectionCard}>
            <SettingItem
              icon={<User size={20} color={Colors.light.primary} />}
              title={t("settings.profile", "Profile")}
              subtitle={t("settings.profileSubtitle", "Edit your profile information")}
              onPress={() => router.push("/(partner)/settings/edit-profile")}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("settings.support", "Support")}</Text>
          <View style={styles.sectionCard}>
            <SettingItem
              icon={<Languages size={20} color={Colors.light.gray[600]} />}
              title={t("profile.language", "Language")}
              subtitle={selectedLanguageLabel}
              onPress={() => router.push("/(partner)/settings/language")}
            />
            <View style={styles.divider} />
            <SettingItem
              icon={<HelpCircle size={20} color={Colors.light.gray[600]} />}
              title={t("profile.helpSupport", "Help & Support")}
              onPress={() => router.push("/(partner)/settings/help")}
            />
            <View style={styles.divider} />
            <SettingItem
              icon={<LogOut size={20} color={Colors.light.error} />}
              title={t("profile.logOut", "Log Out")}
              onPress={async () => {
                try {
                  await signOut();
                } catch {
                  Alert.alert(t("profile.error", "Error"), t("profile.failedToSignOut", "Failed to sign out"));
                }
              }}
            />
          </View>
        </View>

        <Text style={styles.version}>{t("settings.version", "Version")} 1.0.6</Text>
      </ScrollView>
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
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.gray[500],
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.light.gray[100],
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: Colors.light.text,
  },
  settingSubtitle: {
    fontSize: 13,
    color: Colors.light.gray[500],
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginLeft: 64,
  },
  version: {
    textAlign: "center",
    fontSize: 13,
    color: Colors.light.gray[400],
    marginTop: 16,
    marginBottom: 32,
  },
});
