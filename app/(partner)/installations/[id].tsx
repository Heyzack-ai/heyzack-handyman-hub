import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  Check,
  Clock3,
  FileText,
  Mail,
  MapPin,
  Package,
  Phone,
  User,
  X,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import {
  getInstallationById,
  getShopifyProducts,
  ShopifyProduct,
  updateInstallation,
  updateInstallationStatus,
} from "@/lib/api/partner-api";
import { ProductCatalogItem, useGetProduct } from "@/app/api/products/getProduct";

type DetailsTab = "overview" | "handyman" | "products" | "timeline" | "notes";

const getStatusColor = (status?: string) => {
  const normalized = (status || "").toUpperCase();
  if (["CUSTOMER_APPROVED", "APPROVED", "ACCEPTED", "COMPLETED", "JOB_COMPLETED"].includes(normalized)) {
    return { bg: Colors.light.success + "20", text: Colors.light.success };
  }
  if (["REJECTED", "CANCELLED"].includes(normalized)) {
    return { bg: Colors.light.error + "20", text: Colors.light.error };
  }
  if (["EN_ROUTE", "STARTED", "INSTALLATION_IN_PROGRESS", "IN_PROGRESS"].includes(normalized)) {
    return { bg: Colors.light.warning + "20", text: Colors.light.warning };
  }
  return { bg: Colors.light.info + "20", text: Colors.light.info };
};

