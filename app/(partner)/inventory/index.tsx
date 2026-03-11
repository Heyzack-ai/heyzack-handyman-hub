import React, { useMemo, useState } from "react";
import {
  FlatList,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  CheckCircle2,
  Clock,
  Package,
  Search,
  Truck,
  XCircle,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { getOrderHistory, getShopifySSOUrl } from "@/lib/api/partner-api";

type OrderStatus = "Pending" | "Approved" | "Delivered" | "Cancelled";

interface PartnerOrderLineItem {
  title?: string;
  quantity?: number | string;
}

interface PartnerOrder {
  id?: string | number;
  order_number?: string | number;
  line_items?: PartnerOrderLineItem[];
  total_price?: string | number;
  financial_status?: string;
  fulfillment_status?: string;
  created_at?: string;
  updated_at?: string;
}

interface InventoryOrder {
  id: string;
  itemName: string;
  quantity: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  deliveryDate: string | null;
  description: string;
}

const ITEMS_PER_PAGE = 5;

const parseMoney = (v?: string | number): number => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/[^0-9.,-]/g, "").replace(/,/g, ".");
    const n = Number(cleaned);
    if (Number.isFinite(n)) return n;
  }
  return 0;
};

const deriveStatus = (financial?: string, fulfillment?: string): OrderStatus => {
  const f = (financial || "").toLowerCase();
  const fu = (fulfillment || "").toLowerCase();
  if (fu === "fulfilled") return "Delivered";
  if (f === "paid" || f === "partially_paid") return "Approved";
  if (f === "voided" || f === "refunded" || fu === "cancelled") return "Cancelled";
  return "Pending";
};

const mapOrders = (rawOrders: PartnerOrder[]): InventoryOrder[] => {
  return rawOrders.map((o) => {
    const lineItems = Array.isArray(o.line_items) ? o.line_items : [];
    const itemName = lineItems[0]?.title || "";
    const quantity = lineItems.reduce((acc, li) => acc + (Number(li?.quantity) || 0), 0);
    const totalAmount = parseMoney(o.total_price);
    const status = deriveStatus(o.financial_status, o.fulfillment_status);
    const createdAt = o.created_at || new Date().toISOString();
    const deliveryDate = status === "Delivered" ? o.updated_at || null : null;

    return {
      id: String(o.order_number || o.id || ""),
      itemName,
      quantity,
      totalAmount,
      status,
      createdAt,
      deliveryDate,
      description: itemName,
    };
  });
};

const getStatusColor = (status: OrderStatus) => {
  switch (status.toLowerCase()) {
    case "pending":
      return { bg: "#fef3c7", text: "#92400e" };
    case "approved":
      return { bg: "#dbeafe", text: "#1e40af" };
    case "delivered":
      return { bg: "#dcfce7", text: "#166534" };
    case "cancelled":
      return { bg: "#fee2e2", text: "#991b1b" };
    default:
      return { bg: "#f3f4f6", text: "#374151" };
  }
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
};

const openShopify = async () => {
  try {
    const response = await getShopifySSOUrl();
    const directUrl = typeof response === "string" ? response : response?.url;
    const fallback = "https://shop.heyzack.ai/";
    const url = directUrl || fallback;
    await Linking.openURL(url);
  } catch {
    await Linking.openURL("https://shop.heyzack.ai/");
  }
};

