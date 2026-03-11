import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Search,
  Phone,
  Mail,
  MapPin,
  MoreVertical,
  Building2,
  Eye,
  Pencil,
  X,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useRouter } from "expo-router";
import { getCustomers } from "@/lib/api/partner-api";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: "active" | "inactive";
  totalInstallations: number;
  joinDate: string;
}

const getCustomerId = (customer: any): string => {
  const candidate = customer?.id || customer?.customerId || customer?.name;
  return candidate ? String(candidate) : "";
};

// Fetch customers from API
// API: GET /api/v1/customer
const fetchCustomers = async (): Promise<Customer[]> => {
  try {
    const response = await getCustomers();
    const customers = response?.customers || [];

    if (!Array.isArray(customers)) {
      console.warn("Customers response is not an array:", customers);
      return [];
    }

    return customers.map((customer: any) => {
      // Handle nested name object from API
      const nameValue = typeof customer?.customerName === 'string' ? customer.customerName :
        typeof customer?.name === 'string' ? customer.name :
          "—";

      const parsedName = typeof customer?.customerName === 'object' && customer?.customerName?.name ?
        customer.customerName.name : nameValue;

      return {
        id: getCustomerId(customer),
        name: parsedName,
        email: customer?.email || "",
        phone: customer?.phone || "",
        address: customer?.address || "",
        status: customer?.status || "active",
        totalInstallations: customer?.totalInstallations || customer?.installations_count || 0,
        joinDate: customer?.joinDate || customer?.created_at || customer?.createdAt || "",
      };
    });
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    return [];
  }
};

