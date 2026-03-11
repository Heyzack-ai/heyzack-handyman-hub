import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Search,
  Calendar,
  MapPin,
  User,
  Clock
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useRouter } from "expo-router";
import { authClient } from "@/lib/auth-client";
import { assignHandyman, assignInstallationToSelf, getHandymen, getInstallations } from "@/lib/api/partner-api";

type InstallationStatus =
  | "scheduled"
  | "en_route"
  | "in_progress"
  | "approved"
  | "rejected"
  | "cancelled"
  | "on_hold"
  | "completed"
  | "customer_approved"
  | "accepted"
  | "job_completed"
  | "stock_collected"
  | "contract_signed"
  | "contract_sent"
  | "draft"
  | "assigned"
  | "pending"
  | "started"
  | "installation_in_progress"
  | "postponed";

interface Installation {
  id: string;
  customerName: string;
  customerId: string;
  address: string;
  date: string;
  time: string;
  status: InstallationStatus;
  handymanName?: string;
  serviceType: string;
  title?: string;
  description?: string;
  name: String
}

interface HandymanOption {
  id: string;
  name: string;
}

// Fetch installations from API
// API: GET /api/v1/installation
const fetchInstallations = async (): Promise<Installation[]> => {
  try {
    const installations = await getInstallations();

    if (!Array.isArray(installations)) {
      console.warn("Installations response is not an array:", installations);
      return [];
    }

    const mapped = installations.map((inst: any) => {
      // Normalize nested payload shapes from API
      const customerNameValue =
        typeof inst?.customer?.customerName === "string"
          ? inst.customer.customerName
          : typeof inst?.customer?.name === "string"
            ? inst.customer.name
            : typeof inst?.customerName === "string"
              ? inst.customerName
              : typeof inst?.customer_name === "string"
                ? inst.customer_name
                : "—";

      const handymanNameValue =
        typeof inst?.handyman?.name === "string"
          ? inst.handyman.name
          : typeof inst?.handymanName === "string"
            ? inst.handymanName
            : typeof inst?.handyman === "string"
              ? inst.handyman
              : undefined;

      const serviceTypeValue =
        typeof inst?.title === "string"
          ? inst.title
          : typeof inst?.serviceType === "string"
            ? inst.serviceType
            : typeof inst?.customer === "string"
              ? inst.customer
              : "—";

      return {
        id: String(inst?.id || inst?.installationId || inst?.name || ""),
        customerName: customerNameValue,
        customerId: inst?.customerId || inst?.customer_id,
        address: inst?.address || inst?.customer?.address || "",
        date: inst?.scheduledDate || inst?.date || "",
        time: inst?.scheduledTime || inst?.time || "",
        status: inst?.status || "scheduled",
        handymanName: handymanNameValue,
        serviceType: serviceTypeValue,
        title: inst?.title || "",
        description: inst?.description || "",
        name: inst?.name || "",
      };
    });
    return mapped.filter((inst) => !!inst.id);
  } catch (error) {
    console.error("Failed to fetch installations:", error);
    return [];
  }
};

// Status color mapper function
const getStatusColor = (status: string): string => {
  const upperStatus = (status || "").toUpperCase();
  switch (upperStatus) {
    case "SCHEDULED":
    case "PENDING":
    case "DRAFT":
      return Colors.light.info;
    case "EN_ROUTE":
    case "STARTED":
      return Colors.light.warning;
    case "IN_PROGRESS":
    case "INSTALLATION_IN_PROGRESS":
    case "ASSIGNED":
      return Colors.light.primary;
    case "APPROVED":
    case "CUSTOMER_APPROVED":
    case "ACCEPTED":
    case "COMPLETED":
    case "JOB_COMPLETED":
    case "CONTRACT_SIGNED":
      return Colors.light.success;
    case "REJECTED":
    case "CANCELLED":
      return Colors.light.error;
    case "ON_HOLD":
    case "POSTPONED":
      return Colors.light.gray[500];
    case "STOCK_COLLECTED":
    case "CONTRACT_SENT":
      return Colors.light.secondary;
    default:
      return Colors.light.gray[500];
  }
};

