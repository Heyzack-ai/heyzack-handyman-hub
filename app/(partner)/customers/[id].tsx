import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Calendar,
  Mail,
  MapPin,
  Phone,
  Save,
  Settings,
  User,
  X,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import {
  getCustomerById,
  getCustomerTimeline,
  getInstallationById,
  updateCustomer,
  type UpdateCustomerPayload,
} from "@/lib/api/partner-api";

type TabKey = "details" | "installations" | "timeline" | "contact";

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
};

const getStatusColor = (status?: string) => {
  const normalized = (status || "").toLowerCase();
  if (normalized === "active") {
    return { bg: Colors.light.success + "20", text: Colors.light.success };
  }
  if (normalized === "inactive") {
    return { bg: Colors.light.error + "20", text: Colors.light.error };
  }
  return { bg: Colors.light.gray[200], text: Colors.light.gray[600] };
};

export default function PartnerCustomerDetailsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id, mode } = useLocalSearchParams<{ id: string | string[]; mode?: string }>();
  const customerId = Array.isArray(id) ? id[0] : id;
  const normalizedRouteCustomerId = String(customerId || "").trim();
  const isValidCustomerId =
    !!normalizedRouteCustomerId &&
    normalizedRouteCustomerId !== "undefined" &&
    normalizedRouteCustomerId !== "null";
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<UpdateCustomerPayload>({
    customerName: "",
    email: "",
    phone: "",
    address: "",
    status: "active",
  });

  const { data: customer, isLoading, isError } = useQuery({
    queryKey: ["customer-detail", customerId],
    queryFn: async () => getCustomerById(String(customerId)),
    enabled: isValidCustomerId,
  });

  const customerMatchesRoute = useMemo(() => {
    if (!customer || !isValidCustomerId) return false;
    const customerDataId = String(
      customer?.id || customer?.customerId || customer?.name || ""
    ).trim();
    return customerDataId === normalizedRouteCustomerId;
  }, [customer, isValidCustomerId, normalizedRouteCustomerId]);

  const installationIds = useMemo(() => {
    if (!customer?.installations || !Array.isArray(customer.installations)) {
      return [] as string[];
    }
    return customer.installations
      .map((item: any) => item?.id || item?.installationId || item?.name)
      .filter(Boolean);
  }, [customer]);

  const { data: installations = [], isLoading: isLoadingInstallations } = useQuery({
    queryKey: ["customer-installations", customerId, installationIds.join(",")],
    queryFn: async () => Promise.all(installationIds.map((installationId) => getInstallationById(String(installationId)))),
    enabled: installationIds.length > 0,
  });

  const { data: timeline = [] } = useQuery({
    queryKey: ["customer-timeline", customerId],
    queryFn: async () => getCustomerTimeline(String(customerId)),
    enabled: isValidCustomerId,
  });

  const normalizedTimeline = useMemo(() => {
    const raw: any = timeline;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.timeline)) return raw.timeline;
    if (Array.isArray(raw?.events)) return raw.events;
    if (Array.isArray(raw?.items)) return raw.items;
    if (Array.isArray(raw?.history)) return raw.history;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.data?.timeline)) return raw.data.timeline;
    if (Array.isArray(raw?.data?.events)) return raw.data.events;
    if (Array.isArray(raw?.data?.items)) return raw.data.items;
    return [];
  }, [timeline]);

  const updateMutation = useMutation({
    mutationFn: async (payload: UpdateCustomerPayload) => updateCustomer(String(customerId), payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["customer-detail", customerId] }),
        queryClient.invalidateQueries({ queryKey: ["customers"] }),
        queryClient.invalidateQueries({ queryKey: ["partner-dashboard"] }),
      ]);
      setEditOpen(false);
    },
  });

  useEffect(() => {
    if (!customer) return;
    setForm({
      customerName:
        customer?.customerName ||
        customer?.name ||
        "",
      email: customer?.email || "",
      phone: customer?.phone || "",
      address: customer?.address || "",
      status: (customer?.status || "active") as "active" | "inactive",
    });
  }, [customer]);

  useEffect(() => {
    if (mode === "edit") {
      setEditOpen(true);
    }
  }, [mode]);

  if (isLoading || (customer && !customerMatchesRoute)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.light.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !customer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>{t("customers.notFound", "Customer not found")}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
            <Text style={styles.primaryBtnText}>{t("common.back", "Back")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const customerName =
    customer?.customerName || customer?.name || t("customers.customer", "Customer");
  const statusColor = getStatusColor(customer?.status);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={20} color={Colors.light.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{customerName}</Text>
          <Text style={styles.subtitle}>{t("customers.detailsSubtitle", "Customer details")}</Text>
        </View>
        <TouchableOpacity style={styles.primaryBtnSm} onPress={() => setEditOpen(true)}>
          <Text style={styles.primaryBtnText}>{t("common.edit", "Edit")}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
          <Text style={[styles.statusText, { color: statusColor.text }]}>
            {(customer?.status || "active").toString()}
          </Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {(["details", "installations", "timeline", "contact"] as TabKey[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === "details"
                ? t("customers.detailsTab", "Details")
                : tab === "installations"
                ? t("customers.installations", "Installations")
                : tab === "timeline"
                ? t("installationDetails.tabs.timeline", "Timeline")
                : t("customers.contact", "Contact")}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 24 }}>
        {activeTab === "details" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t("customers.contactInformation", "Contact Information")}</Text>
            <View style={styles.infoRow}>
              <User size={16} color={Colors.light.gray[600]} />
              <Text style={styles.infoText}>{customerName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Mail size={16} color={Colors.light.gray[600]} />
              <Text style={styles.infoText}>{customer?.email || t("common.notAvailable", "—")}</Text>
            </View>
            <View style={styles.infoRow}>
              <Phone size={16} color={Colors.light.gray[600]} />
              <Text style={styles.infoText}>{customer?.phone || t("common.notAvailable", "—")}</Text>
            </View>
            <View style={styles.infoRow}>
              <MapPin size={16} color={Colors.light.gray[600]} />
              <Text style={styles.infoText}>{customer?.address || t("common.notAvailable", "—")}</Text>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>{t("customers.meta", "Meta")}</Text>
            <View style={styles.infoRow}>
              <Calendar size={16} color={Colors.light.gray[600]} />
              <Text style={styles.infoText}>{t("customers.created", "Created")}: {formatDate(customer?.createdAt)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Calendar size={16} color={Colors.light.gray[600]} />
              <Text style={styles.infoText}>{t("customers.updated", "Updated")}: {formatDate(customer?.updatedAt)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Settings size={16} color={Colors.light.gray[600]} />
              <Text style={styles.infoText}>{t("customers.partnerId", "Partner ID")}: {customer?.partnerId || t("common.notAvailable", "—")}</Text>
            </View>
          </View>
        )}

        {activeTab === "installations" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t("customers.installations", "Installations")}</Text>
            {isLoadingInstallations ? (
              <ActivityIndicator color={Colors.light.primary} />
            ) : installations.length > 0 ? (
              installations.map((installation: any) => (
                <View key={installation?.id || installation?.name} style={styles.listItem}>
                  <Text style={styles.listTitle}>{installation?.title || t("installations.titleSingle", "Installation")}</Text>
                  <Text style={styles.listSubText}>{t("customers.statusLabel", "Status")}: {installation?.status || t("common.notAvailable", "—")}</Text>
                  <Text style={styles.listSubText}>
                    {t("installationDetails.scheduledLabel", "Scheduled")}: {formatDate(installation?.scheduledDate)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>{t("customers.noInstallations", "No installations found.")}</Text>
            )}
          </View>
        )}

        {activeTab === "timeline" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t("installationDetails.tabs.timeline", "Timeline")}</Text>
            {normalizedTimeline.length > 0 ? (
              normalizedTimeline.map((item: any, index: number) => (
                <View key={item?.id || `timeline-${index}`} style={styles.listItem}>
                  <Text style={styles.listTitle}>{item?.title || item?.type || t("installationDetails.updated", "Event")}</Text>
                  <Text style={styles.listSubText}>{item?.description || item?.message || t("common.notAvailable", "—")}</Text>
                  <Text style={styles.listSubText}>{formatDate(item?.createdAt || item?.date)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>{t("installationDetails.noTimelineEvents", "No timeline events available.")}</Text>
            )}
          </View>
        )}

        {activeTab === "contact" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t("customers.contact", "Contact")}</Text>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => customer?.phone && Linking.openURL(`tel:${customer.phone}`)}
            >
              <Phone size={16} color={Colors.light.primary} />
              <Text style={styles.actionBtnText}>{customer?.phone || t("customers.noPhoneAvailable", "No phone available")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => customer?.email && Linking.openURL(`mailto:${customer.email}`)}
            >
              <Mail size={16} color={Colors.light.primary} />
              <Text style={styles.actionBtnText}>{customer?.email || t("customers.noEmailAvailable", "No email available")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal visible={editOpen} transparent animationType="slide" onRequestClose={() => setEditOpen(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
            style={styles.keyboardAvoiding}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t("customers.editCustomer", "Edit Customer")}</Text>
                <TouchableOpacity onPress={() => setEditOpen(false)}>
                  <X size={18} color={Colors.light.gray[600]} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder={t("customers.namePlaceholder", "Name")}
                value={form.customerName || ""}
                onChangeText={(value) => setForm((prev) => ({ ...prev, customerName: value }))}
              />
              <TextInput
                style={styles.input}
                placeholder={t("customers.emailPlaceholder", "Email")}
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email || ""}
                onChangeText={(value) => setForm((prev) => ({ ...prev, email: value }))}
              />
              <TextInput
                style={styles.input}
                placeholder={t("customers.phonePlaceholder", "Phone")}
                keyboardType="phone-pad"
                value={form.phone || ""}
                onChangeText={(value) => setForm((prev) => ({ ...prev, phone: value }))}
              />
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder={t("customers.addressPlaceholder", "Address")}
                multiline
                value={form.address || ""}
                onChangeText={(value) => setForm((prev) => ({ ...prev, address: value }))}
              />

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => updateMutation.mutate(form)}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <ActivityIndicator color={Colors.light.white} />
                ) : (
                  <>
                    <Save size={16} color={Colors.light.white} />
                    <Text style={styles.primaryBtnText}>{t("settings.saveChanges", "Save Changes")}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.light.gray[500],
    marginTop: 2,
  },
  statusRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.light.gray[100],
  },
  tabActive: {
    backgroundColor: Colors.light.primary + "15",
  },
  tabText: {
    fontSize: 13,
    color: Colors.light.gray[600],
    fontWeight: "500",
  },
  tabTextActive: {
    color: Colors.light.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: Colors.light.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.gray[700],
    flex: 1,
  },
  listItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
  listSubText: {
    fontSize: 12,
    color: Colors.light.gray[600],
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.gray[500],
    textAlign: "center",
    paddingVertical: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  actionBtnText: {
    fontSize: 14,
    color: Colors.light.text,
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
  keyboardAvoiding: {
    width: "100%",
    justifyContent: "flex-end",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.light.text,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.light.text,
    backgroundColor: Colors.light.white,
  },
  multiline: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  primaryBtn: {
    marginTop: 6,
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryBtnSm: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: Colors.light.white,
    fontSize: 14,
    fontWeight: "600",
  },
});
