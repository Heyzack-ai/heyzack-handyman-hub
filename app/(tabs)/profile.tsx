import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  SafeAreaView,
  Alert,
  Platform,
  StatusBar,
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
import ShimmerCard from "@/components/ShimmerCard";
import ProfileSkeleton from "@/components/ProfileSkeleton";
import { useTranslations } from "@/src/i18n/useTranslations";
import { useGetUser } from "@/app/api/user/getUser";
import { useGetSkills } from "@/app/api/user/addskills";
import { authClient } from "@/lib/auth-client";

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut, deleteAccount } = useAuth();
  const { t } = useTranslations();
  const { data: user, isLoading } = useGetUser();
  const { data: skillsData, isLoading: skillsLoading, error: skillsError } = useGetSkills();
  const BASE_URL = process.env.EXPO_PUBLIC_ASSET_URL;
  

  // Show skeleton while loading
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ProfileSkeleton />
      </SafeAreaView>
    );
  }


  // Process skills data from useGetSkills hook
  let processedSkills: Skill[] = [];
  
  if (skillsData) {
    try {
      // Check if skills are in skillsData.data.skills or directly in skillsData.skills
      let skillsArray = skillsData.data?.skills || skillsData.skills;
      
      if (skillsArray) {
        // If it's already an array, use it directly
        if (Array.isArray(skillsArray)) {
          processedSkills = skillsArray.map((skill: any) => ({
            name: typeof skill === 'string' ? skill : skill.name || skill
          }));
        } else if (typeof skillsArray === 'string') {
          // If it's a JSON string, parse it
          const parsed = JSON.parse(skillsArray);
          if (Array.isArray(parsed)) {
            processedSkills = parsed.map((skill: any) => ({
              name: typeof skill === 'string' ? skill : skill.name || skill
            }));
          } else if (parsed.skills && Array.isArray(parsed.skills)) {
            processedSkills = parsed.skills.map((skill: any) => ({
              name: typeof skill === 'string' ? skill : skill.name || skill
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error processing skills:', error);
      // Fallback to user skills if available
      try {
        const fallbackSkills = JSON.parse(user?.skills || "{\"skills\":[]}") as Skills;
        processedSkills = fallbackSkills.skills || [];
      } catch (fallbackError) {
        console.error('Error parsing fallback skills:', fallbackError);
        processedSkills = [];
      }
    }
  } else {
    // Fallback to user skills if skillsData is not available
    try {
      const fallbackSkills = JSON.parse(user?.skills || "{\"skills\":[]}") as Skills;
      processedSkills = fallbackSkills.skills || [];
    } catch (fallbackError) {
      console.error('Error parsing fallback skills:', fallbackError);
      processedSkills = [];
    }
  }

  console.log("user", user)

  const technician = {
    name: user?.name,
    email: user?.email,
    phone: user?.phone,
    // location: "San Francisco, CA",
    avatar:
      user?.profile_image
        ? `${user.profile_image}`
        : `https://avatar.iran.liara.run/username?username=${user?.name}`,
    completedJobs: user?.completedJobs || 0,
    rating: user?.rating || "0",
    isVerified: String(user?.is_verified) === "1" || String(user?.is_verified) === "true",
    skills: { skills: processedSkills } as Skills,
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
            <Text style={styles.editProfileText}>{t("profile.editProfile")}</Text>
          </Pressable>
        </View>

        <View style={styles.skillsContainer}>
          <View style={styles.skillsHeader}>
            <Text style={styles.skillsTitle}>{t("profile.skills")}</Text>
            <Pressable onPress={() => router.push("/profile/skills")}>
              <Text style={styles.addSkillText}>+ {t("profile.add")}</Text>
            </Pressable>
          </View>
          <View style={styles.skillTags}>
            {skillsLoading ? (
              <Text style={[styles.skillText, { color: Colors.light.gray[600] }]}>
                Loading skills...
              </Text>
            ) : skillsError ? (
              <Text style={[styles.skillText, { color: Colors.light.error }]}>
                Error loading skills
              </Text>
            ) : technician.skills.skills.length > 0 ? (
              technician.skills.skills.map((skill, index) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skill.name}</Text>
                </View>
              ))
            ) : (
              <Text style={[styles.skillText, { color: Colors.light.gray[600] }]}>
                No skills added yet
              </Text>
            )}
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{technician.completedJobs}</Text>
            <Text style={styles.statLabel}>{t("profile.jobsCompleted")}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{technician.rating}</Text>
            <Text style={styles.statLabel}>{t("profile.rating")}</Text>
          </View>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("profile.payments")}</Text>
          {/* {renderMenuItem(
            <CreditCard size={20} color={Colors.light.primary} />,
            t("profile.payments"),
            t("profile.viewPayments"),
            () => router.push("/profile/payments")
          )} */}

          {renderMenuItem(
            <Banknote size={20} color={Colors.light.primary} />,
            t("profile.bankAccount"),
            t("profile.yourBankAccounts"),
            () => router.push("/profile/bankAccounts")
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("profile.contactInfo")}</Text>
          {renderMenuItem(
            <Mail size={20} color={Colors.light.primary} />,
            t("profile.email"),
            technician.email
          )}
          {renderMenuItem(
            <Phone size={20} color={Colors.light.primary} />,
            t("profile.phone"),
            technician?.phone || "No phone number"
          )}
          {/* {renderMenuItem(
            <MapPin size={20} color={Colors.light.primary} />,
            "Location",
            technician.location
          )} */}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("profile.workPreferences")}</Text>
          {renderMenuItem(
            <Clock size={20} color={Colors.light.gray[600]} />,
            t("profile.availability"),
            t("profile.setWorkingHours"),
            () => router.push("/profile/availability")
          )}
          {renderMenuItem(
            <Globe size={20} color={Colors.light.gray[600]} />,
            t("profile.serviceArea"),
            t("profile.defineServiceRadius"),
            () => router.push("/profile/service-area")
          )}
          {renderMenuItem(
            <Link size={20} color={Colors.light.gray[600]} />,
            t("profile.partners"),
            t("profile.managePartnerConnections"),
            () => router.push({
              pathname: "/profile/partners",
              params: {
                user: JSON.stringify(user),
              },
            })
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("profile.settings")}</Text>
          {renderMenuItem(
            <Languages size={20} color={Colors.light.gray[600]} />,
            t("profile.language"),
            t("profile.english"),
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
            t("profile.helpSupport"),
            undefined,
            () => router.push("/profile/help")
          )}
          {renderMenuItem(
            <LogOut size={20} color={Colors.light.error} />,
            t("profile.logOut"),
            undefined,
            async () => {
              try {
                await signOut();
                // The auth context will automatically redirect to signin
              } catch (error) {
                Alert.alert(t("profile.error"), t("profile.failedToSignOut"));
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
                    t("profile.deleteAccount"),
                    t("profile.deleteAccountConfirmation"),
                    [
                      {
                        text: t("common.cancel"),
                        style: "cancel",
                        onPress: () => resolve(false),
                      },
                      {
                        text: t("profile.delete"),
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
            <Text style={styles.deleteAccountText}>{t("profile.deleteAccount")}</Text>
          </Pressable>
        </View>

        <Text style={styles.version}>{t("profile.version", { version: "1.0.0" })}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
