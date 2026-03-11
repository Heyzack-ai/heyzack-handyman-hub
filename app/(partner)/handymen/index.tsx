import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Search,
  Phone,
  Mail,
  Star,
  MapPin,
  Wrench,
  CheckCircle2,
  User,
  MessageCircle,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useRouter } from "expo-router";
import {
  getHandymen,
  getHandymanAvailability,
  getHandymanJobs,
  getInstallations,
} from "@/lib/api/partner-api";
import { Image } from "expo-image";
import { authClient } from "@/lib/auth-client";

type AvailabilityStatus = "Available" | "Busy" | "On Leave" | "Offline";

type SkillType = { name?: string } | string;

interface HandymanRow {
  id: string;
  name: string;
  handyman_name?: string;
  email?: string;
  phone?: string;
  availability_status?: string;
  rating?: number | string;
  skills?: SkillType[];
  current_location?: string;
  isVerified?: boolean;
  profile_image?: string;
}

interface EnrichedHandyman {
  id: string;
  name: string;
  email: string;
  phone: string;
  availability_status: AvailabilityStatus;
  rating: number;
  skills: { name: string }[];
  current_location: string;
  isVerified: boolean;
  profile_image?: string;
  totalJobs: number;
  currentJobsCount: number;
  availabilitySlot?: string;
  installations: any[];
}