function CustomerCard({
  customer,
  onOpenActions,
  onOpenDetails,
}: {
  customer: Customer;
  onOpenActions: (customer: Customer) => void;
  onOpenDetails: (customerId: string) => void;
}) {
  const { t } = useTranslation();
  // Handle case where fields might be objects
  const name =
    typeof customer.name === "string"
      ? customer.name
      : t("customers.customer", "Customer");
  const email = typeof customer.email === 'string' ? customer.email : "";
  const phone = typeof customer.phone === 'string' ? customer.phone : "";
  const address = typeof customer.address === 'string' ? customer.address : "";

  return (
    <TouchableOpacity
      style={styles.customerCard}
      onPress={() => {
        if (!customer.id) return;
        onOpenDetails(String(customer.id));
      }}
    >
      <View style={styles.customerHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{name.charAt(0)}</Text>
        </View>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{name}</Text>
          <View style={[styles.statusBadge, {
            backgroundColor: customer.status === "active" ? Colors.light.success + "20" : Colors.light.gray[200]
          }]}>
            <Text style={[styles.statusText, {
              color: customer.status === "active" ? Colors.light.success : Colors.light.gray[500]
            }]}>
              {t(`customers.status.${customer.status}`, { defaultValue: customer.status })}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={(e) => {
            e.stopPropagation();
            onOpenActions(customer);
          }}
        >
          <MoreVertical size={20} color={Colors.light.gray[500]} />
        </TouchableOpacity>
      </View>

      <View style={styles.customerDetails}>
        <View style={styles.detailRow}>
          <Mail size={14} color={Colors.light.gray[500]} />
          <Text style={styles.detailText}>{email}</Text>
        </View>
        <View style={styles.detailRow}>
          <Phone size={14} color={Colors.light.gray[500]} />
          <Text style={styles.detailText}>{phone}</Text>
        </View>
        <View style={styles.detailRow}>
          <MapPin size={14} color={Colors.light.gray[500]} />
          <Text style={styles.detailText} numberOfLines={1}>{address}</Text>
        </View>
      </View>

      <View style={styles.customerFooter}>
        <View style={styles.statItem}>
          <Building2 size={16} color={Colors.light.primary} />
          <Text style={styles.statValue}>{customer.totalInstallations}</Text>
          <Text style={styles.statLabel}>{t("customers.installations", "Installations")}</Text>
        </View>
        <Text style={styles.joinDate}>
          {t("customers.since", "Since")} {typeof customer.joinDate === 'string' ? customer.joinDate : '-'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function CustomersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showActions, setShowActions] = useState(false);
  const navigatingRef = useRef(false);

  const { data: customers, refetch } = useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filteredCustomers = customers?.filter((customer) => {
    const name = customer.name || "";
    const email = customer.email || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const navigateToCustomerDetails = (customerId: string, mode?: "edit") => {
    if (!customerId || navigatingRef.current) return;
    navigatingRef.current = true;
    router.navigate({
      pathname: "/(partner)/customers/[id]",
      params: mode ? { id: String(customerId), mode } : { id: String(customerId) },
    });
    setTimeout(() => {
      navigatingRef.current = false;
    }, 500);
  };

  const handleView = () => {
    if (!selectedCustomer?.id) return;
    setShowActions(false);
    navigateToCustomerDetails(String(selectedCustomer.id));
  };

  const handleEdit = () => {
    if (!selectedCustomer) return;
    setShowActions(false);
    navigateToCustomerDetails(String(selectedCustomer.id), "edit");
  };

  const handleCall = async () => {
    if (!selectedCustomer?.phone) return;
    setShowActions(false);
    await Linking.openURL(`tel:${selectedCustomer.phone}`);
  };

  const handleEmail = async () => {
    if (!selectedCustomer?.email) return;
    setShowActions(false);
    await Linking.openURL(`mailto:${selectedCustomer.email}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("customers.title", "Customers")}</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.light.gray[500]} />
        <TextInput
          style={styles.searchInput}
          placeholder={t("customers.search", "Search customers...")}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statCardValue}>{customers?.length ?? 0}</Text>
          <Text style={styles.statCardLabel}>{t("customers.total", "Total")}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statCardValue}>
            {customers?.filter(c => c.status === "active").length ?? 0}
          </Text>
          <Text style={styles.statCardLabel}>{t("customers.active", "Active")}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statCardValue}>
            {customers?.reduce((acc, c) => acc + c.totalInstallations, 0) ?? 0}
          </Text>
          <Text style={styles.statCardLabel}>{t("customers.installations", "Jobs")}</Text>
        </View>
      </View>

      {/* Customers List */}
      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.customersList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <CustomerCard
            customer={item}
            onOpenDetails={(customerId) => navigateToCustomerDetails(customerId)}
            onOpenActions={(customer) => {
              if (!customer.id) return;
              setSelectedCustomer(customer);
              setShowActions(true);
            }}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {t("customers.noCustomers", "No customers found")}
            </Text>
          </View>
        }
      />

      <Modal
        visible={showActions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActions(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setShowActions(false)}
        >
          <View style={styles.actionsSheet}>
            <View style={styles.actionsHeader}>
              <Text style={styles.actionsTitle}>{selectedCustomer?.name || t("customers.customer", "Customer")}</Text>
              <TouchableOpacity onPress={() => setShowActions(false)}>
                <X size={18} color={Colors.light.gray[600]} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.actionRow} onPress={handleView}>
              <Eye size={16} color={Colors.light.text} />
              <Text style={styles.actionText}>{t("customers.viewDetails", "View Details")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionRow} onPress={handleEdit}>
              <Pencil size={16} color={Colors.light.text} />
              <Text style={styles.actionText}>{t("customers.editCustomer", "Edit Customer")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionRow} onPress={handleCall}>
              <Phone size={16} color={Colors.light.text} />
              <Text style={styles.actionText}>{t("customers.call", "Call")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionRow} onPress={handleEmail}>
              <Mail size={16} color={Colors.light.text} />
              <Text style={styles.actionText}>{t("customers.email", "Email")}</Text>
            </TouchableOpacity>
            {/* <TouchableOpacity style={styles.actionRow} onPress={handleDelete}>
              <Trash2 size={16} color={Colors.light.error} />
              <Text style={[styles.actionText, { color: Colors.light.error }]}>Delete</Text>
            </TouchableOpacity> */}
          </View>
        </TouchableOpacity>
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    margin: 16,
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
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text,
  },
  statCardLabel: {
    fontSize: 12,
    color: Colors.light.gray[500],
    marginTop: 4,
  },
  customersList: {
    padding: 16,
    paddingTop: 8,
  },
  customerCard: {
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
  customerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
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
    textTransform: "capitalize",
  },
  moreButton: {
    padding: 4,
  },
  customerDetails: {
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
  customerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.gray[500],
  },
  joinDate: {
    fontSize: 12,
    color: Colors.light.gray[500],
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
  actionsSheet: {
    backgroundColor: Colors.light.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    gap: 4,
  },
  actionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.text,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  actionText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: "500",
  },
});