// Status groups for filtering
const statusGroups = {
  Scheduled: ["SCHEDULED", "INSTALLER_ASSIGNED", "ASSIGNED", "PENDING", "DRAFT"],
  "En Route": ["EN_ROUTE"],
  "In Progress": ["INSTALLATION_COMPLETED", "INSTALLATION_IN_PROGRESS", "CONTRACT_SIGNED", "CONTRACT_SENT", "STARTED", "IN_PROGRESS"],
  Approved: ["CUSTOMER_APPROVED", "APPROVED", "COMPLETED", "JOB_COMPLETED", "ACCEPTED"],
  Rejected: ["CANCELLED", "REJECTED"]
};

// Helper function to get status group
const getStatusGroup = (status: string): string => {
  const upperStatus = (status || "").toUpperCase();
  for (const [group, statuses] of Object.entries(statusGroups)) {
    if (statuses.includes(upperStatus)) {
      return group;
    }
  }
  return "Other";
};

// Helper function to check if status belongs to group
const isStatusInGroup = (status: string, group: string): boolean => {
  const upperStatus = (status || "").toUpperCase();
  const groupKey = group as keyof typeof statusGroups;
  return statusGroups[groupKey]?.includes(upperStatus) || false;
};

function InstallationCard({ installation }: { installation: Installation }) {
  const router = useRouter();
  const { t } = useTranslation();

  // Handle case where fields might be objects
  const serviceType = typeof installation.serviceType === 'string' ? installation.serviceType :
    typeof installation.serviceType === 'object' && installation.serviceType?.name ? installation.serviceType.name :
      t("installations.titleSingle", "Installation");
  const address = typeof installation.address === 'string' ? installation.address : "";
  const date = typeof installation.date === 'string' ? installation.date : "";
  const time = typeof installation.time === 'string' ? installation.time : "";
  const handymanName = typeof installation.handymanName === 'string' ? installation.handymanName :
    typeof installation.handymanName === 'object' && installation.handymanName?.name ? installation.handymanName.name :
      installation.handymanName || undefined;
  const canReassign = ["INSTALLER_ASSIGNED", "EN_ROUTE", "ASSIGNED"].includes(
    (installation.status || "").toUpperCase().replace(/\s+/g, "_").trim()
  );
  const statusGroup = getStatusGroup(installation.status);
  const statusGroupLabel =
    statusGroup === "Scheduled"
      ? t("installations.scheduled", "Scheduled")
      : statusGroup === "En Route"
        ? t("status.en_route", "En Route")
        : statusGroup === "In Progress"
          ? t("installations.inProgress", "In Progress")
          : statusGroup === "Approved"
            ? t("installations.approved", "Approved")
            : statusGroup === "Rejected"
              ? t("installations.rejected", "Rejected")
              : t("status.unknown", "Unknown");

  return (
    <TouchableOpacity
      style={styles.installCard}
      onPress={() => {
        if (!installation.id) return;
        router.push({
          pathname: "/(partner)/installations/[id]",
          params: { id: String(installation.id) },
        });
      }}
    >
      <View style={styles.installHeader}>
        <View style={styles.serviceIconContainer}>
          <Calendar size={20} color={Colors.light.primary} />
        </View>
        <View style={styles.installInfo}>
          <Text style={styles.serviceType}>{serviceType}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(installation.status) + "20" }]}>
            <Text style={[styles.statusText, { color: getStatusColor(installation.status) }]}>
              {statusGroupLabel}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.customerSection}>
        <View style={styles.detailRow}>
          <User size={14} color={Colors.light.gray[500]} />
          <Text style={styles.detailText}>{handymanName || t("installations.noHandymanAssigned", "No Handyman Assigned")}</Text>
        </View>
        <View style={styles.detailRow}>
          <MapPin size={14} color={Colors.light.gray[500]} />
          <Text style={styles.detailText} numberOfLines={1}>{address || t("installations.noAddressProvided", "No Address Provided")}</Text>
        </View>
      </View>

      <View style={styles.installFooter}>
        <View style={styles.timeContainer}>
          <Clock size={14} color={Colors.light.gray[500]} />
          <Text style={styles.timeText}>{date} {time ? `• ${time}` : ''}</Text>
        </View>
        {handymanName ? (
          <View style={styles.footerActions}>
            <View style={styles.handymanBadge}>
              <Text style={styles.handymanText}>{handymanName}</Text>
            </View>
            {canReassign && (
              <Text style={styles.reassignHint}>{t("installations.reassignAvailable", "Reassign available")}</Text>
            )}
          </View>
        ) : (
          <View />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function InstallationsScreen() {
  const { t } = useTranslation();
  const { data: session } = authClient.useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedInstallation, setSelectedInstallation] = useState<Installation | null>(null);
  const [selectedHandymanId, setSelectedHandymanId] = useState<string>("");

  const { data: installations, refetch } = useQuery({
    queryKey: ["installations"],
    queryFn: fetchInstallations,
  });
  const { data: handymen = [] } = useQuery({
    queryKey: ["partner-handymen-reassign"],
    queryFn: async (): Promise<HandymanOption[]> => {
      const list = await getHandymen();
      if (!Array.isArray(list)) return [];
      return list
        .map((h: any) => ({
          id: String(h?.id || h?.name || ""),
          name: String(h?.handyman_name || h?.name || "—"),
        }))
        .filter((h: HandymanOption) => !!h.id);
    },
  });

  const reassignMutation = useMutation({
    mutationFn: async ({
      installationId,
      handymanId,
      selfUserId,
    }: {
      installationId: string;
      handymanId: string;
      selfUserId?: string;
    }) => {
      if (handymanId === "__self__") {
        if (!selfUserId) {
          throw new Error("No session user found for self-assignment");
        }
        return assignInstallationToSelf(installationId, selfUserId);
      }
      return assignHandyman(installationId, handymanId);
    },
    onSuccess: async () => {
      await refetch();
      setShowReassignModal(false);
      setSelectedInstallation(null);
      setSelectedHandymanId("");
      Alert.alert(t("common.success", "Success"), t("installations.reassignSuccess", "Installation reassigned successfully."));
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error ||
        error?.message ||
        t("installations.reassignError", "Failed to reassign installation.");
      Alert.alert(t("common.error", "Error"), String(message));
    },
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Calculate stats using status groups
  const stats = {
    total: installations?.length ?? 0,
    scheduled: installations?.filter(i => isStatusInGroup(i.status, "Scheduled")).length ?? 0,
    enRoute: installations?.filter(i => isStatusInGroup(i.status, "En Route")).length ?? 0,
    inProgress: installations?.filter(i => isStatusInGroup(i.status, "In Progress")).length ?? 0,
    approved: installations?.filter(i => isStatusInGroup(i.status, "Approved")).length ?? 0,
    rejected: installations?.filter(i => isStatusInGroup(i.status, "Rejected")).length ?? 0,
  };

  const filteredInstallations = installations?.filter((inst) => {
    const customerName = inst.customerName || "";
    const serviceType = inst.serviceType || "";
    const handymanName = inst.handymanName || "";
    const address = inst.address || "";
    const title = inst.title || "";
    const description = inst.description || "";
    const matchesSearch =
      customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      handymanName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "all" || isStatusInGroup(inst.status, selectedStatus);
    return matchesSearch && matchesStatus;
  });

  const openReassignModal = (installation: Installation) => {
    setSelectedInstallation(installation);
    setSelectedHandymanId("");
    setShowReassignModal(true);
  };

  const canReassignInstallation = (status: string) =>
    ["INSTALLER_ASSIGNED", "EN_ROUTE", "ASSIGNED"].includes(
      (status || "").toUpperCase().replace(/\s+/g, "_").trim()
    );

  const confirmReassign = () => {
    if (!selectedInstallation?.id || !selectedHandymanId) return;
    reassignMutation.mutate({
      installationId: String(selectedInstallation.id),
      handymanId: selectedHandymanId,
      selfUserId: session?.user?.id,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("installations.title", "Installations")}</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { borderLeftColor: Colors.light.primary }]}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>{t("installations.total", "Total")}</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: Colors.light.info }]}>
          <Text style={styles.statValue}>{stats.scheduled}</Text>
          <Text style={styles.statLabel}>{t("installations.scheduled", "Scheduled")}</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: Colors.light.warning }]}>
          <Text style={styles.statValue}>{stats.inProgress}</Text>
          <Text style={styles.statLabel}>{t("installations.inProgress", "In Progress")}</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: Colors.light.success }]}>
          <Text style={styles.statValue}>{stats.approved}</Text>
          <Text style={styles.statLabel}>{t("installations.approved", "Approved")}</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: Colors.light.error }]}>
          <Text style={styles.statValue}>{stats.rejected}</Text>
          <Text style={styles.statLabel}>{t("installations.rejected", "Rejected")}</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.light.gray[500]} />
        <TextInput
          style={styles.searchInput}
          placeholder={t("installations.search", "Search installations...")}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Status Filter */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={["all", "Scheduled", "En Route", "In Progress", "Approved", "Rejected"] as string[]}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          (() => {
            const label =
              item === "all"
                ? t("common.all", "All")
                : item === "Scheduled"
                  ? t("installations.scheduled", "Scheduled")
                  : item === "En Route"
                    ? t("status.en_route", "En Route")
                    : item === "In Progress"
                      ? t("installations.inProgress", "In Progress")
                      : item === "Approved"
                        ? t("installations.approved", "Approved")
                        : item === "Rejected"
                          ? t("installations.rejected", "Rejected")
                          : item;
            return (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedStatus === item && styles.filterChipActive,
                ]}
                onPress={() => setSelectedStatus(item)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedStatus === item && styles.filterChipTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })()
        )}
      />

      {/* Installations List */}
      <FlatList
        data={filteredInstallations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.installList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <View>
            <InstallationCard installation={item} />
            {item.handymanName && canReassignInstallation(item.status) && (
              <TouchableOpacity
                style={styles.reassignButton}
                onPress={() => openReassignModal(item)}
              >
                <Text style={styles.reassignButtonText}>
                  {t("installations.reassign", "Reassign")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {t("installations.noInstallations", "No installations found")}
            </Text>
          </View>
        }
      />

      <Modal
        visible={showReassignModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReassignModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t("installations.reassign", "Reassign")}</Text>
            <Text style={styles.modalSubtitle}>
              {selectedInstallation?.customerName || t("installations.titleSingle", "Installation")}
            </Text>

            <FlatList
              data={[
                {
                  id: "__self__",
                  name: t("handymanAssignment.assignToMyself", "Assign to Myself"),
                },
                ...handymen,
              ]}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 280 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.handymanItem,
                    selectedHandymanId === item.id && styles.handymanItemSelected,
                  ]}
                  onPress={() => setSelectedHandymanId(item.id)}
                >
                  <Text
                    style={[
                      styles.handymanItemText,
                      selectedHandymanId === item.id && styles.handymanItemTextSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyHandymenText}>{t("chat.noAvailableHandymen", "No handymen available")}</Text>
              }
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowReassignModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>{t("common.cancel", "Cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={confirmReassign}
                disabled={!selectedHandymanId || reassignMutation.isPending}
              >
                {reassignMutation.isPending ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>{t("common.confirm", "Confirm")}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    flexWrap: "wrap",
    padding: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: "18%",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.light.gray[500],
    marginTop: 2,
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
  filterList: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.light.gray[100],
    marginRight: 8,
    height: 35,
    alignItems: 'center'
  },
  filterChipActive: {
    backgroundColor: Colors.light.primary,
    alignItems: 'center'
  },
  filterChipText: {
    fontSize: 14,
    color: Colors.light.gray[600],
  },
  filterChipTextActive: {
    color: "white",
    fontWeight: "500",
  },
  installList: {
    padding: 16,
    paddingTop: 8,
  },
  reassignButton: {
    marginTop: -4,
    marginBottom: 12,
    alignSelf: "flex-end",
    backgroundColor: Colors.light.white,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  reassignButtonText: {
    color: Colors.light.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  installCard: {
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
  installHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  serviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary + "10",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  installInfo: {
    flex: 1,
  },
  serviceType: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  customerSection: {
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
  installFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 12,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 13,
    color: Colors.light.gray[500],
  },
  handymanBadge: {
    backgroundColor: Colors.light.secondary + "20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  handymanText: {
    fontSize: 12,
    color: Colors.light.secondary,
    fontWeight: "500",
  },
  footerActions: {
    alignItems: "flex-end",
    gap: 4,
  },
  reassignHint: {
    fontSize: 11,
    color: Colors.light.primary,
    fontWeight: "600",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.gray[500],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Colors.light.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    gap: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.light.gray[600],
    marginBottom: 8,
  },
  handymanItem: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  handymanItemSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + "12",
  },
  handymanItemText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  handymanItemTextSelected: {
    color: Colors.light.primary,
    fontWeight: "600",
  },
  emptyHandymenText: {
    textAlign: "center",
    color: Colors.light.gray[500],
    paddingVertical: 12,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  modalCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  modalCancelButtonText: {
    color: Colors.light.text,
    fontWeight: "600",
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmButtonText: {
    color: Colors.light.white,
    fontWeight: "600",
  },
});