export default function InventoryScreen() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "delivered" | "cancelled">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<InventoryOrder | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ["partner-orders"],
    queryFn: async () => {
      const raw = (await getOrderHistory()) as PartnerOrder[];
      return mapOrders(Array.isArray(raw) ? raw : []);
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const summaryStats = useMemo(() => {
    const totalOrders = orders.length;
    const pending = orders.filter((o) => o.status === "Pending").length;
    const approved = orders.filter((o) => o.status === "Approved").length;
    const delivered = orders.filter((o) => o.status === "Delivered").length;
    const cancelled = orders.filter((o) => o.status === "Cancelled").length;
    return { totalOrders, pending, approved, delivered, cancelled };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || order.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const statusFilters = [
    { key: "all", label: t("orderStatus.all", "All") },
    { key: "pending", label: t("orderStatus.pending", "Pending") },
    { key: "approved", label: t("orderStatus.approved", "Approved") },
    { key: "delivered", label: t("orderStatus.delivered", "Delivered") },
    { key: "cancelled", label: t("orderStatus.cancelled", "Cancelled") },
  ] as const;

  const renderOrderCard = ({ item }: { item: InventoryOrder }) => {
    const statusStyle = getStatusColor(item.status);

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderTitle}>{item.id}</Text>
            <Text style={styles.orderSubtitle}>{item.itemName || "-"}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}> 
            <Text style={[styles.badgeText, { color: statusStyle.text }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.metaGrid}>
          <Text style={styles.metaText}>{t("orderDetails.quantity", "Qty")}: {item.quantity}</Text>
          <Text style={styles.metaText}>{t("orderDetails.total", "Total")}: €{item.totalAmount.toFixed(2)}</Text>
          <Text style={styles.metaText}>{t("orderDetails.placedOn", "Placed")}: {formatDate(item.createdAt)}</Text>
          {item.deliveryDate ? (
            <Text style={styles.metaText}>{t("orderDetails.deliveredOn", "Delivered")}: {formatDate(item.deliveryDate)}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.detailsBtn}
          onPress={() => {
            setSelectedOrder(item);
            setIsDetailsOpen(true);
          }}
        >
          <Text style={styles.detailsBtnText}>{t("orders.viewDetails", "View Details")}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t("orders.title", "Orders")}</Text>
          <Text style={styles.subtitle}>{t("orders.description", "Track your partner orders")}</Text>
        </View>
        <TouchableOpacity style={styles.shopNowBtn} onPress={openShopify}>
          <Text style={styles.shopNowText}>{t("orders.shopNow", "Shop Now")}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Package size={20} color="#3b82f6" />
          <Text style={styles.statValue}>{summaryStats.totalOrders}</Text>
          <Text style={styles.statLabel}>{t("orderSummary.total", "Total")}</Text>
        </View>
        <View style={styles.statCard}>
          <Clock size={20} color="#f59e0b" />
          <Text style={styles.statValue}>{summaryStats.pending}</Text>
          <Text style={styles.statLabel}>{t("orderSummary.pending", "Pending")}</Text>
        </View>
        <View style={styles.statCard}>
          <CheckCircle2 size={20} color="#2563eb" />
          <Text style={styles.statValue}>{summaryStats.approved}</Text>
          <Text style={styles.statLabel}>{t("orderSummary.approved", "Approved")}</Text>
        </View>
        <View style={styles.statCard}>
          <Truck size={20} color="#16a34a" />
          <Text style={styles.statValue}>{summaryStats.delivered}</Text>
          <Text style={styles.statLabel}>{t("orderSummary.delivered", "Delivered")}</Text>
        </View>
        <View style={styles.statCard}>
          <XCircle size={20} color="#dc2626" />
          <Text style={styles.statValue}>{summaryStats.cancelled}</Text>
          <Text style={styles.statLabel}>{t("orderSummary.cancelled", "Cancelled")}</Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Search size={18} color={Colors.light.gray[500]} />
        <TextInput
          style={styles.searchInput}
          placeholder={t("orders.searchPlaceholder", "Search by order or item")}
          value={searchTerm}
          onChangeText={(v) => {
            setSearchTerm(v);
            setCurrentPage(1);
          }}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {statusFilters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, statusFilter === f.key && styles.filterChipActive]}
            onPress={() => {
              setStatusFilter(f.key);
              setCurrentPage(1);
            }}
          >
            <Text style={[styles.filterChipText, statusFilter === f.key && styles.filterChipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.listTitle}>
        {t("orders.listTitle", "Orders")} ({filteredOrders.length})
      </Text>

      <FlatList
        data={paginatedOrders}
        keyExtractor={(item) => `${item.id}-${item.createdAt}`}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={renderOrderCard}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {isLoading
                ? t("common.loading", "Loading...")
                : t("orders.noOrders", "No orders found")}
            </Text>
          </View>
        }
        ListFooterComponent={
          totalPages > 1 ? (
            <View style={styles.paginationRow}>
              <TouchableOpacity
                style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
                disabled={currentPage === 1}
                onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <Text style={styles.pageBtnText}>{t("pagination.previous", "Previous")}</Text>
              </TouchableOpacity>
              <Text style={styles.pageIndicator}>{currentPage} / {totalPages}</Text>
              <TouchableOpacity
                style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
                disabled={currentPage === totalPages}
                onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                <Text style={styles.pageBtnText}>{t("pagination.next", "Next")}</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      <Modal visible={isDetailsOpen} transparent animationType="slide" onRequestClose={() => setIsDetailsOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t("orderDetails.dialogTitle", "Order Details")}</Text>

            {selectedOrder ? (
              <View style={{ gap: 8 }}>
                <Text style={styles.modalOrderId}>{t("orderDetails.orderId", "Order")}: {selectedOrder.id}</Text>
                <Text style={styles.modalDesc}>{selectedOrder.itemName || "-"}</Text>
                <Text style={styles.modalDesc}>{selectedOrder.description || "-"}</Text>

                <View style={styles.modalGrid}>
                  <Text style={styles.metaText}>{t("orderDetails.quantity", "Qty")}: {selectedOrder.quantity}</Text>
                  <Text style={styles.metaText}>{t("orderDetails.total", "Total")}: €{selectedOrder.totalAmount.toFixed(2)}</Text>
                  <Text style={styles.metaText}>{t("orderDetails.orderedOn", "Ordered")}: {formatDate(selectedOrder.createdAt)}</Text>
                  {selectedOrder.deliveryDate ? (
                    <Text style={styles.metaText}>{t("orderDetails.deliveredOn", "Delivered")}: {formatDate(selectedOrder.deliveryDate)}</Text>
                  ) : null}
                </View>
              </View>
            ) : null}

            <TouchableOpacity style={styles.closeBtn} onPress={() => setIsDetailsOpen(false)}>
              <Text style={styles.closeBtnText}>{t("common.close", "Close")}</Text>
            </TouchableOpacity>
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
    fontSize: 22,
    fontWeight: "700",
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.light.gray[600],
    marginTop: 2,
  },
  shopNowBtn: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  shopNowText: {
    color: "white",
    fontWeight: "700",
    fontSize: 13,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 8,
  },
  statCard: {
    width: "31%",
    minHeight: 88,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 10,
    justifyContent: "space-between",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.light.gray[600],
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    marginHorizontal: 12,
    marginTop: 10,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    height: 44,
    marginLeft: 8,
    fontSize: 15,
    color: Colors.light.text,
  },
  filterRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    alignItems: "center",
  },
  filterScroll: {
    flexGrow: 0,
    maxHeight: 62,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 12,
    height: 36,
    justifyContent: "center",
    borderRadius: 999,
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
    fontWeight: "700",
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.text,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 20,
    gap: 10,
  },
  orderCard: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 12,
    gap: 10,
  },
  orderTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  orderTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.text,
  },
  orderSubtitle: {
    fontSize: 13,
    color: Colors.light.gray[600],
    marginTop: 2,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    color: Colors.light.gray[700],
  },
  detailsBtn: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  detailsBtnText: {
    fontSize: 12,
    color: Colors.light.text,
    fontWeight: "600",
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    color: Colors.light.gray[600],
    fontSize: 14,
  },
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  pageBtn: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  pageBtnDisabled: {
    opacity: 0.45,
  },
  pageBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.text,
  },
  pageIndicator: {
    fontSize: 12,
    color: Colors.light.gray[600],
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.light.text,
  },
  modalOrderId: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.text,
  },
  modalDesc: {
    fontSize: 13,
    color: Colors.light.gray[600],
  },
  modalGrid: {
    gap: 6,
    marginTop: 4,
  },
  closeBtn: {
    marginTop: 10,
    alignSelf: "flex-end",
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  closeBtnText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
  },
});
