import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Users,
  Briefcase,
  Package,
  TrendingUp,
  Wallet,
  UserCheck,
  DollarSign,
  Calendar
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useRouter } from "expo-router";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/lib/auth-context";
import {
  getPartnerProfile,
  getPartnerTier,
  getCustomers,
  getInstallations,
  getHandymen,
  checkCredit,
  getCustomerSatisfaction
} from "@/lib/api/partner-api";

// KPI Card Component
interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  onPress?: () => void;
}

function KPICard({ title, value, icon, color, onPress }: KPICardProps) {
  return (
    <TouchableOpacity
      style={[styles.kpiCard, { borderLeftColor: color, borderLeftWidth: 4 }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.kpiIconContainer}>
        {icon}
      </View>
      <View style={styles.kpiContent}>
        <Text style={styles.kpiValue}>{value}</Text>
        <Text style={styles.kpiTitle}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

// Fetch dashboard data from multiple endpoints
const fetchDashboardData = async () => {
  try {
    const [profile, tier, customers, installations, handymen, creditData, satisfactionData] = await Promise.all([
      getPartnerProfile().catch(err => {
        console.error("Profile fetch error:", err);
        return null;
      }),
      getPartnerTier().catch(err => {
        console.error("Tier fetch error:", err);
        return null;
      }),
      getCustomers({ limit: 5 }).catch(err => {
        console.error("Customers fetch error:", err);
        return { customers: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
      }),
      getInstallations().catch(err => {
        console.error("Installations fetch error:", err);
        return [];
      }),
      getHandymen().catch(err => {
        console.error("Handymen fetch error:", err);
        return [];
      }),
      checkCredit().catch(err => {
        console.error("Credit fetch error:", err);
        return null;
      }),
      getCustomerSatisfaction().catch(err => {
        console.error("Satisfaction fetch error:", err);
        return null;
      }),
    ]);

    // Handle new customers response format: { customers: [], pagination: {} }
    const customersArray = customers?.customers || [];
    const customersPagination = customers?.pagination || { total: 0 };
    const safeInstallations = Array.isArray(installations) ? installations : [];
    const safeHandymen = Array.isArray(handymen) ? handymen : [];

    // Process handymen
    const availableHandymenCount = safeHandymen.filter((h: any) => h.availability_status === "Available").length;
    const totalHandymenCount = safeHandymen.length;

    // Process installations
    const completedInstallationsCount = safeInstallations.filter(
      (inst: any) => (inst.status || "").toUpperCase() === "CUSTOMER_APPROVED"
    ).length;

    const now = new Date();
    const upcomingInstallations = safeInstallations
      .filter((inst: any) => new Date(inst.scheduledDate) >= now)
      .sort(
        (a: any, b: any) =>
          new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
      )
      .slice(0, 5);

    // Process credit - check multiple possible response formats
    let creditAmount = 0;

    // Log raw credit data for debugging
    console.log("Raw credit data:", creditData);
    console.log("Tier data:", tier);
    console.log("Profile data:", profile);

    if (creditData) {
      // Try different possible response formats from checkCredit API
      creditAmount = creditData?.availableCredit ||
        creditData?.credit ||
        creditData?.amount ||
        creditData?.balance ||
        creditData?.available_credit ||
        creditData?.creditAmount ||
        (creditData?.data?.availableCredit) ||
        (creditData?.data?.credit) ||
        parseFloat(creditData) ||
        0;
    }

    // Fallback to profile data (some APIs return credit in profile)
    if (!creditAmount && profile) {
      creditAmount = profile?.availableCredit ||
        profile?.credit ||
        profile?.creditLimit ||
        profile?.available_credit ||
        profile?.statistics?.availableCredit ||
        0;
    }

    // Fallback to tier data if no credit from checkCredit or profile
    if (!creditAmount && tier) {
      creditAmount = tier?.availableCredit ||
        tier?.credit ||
        tier?.creditLimit ||
        tier?.available_credit ||
        0;
    }

    // Convert from cents to dollars if amount is large (> 10000)
    // This handles APIs that return amounts in cents (e.g., 500000 = $5000.00)
    if (creditAmount > 10000) {
      creditAmount = creditAmount / 100;
    }

    console.log("Parsed credit amount:", creditAmount);

    // Process customer satisfaction
    const satisfactionSummary = satisfactionData?.summary;

    console.log("Dashboard data processed:", {
      customersCount: customersPagination.total,
      customersArrayLength: customersArray.length,
      installationsCount: safeInstallations.length,
      handymenCount: safeHandymen.length,
      credit: creditAmount
    });

    return {
      profileName:
        profile?.name ||
        profile?.companyName ||
        profile?.partnerName ||
        "",
      kpis: {
        totalCustomers: customersPagination.total,
        activeInstallations: safeInstallations.length,
        completedInstallations: completedInstallationsCount,
        availableHandymenString: `${availableHandymenCount}/${totalHandymenCount}`,
        monthlyRevenue: tier?.monthlyRevenue || tier?.revenue || 0,
        customerSatisfaction: satisfactionSummary ? `${satisfactionSummary.averageRating.toFixed(1)}/5` : "N/A",
        availableCredit: creditAmount,
      },
      recentCustomers: customersArray.slice(0, 5).map((c: any) => {
        let nameValue = typeof c?.customerName === 'string' ? c.customerName :
          typeof c?.name === 'string' ? c.name :
            "—";
        if (typeof c?.customerName === 'object' && c?.customerName?.name) {
          nameValue = c.customerName.name;
        } else if (typeof c?.customer === 'object' && c?.customer?.name) {
          nameValue = c.customer.name;
        } else if (typeof c?.customer_name === 'string') {
          nameValue = c.customer_name;
        } else if (c?.firstName || c?.lastName) {
          nameValue = `${c?.firstName || ''} ${c?.lastName || ''}`.trim();
        }

        const emailValue = c?.email || c?.phone || "—";
        const dateRaw = c?.createdAt || c?.joinDate || c?.created_at;
        const parsedDate = new Date(dateRaw);
        const dateValue = dateRaw && !isNaN(parsedDate.getTime()) ? parsedDate.toLocaleDateString() : "—";

        return {
          id: String(c?.id || c?.customerId || c?.name || ""),
          customerName: nameValue,
          email: c?.email || "",
          phone: c?.phone || "",
          address: c?.address || "",
          contact: emailValue,
          status: c?.status || "active",
          createdAt: dateValue
        }
      }),
      upcomingInstallations: upcomingInstallations.map((i: any) => {
        let customerNameValue = i?.customer?.customerName || i?.customer?.name || i?.customerName || i?.customer_name || "—";
        if (typeof customerNameValue === 'object') {
          customerNameValue = customerNameValue?.name || customerNameValue?.customerName || "—";
        }

        let addressValue = i?.customer?.address || i?.address || "—";

        const dateRaw = i?.scheduledDate || i?.date;
        const parsedDate = new Date(dateRaw);
        const dateValue = dateRaw && !isNaN(parsedDate.getTime()) ? parsedDate.toLocaleDateString() : "—";

        return {
          id: i?.id || String(Math.random()),
          customerName: customerNameValue,
          address: addressValue,
          date: dateValue,
          status: i?.status || "scheduled",
          handymanName: i?.handyman?.name || i?.handymanName || "—"
        }
      }),
    };
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    // Return fallback data
    return {
      kpis: {
        totalCustomers: 0,
        activeInstallations: 0,
        completedInstallations: 0,
        availableHandymenString: `0/0`,
        monthlyRevenue: 0,
        customerSatisfaction: "N/A",
        availableCredit: 0,
      },
      recentCustomers: [],
      upcomingInstallations: [],
    };
  }
};

export default function PartnerDashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { switchAppMode } = useAuth();

  const { data, refetch } = useQuery({
    queryKey: ["partner-dashboard"],
    queryFn: fetchDashboardData,
  });

  console.log("data handyman", data);

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const kpis = data?.kpis;
  const displayName =
    session?.user?.name ||
    (session?.user as any)?.companyName ||
    data?.profileName ||
    t("dashboard.partnerPortal", "Partner Portal");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{t("dashboard.welcome", "Welcome back")}</Text>
          <Text style={styles.title}>{displayName}</Text>
        </View>
        <TouchableOpacity
          style={styles.modeButton}
          onPress={async () => {
            await switchAppMode("handyman");
            router.replace("/(handyman)");
          }}
        >
          <Text style={styles.modeButtonText}>
            {t("dashboard.activateHandymanMode", "Handyman Mode")}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* KPI Grid */}
        <View style={styles.kpiGrid}>
          <KPICard
            title={t("dashboard.totalCustomers", "Customers")}
            value={kpis?.totalCustomers ?? "-"}
            icon={<Users size={24} color={Colors.light.primary} />}
            color={Colors.light.primary}
            onPress={() => router.push("/(partner)/customers")}
          />
          <KPICard
            title={t("dashboard.activeJobs", "Active Jobs")}
            value={kpis?.activeInstallations ?? "-"}
            icon={<Briefcase size={24} color={Colors.light.secondary} />}
            color={Colors.light.secondary}
            onPress={() => router.push("/(partner)/installations")}
          />
          <KPICard
            title={t("dashboard.completed", "Completed")}
            value={kpis?.completedInstallations ?? "-"}
            icon={<Package size={24} color={Colors.light.success} />}
            color={Colors.light.success}
            onPress={() => router.push("/(partner)/installations")}
          />
          <KPICard
            title={t("dashboard.team", "Team")}
            value={kpis?.availableHandymenString ?? "-"}
            icon={<UserCheck size={24} color={Colors.light.warning} />}
            color={Colors.light.warning}
            onPress={() => router.push("/(partner)/handymen")}
          />
        </View>

        {/* Revenue & Satisfaction */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: Colors.light.primary + "10" }]}>
            <DollarSign size={20} color={Colors.light.primary} />
            <Text style={styles.statValue}>${kpis?.monthlyRevenue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "-"}</Text>
            <Text style={styles.statLabel}>{t("dashboard.monthlyRevenue", "Monthly Revenue")}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.light.secondary + "10" }]}>
            <TrendingUp size={20} color={Colors.light.secondary} />
            <Text style={styles.statValue}>{kpis?.customerSatisfaction ?? "-"}</Text>
            <Text style={styles.statLabel}>{t("dashboard.satisfaction", "Satisfaction")}</Text>
          </View>
        </View>

        {/* Credit Card */}
        <View style={styles.creditCard}>
          <View style={styles.creditIconContainer}>
            <Wallet size={24} color="white" />
          </View>
          <View style={styles.creditContent}>
            <Text style={styles.creditLabel}>{t("dashboard.availableCredit", "Available Credit")}</Text>
            <Text style={styles.creditValue}>${kpis?.availableCredit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "-"}</Text>
          </View>
        </View>

        {/* Recent Customers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("dashboard.recentCustomers", "Recent Customers")}</Text>
            <TouchableOpacity onPress={() => router.push("/(partner)/customers")}>
              <Text style={styles.seeAll}>{t("common.seeAll", "See All")}</Text>
            </TouchableOpacity>
          </View>
          {data?.recentCustomers && data.recentCustomers.length > 0 ? (
            data.recentCustomers.map((customer: any) => (
              <View
                key={customer.id}
                style={styles.customerItem}
              >
                <View style={styles.customerAvatar}>
                  <Text style={styles.customerInitial}>{customer.customerName?.[0] || "?"}</Text>
                </View>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>
                    {customer.customerName || t("customers.customer", "Customer")}
                  </Text>
                  <Text style={styles.customerEmail}>{customer.contact || "-"}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <View style={[styles.statusBadge, {
                    backgroundColor: customer.status === "active" ? Colors.light.success + "20" : Colors.light.gray[200]
                  }]}>
                    <Text style={[styles.statusText, {
                      color: customer.status === "active" ? Colors.light.success : Colors.light.gray[500]
                    }]}>
                      {t(`customers.status.${customer.status?.toLowerCase()}`, { defaultValue: customer.status || "" }) as string}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: Colors.light.gray[500], marginTop: 4 }}>
                    {customer.createdAt}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>{t("dashboard.noRecentCustomers", "No recent customers")}</Text>
          )}
        </View>

        {/* Upcoming Installations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("dashboard.upcomingInstallations", "Upcoming Jobs")}</Text>
            <TouchableOpacity onPress={() => router.push("/(partner)/installations")}>
              <Text style={styles.seeAll}>{t("common.seeAll", "See All")}</Text>
            </TouchableOpacity>
          </View>
          {data?.upcomingInstallations && data.upcomingInstallations.length > 0 ? (
            data.upcomingInstallations.map((install) => (
              <View key={install.id} style={styles.installItem}>
                <View style={styles.installIconContainer}>
                  <Calendar size={20} color={Colors.light.primary} />
                </View>
                <View style={styles.installInfo}>
                  <Text style={styles.installCustomer}>{install.customerName || "—"}</Text>
                  <Text style={styles.installDate}>{install.address || "—"}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontSize: 13, fontWeight: "500", color: Colors.light.primary, marginBottom: 4 }}>
                    {install.date}
                  </Text>
                  <Text style={{ fontSize: 12, color: Colors.light.text }}>
                    {install.handymanName || "—"}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>{t("dashboard.noUpcomingJobs", "No upcoming jobs")}</Text>
          )}
        </View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greeting: {
    fontSize: 14,
    color: Colors.light.gray[500],
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text,
  },
  modeButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modeButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  kpiIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.light.gray[100],
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  kpiContent: {
    flex: 1,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.text,
  },
  kpiTitle: {
    fontSize: 12,
    color: Colors.light.gray[500],
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.gray[500],
    marginTop: 4,
  },
  creditCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  creditIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  creditContent: {
    flex: 1,
  },
  creditLabel: {
    fontSize: 12,
    color: Colors.light.gray[500],
  },
  creditValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text,
  },
  section: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  seeAll: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: "500",
  },
  customerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  customerInitial: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
  customerEmail: {
    fontSize: 12,
    color: Colors.light.gray[500],
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  installItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  installIconContainer: {
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
  installCustomer: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
  installDate: {
    fontSize: 12,
    color: Colors.light.gray[500],
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.gray[500],
    textAlign: "center",
    paddingVertical: 20,
  },
});
