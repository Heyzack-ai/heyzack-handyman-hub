import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import {
  getHandymanAvailability,
  getHandymanById,
  getHandymanJobs,
  getInstallations,
} from "@/lib/api/partner-api";

type TabKey = "details" | "availability" | "installations";

const sanitizeImageUrl = (url?: string) => (url || "").replace(/[`"]/g, "").trim();

const normalizeStatusKey = (value?: string) =>
  (value || "").toUpperCase().replace(/\s+/g, "_").trim();

const getInstallationStatusLabel = (status?: string) => {
  const s = normalizeStatusKey(status);
  switch (s) {
    case "SCHEDULED":
      return "Scheduled";
    case "ON_HOLD":
      return "On Hold";
    case "COMPLETED":
    case "JOB_COMPLETED":
      return "Completed";
    case "CUSTOMER_APPROVED":
    case "JOB_APPROVED":
      return "Customer Approved";
    case "CANCELLED":
      return "Cancelled";
    case "REJECTED":
      return "Rejected";
    case "ACCEPTED":
      return "Accepted";
    case "STOCK_COLLECTED":
      return "Stock Collected";
    case "CONTRACT_SIGNED":
      return "Contract Signed";
    case "CONTRACT_SENT":
      return "Contract Sent";
    case "PENDING":
      return "Pending";
    case "IN_PROGRESS":
    case "INSTALLATION_IN_PROGRESS":
      return "In Progress";
    case "EN_ROUTE":
      return "En Route";
    case "ASSIGNED":
      return "Assigned";
    case "STARTED":
      return "Started";
    case "DRAFT":
      return "Draft";
    default:
      return status || "";
  }
};

const getInstallationStatusColor = (status?: string) => {
  const s = normalizeStatusKey(status);
  switch (s) {
    case "COMPLETED":
    case "JOB_COMPLETED":
    case "CUSTOMER_APPROVED":
    case "JOB_APPROVED":
    case "ACCEPTED":
      return { bg: "#dcfce7", text: "#166534" };
    case "CANCELLED":
    case "REJECTED":
      return { bg: "#fee2e2", text: "#991b1b" };
    case "PENDING":
    case "IN_PROGRESS":
    case "INSTALLATION_IN_PROGRESS":
    case "STOCK_COLLECTED":
      return { bg: "#fef3c7", text: "#92400e" };
    case "EN_ROUTE":
    case "ASSIGNED":
    case "STARTED":
    case "SCHEDULED":
      return { bg: "#dbeafe", text: "#1e40af" };
    default:
      return { bg: "#f3f4f6", text: "#374151" };
  }
};

export default function HandymanDetailsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; tab?: string; source?: string }>();
  const handymanId = String(params.id || "");
  const source = String(params.source || "");

  const initialTab: TabKey =
    params.tab === "availability" || params.tab === "installations" || params.tab === "details"
      ? params.tab
      : "details";

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  const handleBack = () => {
    if (source === "partner") {
      router.back();
      return;
    }
    router.replace("/(handyman)");
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["handyman-details", handymanId],
    enabled: Boolean(handymanId),
    queryFn: async () => {
      const [handyman, availability, jobs, installations] = await Promise.all([
        getHandymanById(handymanId),
        getHandymanAvailability(handymanId),
        getHandymanJobs(handymanId),
        getInstallations(),
      ]);

      const installationsList = Array.isArray(installations)
        ? installations.filter((i: any) => {
            const hId = i?.handymanId || i?.handyman?.id;
            return hId === handymanId;
          })
        : [];

      return {
        handyman,
        availability,
        jobs: Array.isArray(jobs) ? jobs : jobs?.data || [],
        installations: installationsList,
      };
    },
  });

  const handyman = data?.handyman || {};

  const skills = useMemo(() => {
    const source = Array.isArray(handyman?.skills) ? handyman.skills : [];
    return source
      .map((s: any) => {
        if (typeof s === "string") return s;
        if (s && typeof s === "object") return s.name || s.skill || "";
        return "";
      })
      .filter((x: string) => x.length > 0);
  }, [handyman?.skills]);

  const availabilityRows = Array.isArray(data?.availability?.availability)
    ? data?.availability?.availability
    : [];

  const getDayAbbr = (day: any) => {
    const raw = String(day?.dayName || "").trim();
    if (raw.length >= 3) return raw.slice(0, 3).toUpperCase();
    if (day?.date) {
      const d = new Date(day.date);
      if (!Number.isNaN(d.getTime())) {
        return d
          .toLocaleDateString(undefined, { weekday: "short" })
          .replace(".", "")
          .slice(0, 3)
          .toUpperCase();
      }
    }
    return "DAY";
  };

  const getDayNumber = (day: any) => {
    if (day?.date) {
      const d = new Date(day.date);
      if (!Number.isNaN(d.getTime())) return String(d.getDate());
    }
    return "-";
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.light.primary} />
          <Text style={styles.mutedText}>{t("common.loading", "Loading...")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <ArrowLeft size={20} color={Colors.light.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t("handyman.details.title", "Handyman Details")}</Text>
          <Text style={styles.subtitle}>{handyman?.name || "-"}</Text>
        </View>
      </View>

      <View style={styles.tabsWrap}>
        {(["details", "availability", "installations"] as TabKey[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === "details"
                ? t("handyman.tabs.details", "Details")
                : tab === "availability"
                ? t("handyman.tabs.availability", "Availability")
                : t("handyman.tabs.installations", "Installations")}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === "details" && (
          <View style={styles.card}>
            <View style={styles.profileRow}>
              {!sanitizeImageUrl(handyman?.profile_image) ? (
                <View style={styles.avatarFallback}>
                  <User size={26} color={Colors.light.gray[600]} />
                </View>
              ) : (
                <Image source={{ uri: sanitizeImageUrl(handyman?.profile_image) }} style={styles.avatar} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{handyman?.name || "-"}</Text>
                <Text style={styles.mutedText}>
                  {t("common.id", "ID")}: {handyman?.id || handymanId}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Mail size={14} color={Colors.light.gray[500]} />
              <Text style={styles.infoText}>{handyman?.email || "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Phone size={14} color={Colors.light.gray[500]} />
              <Text style={styles.infoText}>{handyman?.phone || handyman?.contact_number || "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <MapPin size={14} color={Colors.light.gray[500]} />
              <Text style={styles.infoText}>{handyman?.current_location || "-"}</Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>{t("handyman.details.skills", "Skills")}</Text>
            <View style={styles.skillsWrap}>
              {skills.length > 0 ? (
                skills.map((skill: string, idx: number) => (
                  <View key={`${skill}-${idx}`} style={styles.skillBadge}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.mutedText}>{t("handyman.details.noSkills", "No skills")}</Text>
              )}
            </View>
          </View>
        )}

        {activeTab === "availability" && (
          <View style={styles.availabilityWrap}>
            {availabilityRows.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.mutedText}>
                  {t("handyman.availability.noData", "No availability data found")}
                </Text>
              </View>
            ) : (
              availabilityRows.map((day: any, idx: number) => {
                const slots = Array.isArray(day?.availableSlots) ? day.availableSlots : [];
                const isAvailable = Boolean(day?.isAvailable);
                return (
                  <View key={`${day?.date || idx}`} style={styles.availabilityDayCard}>
                    <View style={styles.dayDateCol}>
                      <Text style={styles.dayLabel}>{getDayAbbr(day)}</Text>
                      <Text style={styles.dayDate}>{getDayNumber(day)}</Text>
                    </View>

                    <View style={styles.dayMainCol}>
                      <View
                        style={[
                          styles.statusPill,
                          isAvailable ? styles.statusPillAvailable : styles.statusPillBusy,
                        ]}
                      >
                        <Text style={isAvailable ? styles.statusTextAvailable : styles.statusTextBusy}>
                          {isAvailable
                            ? t("handyman.status.available", "Available")
                            : t("handyman.status.busy", "Busy")}
                        </Text>
                      </View>

                      {slots.length > 0 ? (
                        <View style={styles.slotsWrap}>
                          {slots.map((slot: any, sIdx: number) => (
                            <View key={`${slot?.start}-${sIdx}`} style={styles.slotPill}>
                              <Clock size={12} color={Colors.light.gray[600]} />
                              <Text style={styles.slotText}>{slot?.start} - {slot?.end}</Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.unavailableText}>
                          {t("handyman.availability.unavailableForDay", "Unavailable for this day")}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {activeTab === "installations" && (
          <View style={styles.card}>
            {Array.isArray(data?.installations) && data.installations.length > 0 ? (
              data.installations.map((inst: any) => {
                const statusStyle = getInstallationStatusColor(inst?.status);
                return (
                  <TouchableOpacity
                    key={String(inst?.id)}
                    style={styles.installationCard}
                    onPress={() =>
                      router.push({ pathname: "/(partner)/installations/[id]", params: { id: String(inst?.id) } })
                    }
                  >
                    <View style={styles.installationHeader}>
                      <Text style={styles.installationTitle} numberOfLines={1}>
                        {inst?.title ||
                          `${t("installations.titleSingle", "Installation")} ${inst?.id}`}
                      </Text>
                      <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}> 
                        <Text style={{ color: statusStyle.text, fontSize: 11 }}>
                          {t(`status.${normalizeStatusKey(inst?.status).toLowerCase()}`, {
                            defaultValue: getInstallationStatusLabel(inst?.status),
                          })}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.infoRow}>
                      <Calendar size={14} color={Colors.light.gray[500]} />
                      <Text style={styles.infoText}>
                        {inst?.scheduledDate
                          ? new Date(inst.scheduledDate).toLocaleDateString()
                          : "-"}
                      </Text>
                    </View>

                    <View style={styles.infoRow}>
                      <MapPin size={14} color={Colors.light.gray[500]} />
                      <Text style={styles.infoText} numberOfLines={1}>
                        {inst?.customer?.address || inst?.address || "-"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={styles.mutedText}>{t("handyman.installations.none", "No installations found")}</Text>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.refreshBtn} onPress={() => refetch()}>
          <Text style={styles.refreshBtnText}>{t("common.refresh", "Refresh")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: "white",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.gray[100],
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.light.gray[600],
    marginTop: 2,
  },
  tabsWrap: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
    backgroundColor: "white",
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.light.gray[100],
  },
  tabBtnActive: {
    backgroundColor: `${Colors.light.primary}20`,
  },
  tabText: {
    fontSize: 13,
    color: Colors.light.gray[700],
    fontWeight: "500",
  },
  tabTextActive: {
    color: Colors.light.primary,
    fontWeight: "700",
  },
  content: {
    padding: 16,
    gap: 12,
    flexGrow: 1,
    backgroundColor: "#ffffff",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontSize: 18,
    color: Colors.light.text,
    fontWeight: "700",
  },
  mutedText: {
    color: Colors.light.gray[600],
    fontSize: 13,
  },
  mutedTextSmall: {
    color: Colors.light.gray[500],
    fontSize: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    color: Colors.light.gray[700],
    fontSize: 13,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 4,
  },
  sectionTitle: {
    fontSize: 12,
    textTransform: "uppercase",
    color: Colors.light.gray[500],
    fontWeight: "700",
  },
  skillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.light.gray[100],
  },
  skillText: {
    fontSize: 12,
    color: Colors.light.gray[700],
  },
  availabilityWrap: {
    gap: 12,
  },
  availabilityDayCard: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 14,
    padding: 14,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  dayDateCol: {
    width: 54,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 2,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.light.gray[500],
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  dayDate: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  dayMainCol: {
    flex: 1,
    gap: 10,
  },
  statusPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusPillAvailable: {
    backgroundColor: "#16a34a",
  },
  statusPillBusy: {
    backgroundColor: "#e5e7eb",
  },
  statusTextAvailable: {
    fontSize: 12,
    fontWeight: "700",
    color: "white",
  },
  statusTextBusy: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
  },
  slotsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  slotPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
  },
  slotText: {
    fontSize: 11,
    color: "#374151",
    fontWeight: "600",
  },
  unavailableText: {
    fontSize: 14,
    color: "#64748b",
    fontStyle: "italic",
  },
  installationCard: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  installationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  installationTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.text,
  },
  refreshBtn: {
    marginTop: 4,
    alignSelf: "flex-end",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.primary,
  },
  refreshBtnText: {
    color: "white",
    fontWeight: "600",
    fontSize: 13,
  },
});