const prettyStatus = (status?: string) => {
  if (!status) return "";
  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatDate = (dateValue?: string) => {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
};

const firstStringValue = (obj: any): string => {
  if (!obj || typeof obj !== "object") return "";
  for (const value of Object.values(obj)) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

const normalizeProductOption = (raw: any): ProductCatalogItem | null => {
  if (!raw) return null;

  if (typeof raw === "string") {
    const text = raw.trim();
    if (!text) return null;
    return {
      id: text,
      item: text,
      item_name: text,
      name: text,
    };
  }

  const productName = String(
    raw?.productName ||
    raw?.item_name ||
    raw?.name ||
    raw?.item ||
    raw?.title ||
    raw?.product?.title ||
    raw?.product?.name ||
    raw?.product?.item_name ||
    raw?.product?.productName ||
    firstStringValue(raw)
  ).trim();

  const productCode = String(
    raw?.sku ||
    raw?.item ||
    raw?.inventorycode ||
    raw?.handle ||
    raw?.id ||
    raw?.product?.sku ||
    raw?.product?.item ||
    raw?.product?.id ||
    productName
  ).trim();

  if (!productName) return null;

  return {
    id: productCode || productName,
    item: productCode || productName,
    item_name: productName,
    name: productName,
    sku: raw?.sku ? String(raw.sku) : raw?.product?.sku ? String(raw.product.sku) : undefined,
  };
};

function InstallationProductRow({
  product,
  index,
  t,
}: {
  product: any;
  index: number;
  t: (key: string, defaultValue?: string) => string;
}) {
  const productId = String(
    product?.inventoryItemId ??
    product?.item ??
    product?.inventorycode ??
    product?.sku ??
    product?.id ??
    ""
  ).trim();
  const { data: mappedProduct } = useGetProduct(productId);
  const normalizedOption = normalizeProductOption(product);
  const displayName =
    mappedProduct?.item_name ||
    mappedProduct?.name ||
    normalizedOption?.item_name ||
    t("installations.product", "Product");
  const quantity = Number(product?.quantity || product?.qty || 1) || 1;

  return (
    <View key={product?.id || product?.item || `product-${index}`} style={styles.listItem}>
      <Text style={styles.listPrimary}>{displayName}</Text>
      <Text style={styles.listSecondary}>
        {t("orderDetails.quantity", "Quantity")}: {quantity}
      </Text>
      {!!productId && (
        <Text style={styles.listTertiary}>
          {t("installationDetails.productCode", "Product Code")}: {productId}
        </Text>
      )}
    </View>
  );
}

export default function PartnerInstallationDetailsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const installationId = Array.isArray(id) ? id[0] : id;
  const isValidId = !!installationId && installationId !== "undefined" && installationId !== "null";
  const queryClient = useQueryClient();

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeTab, setActiveTab] = useState<DetailsTab>("overview");
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductCatalogItem | null>(null);
  const [extraProductQty, setExtraProductQty] = useState("1");

  const { data: shopifyProductsResponse, isLoading: isProductsCatalogLoading } = useQuery({
    queryKey: ["shopify-products", showAddProductModal],
    queryFn: () =>
      getShopifyProducts({
        limit: 100,
        fields: "id,title,handle,vendor,variants",
      }),
    enabled: showAddProductModal,
  });

  const { data: installation, isLoading, isError } = useQuery({
    queryKey: ["installation-detail", installationId],
    queryFn: async () => getInstallationById(String(installationId)),
    enabled: isValidId,
  });

  const normalizedInstallation = useMemo(() => {
    if (!installation) return null;
    const notesArray = Array.isArray(installation?.notes)
      ? installation.notes
      : installation?.notes
        ? [{ text: String(installation.notes), createdAt: installation?.updatedAt || installation?.createdAt }]
        : [];
    const timelineArray = Array.isArray((installation as any)?.timeline)
      ? (installation as any).timeline
      : [];
    const productsArray = Array.isArray((installation as any)?.products)
      ? (installation as any).products
      : [];

    return {
      id: String(installation?.id || installation?.installationId || installation?.name || ""),
      title:
        installation?.title ||
        installation?.serviceType ||
        t("installations.titleSingle", "Installation"),
      orderLabel: installation?.name || installation?.id || installation?.installationId || "—",
      status: installation?.status || "",
      customerName:
        installation?.customer?.customerName ||
        installation?.customer?.name ||
        installation?.customerName ||
        t("customers.customer", "Customer"),
      customerEmail: installation?.customer?.email || installation?.customerEmail || "",
      customerPhone: installation?.customer?.phone || installation?.customerPhone || "",
      address: installation?.customer?.address || installation?.address || "—",
      handymanName:
        installation?.handyman?.name ||
        installation?.handymanName ||
        t("installations.noHandymanAssigned", "No Handyman Assigned"),
      handymanEmail: installation?.handyman?.email || "",
      handymanPhone: installation?.handyman?.phone || "",
      partnerName:
        installation?.partner?.name ||
        installation?.partner?.partnerName ||
        installation?.partnerName ||
        "—",
      partnerCode:
        installation?.partner?.id ||
        installation?.partner?.name ||
        "—",
      scheduledDate:
        installation?.scheduledDate ||
        installation?.date ||
        "",
      createdAt: installation?.createdAt || installation?.creation || "",
      description: installation?.description || t("installations.noDescription", "No description"),
      notes: notesArray,
      timeline: timelineArray,
      products: productsArray,
    };
  }, [installation, t]);

  const selectableProducts = useMemo(() => {
    const shopifyProducts = Array.isArray(shopifyProductsResponse?.data?.products)
      ? (shopifyProductsResponse?.data?.products as ShopifyProduct[])
      : [];
    const apiProducts = shopifyProducts
      .map((p) => {
        const title = String(p?.title || "").trim();
        const sku = String(p?.variants?.[0]?.sku || "").trim();
        const handle = String(p?.handle || "").trim();
        const id = String(p?.id || sku || handle || title).trim();
        if (!title && !id) return null;
        return {
          id: id || title,
          item: sku || handle || id || title,
          item_name: title || id,
          name: title || id,
          sku: sku || undefined,
        } as ProductCatalogItem;
      })
      .filter(Boolean) as ProductCatalogItem[];
    const localProducts = (normalizedInstallation?.products || [])
      .map((p: any) => normalizeProductOption(p))
      .filter(Boolean) as ProductCatalogItem[];

    const merged = [...apiProducts, ...localProducts];
    const seen = new Set<string>();
    const deduped = merged.filter((p) => {
      const key = `${p.id}::${p.item_name || p.name || p.item || ""}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (!productSearchTerm.trim()) return deduped;

    const q = productSearchTerm.trim().toLowerCase();
    return deduped.filter((p) => {
      const hay = `${p.item_name || ""} ${p.name || ""} ${p.item || ""} ${p.sku || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [shopifyProductsResponse, normalizedInstallation?.products, productSearchTerm]);

  const modalSelectableProducts = useMemo(() => {
    if (selectableProducts.length > 0) return selectableProducts;
    const raw = (normalizedInstallation?.products || [])
      .map((p: any) => normalizeProductOption(p))
      .filter(Boolean) as ProductCatalogItem[];

    if (!productSearchTerm.trim()) return raw;
    const q = productSearchTerm.trim().toLowerCase();
    return raw.filter((p) => {
      const hay = `${p.item_name || ""} ${p.name || ""} ${p.item || ""} ${p.sku || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [selectableProducts, normalizedInstallation?.products, productSearchTerm]);

  const rejectMutation = useMutation({
    mutationFn: async (reason: string) =>
      updateInstallationStatus(String(installationId), "rejected", reason),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["installations"] }),
        queryClient.invalidateQueries({ queryKey: ["installation-detail", installationId] }),
      ]);
      setShowRejectModal(false);
      setRejectionReason("");
      Alert.alert(t("common.success", "Success"), t("installations.rejectSuccess", "Installation rejected."));
    },
    onError: () => {
      Alert.alert(t("common.error", "Error"), t("installations.rejectError", "Failed to reject installation."));
    },
  });

  const addProductMutation = useMutation({
    mutationFn: async ({
      selectedTitle,
      sku,
      quantity,
    }: {
      selectedTitle: string;
      sku?: string;
      quantity: number;
    }) => {
      const resolvedInstallationId = String(
        (installation as any)?._id ||
        (installation as any)?.id ||
        (installation as any)?.installationId ||
        installationId
      );

      const existingProducts = (normalizedInstallation?.products || [])
        .map((p: any) => {
          const productName =
            String(p?.productName || p?.item_name || p?.name || p?.item || "").trim();
          const qty = Number(p?.quantity || p?.qty || 0);
          const productSku = String(p?.sku || p?.item || p?.inventorycode || "").trim();
          if (!productName || qty <= 0) return null;
          return {
            productName,
            quantity: qty,
            ...(productSku ? { sku: productSku } : {}),
          };
        })
        .filter(Boolean) as { productName: string; quantity: number; sku?: string }[];

      const nextProducts = [
        ...existingProducts,
        {
          productName: selectedTitle,
          quantity,
          ...(sku ? { sku } : {}),
        },
      ];

      return updateInstallation(resolvedInstallationId, { products: nextProducts });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["installations"] }),
        queryClient.invalidateQueries({ queryKey: ["installation-detail", installationId] }),
      ]);
      setShowAddProductModal(false);
      setSelectedProduct(null);
      setProductSearchTerm("");
      setExtraProductQty("1");
      Alert.alert(t("common.success", "Success"), t("installations.extraProductAdded", "Extra product added."));
    },
    onError: () => {
      Alert.alert(t("common.error", "Error"), t("installations.extraProductAddError", "Failed to add extra product."));
    },
  });

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      Alert.alert(t("installations.validationTitle", "Validation"), t("installations.rejectionReasonRequired", "Please provide a rejection reason."));
      return;
    }
    rejectMutation.mutate(rejectionReason.trim());
  };

  const handleAddExtraProduct = () => {
    const quantity = Number(extraProductQty);
    const resolvedName =
      selectedProduct?.item_name ||
      selectedProduct?.name ||
      selectedProduct?.item ||
      selectedProduct?.id ||
      "";
    const sku = selectedProduct?.sku || "";

    if (!resolvedName) {
      Alert.alert(t("installations.validationTitle", "Validation"), t("installations.selectProductValidation", "Please select a product."));
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      Alert.alert(t("installations.validationTitle", "Validation"), t("installations.validQuantityValidation", "Please enter a valid quantity."));
      return;
    }

    addProductMutation.mutate({
      selectedTitle: resolvedName,
      sku,
      quantity,
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !normalizedInstallation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>{t("installations.notFound", "Installation not found")}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
            <Text style={styles.primaryBtnText}>{t("common.back", "Back")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const status = getStatusColor(normalizedInstallation.status);
  const customerInitial = (normalizedInstallation.customerName || "?").charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.light.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {t("installations.detailsForOrder", "Installation for Order")} {normalizedInstallation.orderLabel}
          </Text>
          <Text style={styles.subtitle}>{normalizedInstallation.title}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.customerHeroCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{customerInitial}</Text>
          </View>
          <Text style={styles.customerHeroName}>{normalizedInstallation.customerName}</Text>
          <Text style={styles.customerHeroSub}>{normalizedInstallation.partnerName}</Text>
          <Text style={styles.customerHeroSub}>{normalizedInstallation.customerEmail || t("common.notAvailable", "—")}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg, marginTop: 12 }]}>
            <Text style={[styles.statusText, { color: status.text }]}>
              {prettyStatus(normalizedInstallation.status) || t("status.unknown", "Unknown")}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("installationDetails.customerInformation", "Customer Information")}</Text>
          <View style={styles.row}>
            <User size={16} color={Colors.light.gray[600]} />
            <Text style={styles.rowText}>{normalizedInstallation.customerName}</Text>
          </View>
          {!!normalizedInstallation.customerEmail && (
            <View style={styles.row}>
              <Mail size={16} color={Colors.light.gray[600]} />
              <Text style={styles.rowText}>{normalizedInstallation.customerEmail}</Text>
            </View>
          )}
          {!!normalizedInstallation.customerPhone && (
            <View style={styles.row}>
              <Phone size={16} color={Colors.light.gray[600]} />
              <Text style={styles.rowText}>{normalizedInstallation.customerPhone}</Text>
            </View>
          )}
          <View style={styles.row}>
            <MapPin size={16} color={Colors.light.gray[600]} />
            <Text style={styles.rowText}>{normalizedInstallation.address}</Text>
          </View>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              normalizedInstallation.customerPhone &&
              Linking.openURL(`tel:${normalizedInstallation.customerPhone}`)
            }
          >
            <Phone size={16} color={Colors.light.gray[700]} />
            <Text style={styles.actionButtonText}>{t("installationDetails.callCustomer", "Call Customer")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              normalizedInstallation.customerEmail &&
              Linking.openURL(`mailto:${normalizedInstallation.customerEmail}`)
            }
          >
            <Mail size={16} color={Colors.light.gray[700]} />
            <Text style={styles.actionButtonText}>{t("installationDetails.emailCustomer", "Email Customer")}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabList}
        >
          {([
            { key: "overview", label: t("installationDetails.tabs.overview", "Overview"), icon: FileText },
            { key: "handyman", label: t("installationDetails.tabs.handyman", "Handyman"), icon: User },
            { key: "products", label: t("installationDetails.tabs.products", "Products"), icon: Package },
            { key: "timeline", label: t("installationDetails.tabs.timeline", "Timeline"), icon: Clock3 },
            { key: "notes", label: t("installationDetails.tabs.notes", "Notes"), icon: FileText },
          ] as { key: DetailsTab; label: string; icon: any }[]).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Icon size={14} color={isActive ? Colors.light.primary : Colors.light.gray[600]} />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {activeTab === "overview" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t("installationDetails.overviewTitle", "Installation overview")}</Text>
            <Text style={styles.sectionSubTitle}>{t("installationDetails.overviewSubtitle", "Key details at a glance")}</Text>
            <View style={[styles.statusBadge, { backgroundColor: status.bg, marginBottom: 14 }]}>
              <Text style={[styles.statusText, { color: status.text }]}>
                {prettyStatus(normalizedInstallation.status) || t("status.unknown", "Unknown")}
              </Text>
            </View>

            <View style={styles.gridRow}>
              <View style={styles.gridCell}>
                <Text style={styles.metaLabel}>{t("installationDetails.idLabel", "ID")}</Text>
                <Text style={styles.metaValue}>{normalizedInstallation.id || t("common.notAvailable", "—")}</Text>
              </View>
              <View style={styles.gridCell}>
                <Text style={styles.metaLabel}>{t("installationDetails.scheduledLabel", "Scheduled")}</Text>
                <Text style={styles.metaValue}>{formatDate(normalizedInstallation.scheduledDate)}</Text>
              </View>
            </View>
            <View style={styles.gridRow}>
              <View style={styles.gridCell}>
                <Text style={styles.metaLabel}>{t("installationDetails.createdLabel", "Created")}</Text>
                <Text style={styles.metaValue}>{formatDate(normalizedInstallation.createdAt)}</Text>
              </View>
              <View style={styles.gridCell}>
                <Text style={styles.metaLabel}>{t("installationDetails.partnerInformation", "Partner Information")}</Text>
                <Text style={styles.metaValue}>{normalizedInstallation.partnerName}</Text>
              </View>
            </View>
            <View style={styles.gridRow}>
              <View style={styles.gridCell}>
                <Text style={styles.metaLabel}>{t("installationDetails.assignedHandyman", "Assigned Handyman")}</Text>
                <Text style={styles.metaValue}>{normalizedInstallation.handymanName}</Text>
              </View>
              <View style={styles.gridCell}>
                <Text style={styles.metaLabel}>{t("installationDetails.partnerCode", "Partner Code")}</Text>
                <Text style={styles.metaValue}>{normalizedInstallation.partnerCode}</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === "handyman" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t("installationDetails.tabs.handyman", "Handyman")}</Text>
            <Text style={styles.bodyText}>{normalizedInstallation.handymanName}</Text>
            {!!normalizedInstallation.handymanEmail && (
              <Text style={styles.bodyText}>{normalizedInstallation.handymanEmail}</Text>
            )}
            {!!normalizedInstallation.handymanPhone && (
              <Text style={styles.bodyText}>{normalizedInstallation.handymanPhone}</Text>
            )}
          </View>
        )}

        {activeTab === "products" && (
          <View style={styles.card}>
            <View style={styles.productsHeader}>
              <Text style={styles.sectionTitle}>{t("installationDetails.tabs.products", "Products")}</Text>
              <TouchableOpacity
                style={styles.addExtraBtn}
                onPress={() => {
                  setShowAddProductModal(true);
                  setProductSearchTerm("");
                  setSelectedProduct(null);
                }}
              >
                <Text style={styles.addExtraBtnText}>{t("installationDetails.productAllocation.addProduct", "Add Extra Product")}</Text>
              </TouchableOpacity>
            </View>
            {normalizedInstallation.products.length > 0 ? (
              normalizedInstallation.products.map((product: any, index: number) => (
                <InstallationProductRow
                  key={product?.id || product?.item || `product-${index}`}
                  product={product}
                  index={index}
                  t={t}
                />
              ))
            ) : (
              <Text style={styles.bodyMuted}>{t("installationDetails.productAllocation.emptyTitle", "No products attached.")}</Text>
            )}
          </View>
        )}

        {activeTab === "timeline" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t("installationDetails.tabs.timeline", "Timeline")}</Text>
            {normalizedInstallation.timeline.length > 0 ? (
              normalizedInstallation.timeline.map((event: any, index: number) => (
                <View key={event?.id || `timeline-${index}`} style={styles.listItem}>
                  <Text style={styles.listPrimary}>
                    {event?.title || event?.status || event?.type || t("installationDetails.updated", "Event")}
                  </Text>
                  <Text style={styles.listSecondary}>
                    {event?.description || event?.message || t("common.notAvailable", "—")}
                  </Text>
                  <Text style={styles.listTertiary}>
                    {formatDate(event?.createdAt || event?.date)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.bodyMuted}>{t("installationDetails.noTimelineEvents", "No timeline events available.")}</Text>
            )}
          </View>
        )}

        {activeTab === "notes" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t("installationDetails.tabs.notes", "Notes")}</Text>
            {normalizedInstallation.notes.length > 0 ? (
              normalizedInstallation.notes.map((note: any, index: number) => (
                <View key={note?.id || `note-${index}`} style={styles.listItem}>
                  <Text style={styles.listSecondary}>{note?.text || String(note)}</Text>
                  <Text style={styles.listTertiary}>
                    {formatDate(note?.createdAt || note?.date)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.bodyMuted}>{t("installationDetails.noNotesAvailable", "No notes available.")}</Text>
            )}
          </View>
        )}

        {!["REJECTED", "CANCELLED"].includes((normalizedInstallation.status || "").toUpperCase()) && (
          <View style={styles.actionsCard}>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => setShowRejectModal(true)}>
              <Text style={styles.rejectBtnText}>{t("installationDetails.rejectButton", "Reject Installation")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showAddProductModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddProductModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
            style={styles.keyboardAvoiding}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t("installationDetails.productAllocation.addProduct", "Add Extra Product")}</Text>
                <TouchableOpacity onPress={() => setShowAddProductModal(false)}>
                  <X size={18} color={Colors.light.gray[600]} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.modalInput}
                placeholder={t("installationDetails.productAllocation.searchPlaceholder", "Search product")}
                value={productSearchTerm}
                onChangeText={setProductSearchTerm}
              />
              <View style={styles.productSelectionList}>
                <ScrollView keyboardShouldPersistTaps="handled">
                  {isProductsCatalogLoading ? (
                    <View style={styles.selectionCentered}>
                      <ActivityIndicator size="small" color={Colors.light.primary} />
                    </View>
                  ) : modalSelectableProducts.length > 0 ? (
                    modalSelectableProducts.map((product) => {
                      const productId = String(product.id || product.item || product.sku || "");
                      const isSelected = String(selectedProduct?.id || selectedProduct?.item || selectedProduct?.sku || "") === productId;
                      const productName =
                        product.item_name || product.name || product.item || productId;
                      const productCode = product.item || product.sku || productId;
                      return (
                        <TouchableOpacity
                          key={productId}
                          style={[styles.selectionRow, isSelected && styles.selectionRowActive]}
                          onPress={() => setSelectedProduct(product)}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={styles.selectionTitle}>{productName}</Text>
                            <Text style={styles.selectionSub}>{t("installationDetails.productCode", "Code")}: {productCode}</Text>
                          </View>
                          {isSelected && <Check size={16} color={Colors.light.primary} />}
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <Text style={styles.bodyMuted}>{t("installationDetails.productAllocation.noProductsFound", "No products found.")}</Text>
                  )}
                </ScrollView>
              </View>
              <TextInput
                style={styles.modalInput}
                placeholder={t("installationDetails.productAllocation.quantityLabel", "Quantity")}
                keyboardType="number-pad"
                value={extraProductQty}
                onChangeText={setExtraProductQty}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.secondaryBtn, { flex: 1 }]}
                  onPress={() => {
                    setShowAddProductModal(false);
                    setSelectedProduct(null);
                    setProductSearchTerm("");
                    setExtraProductQty("1");
                  }}
                >
                  <Text style={styles.secondaryBtnText}>{t("installationDetails.cancel", "Cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryBtn, { flex: 1, alignItems: "center" }]}
                  onPress={handleAddExtraProduct}
                  disabled={addProductMutation.isPending}
                >
                  {addProductMutation.isPending ? (
                    <ActivityIndicator color={Colors.light.white} />
                  ) : (
                    <Text style={styles.primaryBtnText}>{t("installationDetails.add", "Add")}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        visible={showRejectModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
            style={styles.keyboardAvoiding}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t("installationDetails.rejectButton", "Reject Installation")}</Text>
                <TouchableOpacity onPress={() => setShowRejectModal(false)}>
                  <X size={18} color={Colors.light.gray[600]} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubText}>{t("installations.rejectionReasonRequired", "Please provide a rejection reason.")}</Text>
              <TextInput
                style={styles.reasonInput}
                placeholder={t("installationDetails.cancellationPlaceholder", "Type reason...")}
                multiline
                value={rejectionReason}
                onChangeText={setRejectionReason}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.secondaryBtn, { flex: 1 }]}
                  onPress={() => {
                    setShowRejectModal(false);
                    setRejectionReason("");
                  }}
                >
                  <Text style={styles.secondaryBtnText}>{t("installationDetails.cancel", "Cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.rejectBtn, { flex: 1 }]}
                  onPress={handleReject}
                  disabled={rejectMutation.isPending}
                >
                  {rejectMutation.isPending ? (
                    <ActivityIndicator color={Colors.light.white} />
                  ) : (
                    <Text style={styles.rejectBtnText}>{t("installationDetails.reject", "Reject")}</Text>
                  )}
                </TouchableOpacity>
              </View>
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
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  errorTitle: {
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.white,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.light.gray[600],
  },
  content: {
    flex: 1,
    padding: 16,
  },
  customerHeroCard: {
    backgroundColor: Colors.light.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  avatarCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: Colors.light.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  avatarInitial: {
    fontSize: 30,
    fontWeight: "700",
    color: Colors.light.primary,
  },
  customerHeroName: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.light.text,
  },
  customerHeroSub: {
    fontSize: 13,
    color: Colors.light.gray[600],
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.light.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  rowText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.gray[700],
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 6,
  },
  sectionSubTitle: {
    fontSize: 13,
    color: Colors.light.gray[600],
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 14,
    color: Colors.light.gray[700],
    lineHeight: 20,
  },
  bodyMuted: {
    fontSize: 13,
    color: Colors.light.gray[500],
  },
  tabList: {
    gap: 8,
    paddingBottom: 10,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.light.gray[100],
  },
  tabButtonActive: {
    backgroundColor: Colors.light.primary + "18",
  },
  tabLabel: {
    fontSize: 13,
    color: Colors.light.gray[600],
    fontWeight: "500",
  },
  tabLabelActive: {
    color: Colors.light.primary,
  },
  productsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  addExtraBtn: {
    backgroundColor: Colors.light.primary + "15",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addExtraBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  actionButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: Colors.light.gray[700],
    fontWeight: "600",
  },
  gridRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  gridCell: {
    flex: 1,
    backgroundColor: Colors.light.gray[100],
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  metaLabel: {
    fontSize: 12,
    color: Colors.light.gray[600],
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 15,
    color: Colors.light.text,
    fontWeight: "600",
  },
  listItem: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingVertical: 10,
  },
  listPrimary: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
  listSecondary: {
    fontSize: 13,
    color: Colors.light.gray[700],
    marginTop: 2,
  },
  listTertiary: {
    fontSize: 12,
    color: Colors.light.gray[500],
    marginTop: 4,
  },
  actionsCard: {
    backgroundColor: Colors.light.white,
    borderRadius: 12,
    padding: 14,
  },
  primaryBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryBtnText: {
    color: Colors.light.white,
    fontWeight: "600",
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    color: Colors.light.text,
    fontWeight: "600",
  },
  rejectBtn: {
    backgroundColor: Colors.light.error,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectBtnText: {
    color: Colors.light.white,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  keyboardAvoiding: {
    width: "100%",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Colors.light.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    gap: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.light.text,
  },
  modalSubText: {
    fontSize: 13,
    color: Colors.light.gray[600],
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.light.text,
    backgroundColor: Colors.light.white,
  },
  productSelectionList: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    maxHeight: 180,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.light.white,
  },
  selectionCentered: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  selectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingVertical: 10,
  },
  selectionRowActive: {
    backgroundColor: Colors.light.primary + "10",
  },
  selectionTitle: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: "600",
  },
  selectionSub: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.light.gray[600],
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    minHeight: 96,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: "top",
    fontSize: 15,
    color: Colors.light.text,
    backgroundColor: Colors.light.white,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
});