const sanitizeImageUrl = (url?: string) => (url || "").replace(/[`"]/g, "").trim();

const normalizeAvailability = (status?: string): AvailabilityStatus => {
  const s = (status || "").toLowerCase().replace(/[\s_-]+/g, "");
  if (s === "available") return "Available";
  if (s === "busy") return "Busy";
  if (s === "onleave") return "On Leave";
  return "Offline";
};

const toSkills = (skills: SkillType[] | undefined) => {
  if (!Array.isArray(skills)) return [] as { name: string }[];
  return skills
    .map((skill) => {
      if (typeof skill === "string") return { name: skill };
      const value = skill?.name || "";
      return { name: String(value).trim() };
    })
    .filter((s) => s.name.length > 0);
};

const toName = (h: HandymanRow) => {
  if (h.handyman_name && h.handyman_name.trim().length > 0) return h.handyman_name;
  if (h.name && h.name.trim().length > 0) return h.name;
  return "—";
};

const statusColors: Record<AvailabilityStatus, string> = {
  Available: Colors.light.success,
  Busy: Colors.light.warning,
  "On Leave": "#ef4444",
  Offline: Colors.light.gray[500],
};

function HandymanCard({
  handyman,
  onPress,
  onAvailabilityPress,
  onChatPress,
}: {
  handyman: EnrichedHandyman;
  onPress: () => void;
  onAvailabilityPress: () => void;
  onChatPress: () => void;
}) {
  const { t } = useTranslation();
  return (
    <TouchableOpacity style={styles.handymanCard} onPress={onPress}>
      <View style={styles.handymanHeader}>
        <View style={styles.avatarContainer}>
          {!sanitizeImageUrl(handyman.profile_image) ? (
            <View style={styles.avatarPlaceholder}>
              <User size={24} color={Colors.light.gray[500]} />
            </View>
          ) : (
            <Image source={{ uri: sanitizeImageUrl(handyman.profile_image) }} style={styles.avatar} />
          )}
          {handyman.isVerified && (
            <View style={styles.verifiedBadge}>
              <CheckCircle2 size={12} color={Colors.light.success} />
            </View>
          )}
        </View>

        <View style={styles.handymanInfo}>
          <Text style={styles.handymanName}>{handyman.name}</Text>
          <View style={styles.ratingRow}>
            <Star size={14} color={Colors.light.warning} fill={Colors.light.warning} />
            <Text style={styles.ratingText}>{handyman.rating.toFixed(1)}</Text>
            <Text style={styles.jobsText}>({handyman.totalJobs})</Text>
          </View>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: `${statusColors[handyman.availability_status]}20` }]}>
          <Text style={[styles.statusText, { color: statusColors[handyman.availability_status] }]}>
            {handyman.availability_status}
          </Text>
        </View>
      </View>

      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <Mail size={14} color={Colors.light.gray[500]} />
          <Text style={styles.detailText}>{handyman.email || "-"}</Text>
        </View>
        <View style={styles.detailRow}>
          <Phone size={14} color={Colors.light.gray[500]} />
          <Text style={styles.detailText}>{handyman.phone || "-"}</Text>
        </View>
        <View style={styles.detailRow}>
          <MapPin size={14} color={Colors.light.gray[500]} />
          <Text style={styles.detailText}>{handyman.current_location || "-"}</Text>
        </View>
      </View>

      <View style={styles.skillsSection}>
        <View style={styles.skillsHeader}>
          <Wrench size={14} color={Colors.light.gray[500]} />
          <Text style={styles.skillsLabel}>{t("handyman.details.skills", "Skills")}</Text>
        </View>
        <View style={styles.skillsList}>
          {handyman.skills.slice(0, 3).map((skill, index) => (
            <View key={`${skill.name}-${index}`} style={styles.skillBadge}>
              <Text style={styles.skillText}>{skill.name}</Text>
            </View>
          ))}
          {handyman.skills.length > 3 && (
            <View style={styles.skillBadge}>
              <Text style={styles.skillText}>+{handyman.skills.length - 3}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity onPress={onAvailabilityPress} style={styles.viewAvailabilityBtn}>
            <Text style={styles.viewAvailabilityText}>{t("handyman.viewAvailability", "View availability")}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onChatPress} style={styles.chatBtn}>
            <MessageCircle size={14} color="white" />
            <Text style={styles.chatBtnText}>{t("tabs.chat", "Chat")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HandymenScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [skillFilter, setSkillFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [enriched, setEnriched] = useState<EnrichedHandyman[]>([]);
  const [loadingEnriched, setLoadingEnriched] = useState(false);

  const { data: rawHandymen = [], isLoading, refetch } = useQuery({
    queryKey: ["handymen"],
    queryFn: () => getHandymen(),
  });

  useEffect(() => {
    let cancelled = false;

    const enrich = async () => {
      if (!Array.isArray(rawHandymen) || rawHandymen.length === 0) {
        setEnriched([]);
        return;
      }

      setLoadingEnriched(true);
      try {
        const mapped = await Promise.all(
          rawHandymen.map(async (row: HandymanRow) => {
            const jobs = await getHandymanJobs(row.id).catch(() => []);
            const allInstallations = await getInstallations().catch(() => []);
            const availability = await getHandymanAvailability(row.id).catch(() => null);

            const jobsArray = Array.isArray(jobs) ? jobs : jobs?.data || [];
            const installationsArray = Array.isArray(allInstallations) ? allInstallations : [];
            const relatedInstallations = installationsArray.filter((i: any) => {
              const handymanId = i?.handymanId || i?.handyman?.id;
              return handymanId === row.id;
            });

            const availabilityDays = Array.isArray(availability?.availability)
              ? availability.availability
              : [];
            const dayWithSlots = availabilityDays.find(
              (d: any) => d?.isAvailable && Array.isArray(d?.availableSlots) && d.availableSlots.length > 0
            );
            const slot = dayWithSlots?.availableSlots?.[0]
              ? `${dayWithSlots.availableSlots[0].start} - ${dayWithSlots.availableSlots[0].end}`
              : undefined;

            const currentJobsCount = jobsArray.filter((j: any) => {
              const status = String(j?.status || "").toLowerCase();
              return status === "pending" || status === "assigned" || status === "scheduled" || status === "in-progress";
            }).length;

            const rating =
              typeof row.rating === "number"
                ? row.rating
                : typeof row.rating === "string"
                ? Number(row.rating) || 0
                : 0;

            return {
              id: row.id,
              name: toName(row),
              email: row.email || "",
              phone: row.phone || "",
              availability_status: normalizeAvailability(row.availability_status),
              rating,
              skills: toSkills(row.skills),
              current_location: row.current_location || "",
              isVerified: Boolean(row.isVerified),
              profile_image: row.profile_image,
              totalJobs: jobsArray.length,
              currentJobsCount,
              availabilitySlot: slot,
              installations: relatedInstallations,
            } as EnrichedHandyman;
          })
        );

        if (!cancelled) {
          setEnriched(mapped);
        }
      } finally {
        if (!cancelled) {
          setLoadingEnriched(false);
        }
      }
    };

    enrich();

    return () => {
      cancelled = true;
    };
  }, [rawHandymen]);

  const allSkills = useMemo(() => {
    const set = new Set<string>();
    enriched.forEach((h) => h.skills.forEach((s) => set.add(s.name)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [enriched]);

  const filteredHandymen = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return enriched.filter((h) => {
      const matchesSearch =
        !q ||
        h.name.toLowerCase().includes(q) ||
        h.skills.some((s) => s.name.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "all" ||
        h.availability_status.toLowerCase().replace(/\s+/g, "_") === statusFilter;

      const matchesSkill =
        skillFilter === "all" || h.skills.some((s) => s.name === skillFilter);

      return matchesSearch && matchesStatus && matchesSkill;
    });
  }, [enriched, searchQuery, statusFilter, skillFilter]);

  const stats = useMemo(() => {
    const total = enriched.length;
    const available = enriched.filter((h) => h.availability_status === "Available").length;
    const busy = enriched.filter((h) => h.availability_status === "Busy").length;
    const onLeave = enriched.filter((h) => h.availability_status === "On Leave").length;
    const avgRating = total ? (enriched.reduce((acc, h) => acc + h.rating, 0) / total).toFixed(1) : "0";

    return { total, available, busy, onLeave, avgRating };
  }, [enriched]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const loading = isLoading || loadingEnriched;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("handyman.title", "Handyman")}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: `${Colors.light.primary}10` }]}> 
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>{t("handyman.summary.total", "Total")}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: `${Colors.light.success}10` }]}> 
          <Text style={styles.statValue}>{stats.available}</Text>
          <Text style={styles.statLabel}>{t("handyman.summary.available", "Available")}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: `${Colors.light.warning}10` }]}> 
          <Text style={styles.statValue}>{stats.busy}</Text>
          <Text style={styles.statLabel}>{t("handyman.summary.busy", "Busy")}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#ef44441A" }]}> 
          <Text style={styles.statValue}>{stats.onLeave}</Text>
          <Text style={styles.statLabel}>{t("handyman.summary.onLeave", "On Leave")}</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.light.gray[500]} />
        <TextInput
          style={styles.searchInput}
          placeholder={t("handyman.searchPlaceholder", "Search by name or skill")}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filtersWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {[
            { key: "all", label: t("handyman.allStatus", "All") },
            { key: "available", label: t("handyman.summary.available", "Available") },
            { key: "busy", label: t("handyman.summary.busy", "Busy") },
            { key: "on_leave", label: t("handyman.summary.onLeave", "On Leave") },
            { key: "offline", label: t("handyman.status.unknown", "Offline") },
          ].map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.filterChip, statusFilter === item.key && styles.filterChipActive]}
              onPress={() => setStatusFilter(item.key)}
            >
              <Text style={[styles.filterChipText, statusFilter === item.key && styles.filterChipTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, skillFilter === "all" && styles.filterChipActive]}
            onPress={() => setSkillFilter("all")}
          >
            <Text style={[styles.filterChipText, skillFilter === "all" && styles.filterChipTextActive]}>
              {t("handyman.allSkills", "All Skills")}
            </Text>
          </TouchableOpacity>
          {allSkills.map((skill) => (
            <TouchableOpacity
              key={skill}
              style={[styles.filterChip, skillFilter === skill && styles.filterChipActive]}
              onPress={() => setSkillFilter(skill)}
            >
              <Text style={[styles.filterChipText, skillFilter === skill && styles.filterChipTextActive]}>{skill}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredHandymen}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.handymanList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <HandymanCard
            handyman={item}
            onPress={() =>
              router.push({
                pathname: "/handymen/[id]",
                params: { id: item.id, tab: "details", source: "partner" },
              })
            }
            onAvailabilityPress={() =>
              router.push({
                pathname: "/handymen/[id]",
                params: { id: item.id, tab: "availability", source: "partner" },
              })
            }
            onChatPress={() => {
              const userId = session?.user?.id;
              if (!userId) return;

              const roomId = `chat_${userId}_${item.id}`;
              router.push({
                pathname: "/chat/[id]",
                params: {
                  id: roomId,
                  handymanId: item.id,
                  handymanName: item.name,
                },
              });
            }}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {loading
                ? t("common.loading", "Loading...")
                : t("handyman.noResults", "No handymen found")}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  statsContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.light.gray[600],
    marginTop: 2,
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchInput: {
    flex: 1,
    height: 48,
    marginLeft: 8,
    fontSize: 16,
  },
  filtersWrap: {
    gap: 8,
    marginBottom: 8,
  },
  filterRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "white",
  },
  filterChipActive: {
    borderColor: Colors.light.primary,
    backgroundColor: `${Colors.light.primary}15`,
  },
  filterChipText: {
    fontSize: 12,
    color: Colors.light.gray[700],
  },
  filterChipTextActive: {
    color: Colors.light.primary,
    fontWeight: "600",
  },
  handymanList: {
    padding: 16,
    paddingTop: 8,
  },
  handymanCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  handymanHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.light.primary}20`,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 2,
  },
  handymanInfo: {
    flex: 1,
  },
  handymanName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
  jobsText: {
    fontSize: 12,
    color: Colors.light.gray[500],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  detailsSection: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.light.gray[600],
    flex: 1,
  },
  skillsSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 12,
  },
  skillsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  skillsLabel: {
    fontSize: 12,
    color: Colors.light.gray[500],
  },
  skillsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillBadge: {
    backgroundColor: Colors.light.gray[100],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skillText: {
    fontSize: 12,
    color: Colors.light.gray[600],
  },
  viewAvailabilityBtn: {
    marginTop: 10,
  },
  viewAvailabilityText: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: "600",
  },
  cardActions: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  chatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chatBtnText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.gray[500],
  },
});
