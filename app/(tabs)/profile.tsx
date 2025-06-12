import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  SafeAreaView,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import {
  Mail,
  Phone,
  MapPin,
  Settings,
  HelpCircle,
  LogOut,
  Edit,
  User,
  Clock,
  Globe,
  Shield,
  Link,
  Languages,
  CreditCard,
  Banknote,
} from "lucide-react-native";
import Colors from "@/constants/colors";

import { useGetUser } from "@/app/api/user/getUser";
import { authClient } from "@/lib/auth-client";

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut, deleteAccount } = useAuth();

  const { data: user } = useGetUser();
  const BASE_URL = process.env.EXPO_PUBLIC_ASSET_URL;


  const technician = {
    name: user?.handyman_name,
    email: user?.email,
    phone: user?.contact_number,
    // location: "San Francisco, CA",
    avatar:
     `${BASE_URL}${user?.profile_image}` ||
      `https://avatar.iran.liara.run/username?username=${user?.handyman_name}`,
    completedJobs: user?.jobs_completed || 0,
    rating: user?.rating || 0,
    isVerified: String(user?.is_verified) === "1" || String(user?.is_verified) === "true",
    skills: JSON.parse(user?.skills || "{\"skills\":[]}") as Skills,
  };

  interface Skills {
    skills: Skill[]
  }
  
  interface Skill {
    name: string
  }

  const renderMenuItem = (
    icon: React.ReactNode,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    rightElement?: React.ReactNode
  ) => (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        pressed && styles.menuItemPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.menuIcon}>{icon}</View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement}
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: technician.avatar }}
              style={styles.avatar}
              contentFit="cover"
              transition={300}
            />
            {technician.isVerified && (
              <View style={styles.verifiedBadge}>
                <Shield size={12} color="white" />
              </View>
            )}
          </View>
          <Text style={styles.name}>{technician.name}</Text>

          <Pressable
            style={styles.editProfileButton}
            onPress={() => router.push({
              pathname: "/profile/edit",
              params: {
                user: JSON.stringify(user),
              },
            })}
          >
            <Edit size={16} color={Colors.light.primary} />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </Pressable>
        </View>

        <View style={styles.skillsContainer}>
          <View style={styles.skillsHeader}>
            <Text style={styles.skillsTitle}>Skills</Text>
            <Pressable onPress={() => router.push("/profile/skills")}>
              <Text style={styles.addSkillText}>+ Add</Text>
            </Pressable>
          </View>
          <View style={styles.skillTags}>
            {technician.skills.skills.map((skill, index) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillText}>{skill.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{technician.completedJobs}</Text>
            <Text style={styles.statLabel}>Jobs Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{technician.rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          {renderMenuItem(
            <CreditCard size={20} color={Colors.light.primary} />,
            "Payments",
            "View your payments",
            () => router.push("/profile/payments")
          )}

          {renderMenuItem(
            <Banknote size={20} color={Colors.light.primary} />,
            "Bank Account",
            "Your bank accounts",
            () => router.push("/profile/bankAccounts")
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          {renderMenuItem(
            <Mail size={20} color={Colors.light.primary} />,
            "Email",
            technician.email
          )}
          {renderMenuItem(
            <Phone size={20} color={Colors.light.primary} />,
            "Phone",
            technician?.phone || "No phone number"
          )}
          {/* {renderMenuItem(
            <MapPin size={20} color={Colors.light.primary} />,
            "Location",
            technician.location
          )} */}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work Preferences</Text>
          {renderMenuItem(
            <Clock size={20} color={Colors.light.gray[600]} />,
            "Availability",
            "Set your working hours",
            () => router.push("/profile/availability")
          )}
          {renderMenuItem(
            <Globe size={20} color={Colors.light.gray[600]} />,
            "Service Area",
            "Define your service radius",
            () => router.push("/profile/service-area")
          )}
          {renderMenuItem(
            <Link size={20} color={Colors.light.gray[600]} />,
            "Partners",
            "Manage your partner connections",
            () => router.push("/profile/partners")
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          {renderMenuItem(
            <Languages size={20} color={Colors.light.gray[600]} />,
            "Language",
            "English",
            () => router.push("/profile/language")
          )}
          {/* {renderMenuItem(
            <Settings size={20} color={Colors.light.gray[600]} />,
            "App Settings",
            undefined,
            () => router.push("/profile/settings")
          )} */}
          {renderMenuItem(
            <HelpCircle size={20} color={Colors.light.gray[600]} />,
            "Help & Support",
            undefined,
            () => router.push("/profile/help")
          )}
          {renderMenuItem(
            <LogOut size={20} color={Colors.light.error} />,
            "Log Out",
            undefined,
            async () => {
              try {
                await signOut();
                // The auth context will automatically redirect to signin
              } catch (error) {
                Alert.alert("Error", "Failed to sign out. Please try again.");
              }
            }
          )}
          <Pressable
            style={styles.deleteAccountButton}
            onPress={async () => {
              try {
                // Show delete account confirmation
                const confirmed = await new Promise<boolean>((resolve) => {
                  Alert.alert(
                    "Delete Account",
                    "Are you sure you want to delete your account? This action cannot be undone.",
                    [
                      {
                        text: "Cancel",
                        style: "cancel",
                        onPress: () => resolve(false),
                      },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: async () => {
                          await deleteAccount();
                          resolve(true);
                        },
                      },
                    ]
                  );
                });
              } catch (error) {
                console.error(error);
              }
            }}
          >
            <Text style={styles.deleteAccountText}>Delete Account</Text>
          </Pressable>
        </View>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.light.gray[200],
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: Colors.light.gray[600],
    marginBottom: 12,
  },
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  editProfileText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: "500",
    marginLeft: 6,
  },
  skillsContainer: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  skillsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  skillsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  addSkillText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: "500",
  },
  skillTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillTag: {
    backgroundColor: Colors.light.primary + "20",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  skillText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.light.gray[600],
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.light.border,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  menuItemPressed: {
    opacity: 0.8,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.gray[100],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.text,
  },
  menuSubtitle: {
    fontSize: 14,
    color: Colors.light.gray[600],
    marginTop: 2,
  },
  deleteAccountButton: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.light.error,
    borderRadius: 12,
    padding: 16,
  },
  deleteAccountText: {
    fontSize: 14,
    color: Colors.light.error,
    fontWeight: "500",
  },
  version: {
    fontSize: 14,
    color: Colors.light.gray[500],
    textAlign: "center",
    marginBottom: 16,
  },
});
