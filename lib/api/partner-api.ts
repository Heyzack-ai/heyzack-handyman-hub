import axios from "axios";
import * as SecureStore from "expo-secure-store";

const BASE_URL = process.env.EXPO_PUBLIC_CHAT_API_URL || "https://api.heyzack.ai/api/v1";

// Create axios instance with interceptors
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to add auth token
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log("Partner API Request:", {
    url: config.url,
    method: config.method,
    hasAuth: !!token,
  });
  return config;
});

// Add response interceptor for debugging
apiClient.interceptors.response.use(
  (response) => {
    // console.log("Partner API Response:", {
    //   url: response.config.url,
    //   status: response.status,
    //   data: response.data,
    // });
    return response;
  },
  (error) => {
    console.error("Partner API Error:", {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);

// ============ PARTNER PROFILE & TIER ============

export async function getPartnerProfile() {
  try {
    const response = await apiClient.get("/partner/profile");
    // Returns: { data: { profile: {...}, success: true } }
    return response.data?.profile || response.data?.data?.profile || response.data?.data || response.data || null;
  } catch (error) {
    console.error("Error fetching partner profile:", error);
    return null;
  }
}

export async function updatePartnerProfile(data: {
  name?: string;
  email?: string;
  phone?: string;
  businessName?: string;
  address?: string;
}) {
  try {
    const response = await apiClient.put("/partner/profile", data);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error updating partner profile:", error);
    throw error;
  }
}

export async function getPartnerTier() {
  try {
    const response = await apiClient.get("/partner/tier");
    // Returns: { data: { tierInfo: {...}, success: true } }
    return response.data?.tierInfo || response.data?.data?.tierInfo || response.data?.data || response.data || null;
  } catch (error) {
    console.error("Error fetching partner tier:", error);
    return null;
  }
}

export async function getTierConfigurations() {
  try {
    const response = await apiClient.get("/partner/tier/configurations");
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error fetching tier configurations:", error);
    return null;
  }
}

export async function getCustomerSatisfaction() {
  try {
    const response = await apiClient.get("/partner/customer-satisfaction");
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error fetching customer satisfaction:", error);
    return null;
  }
}

// ============ SHOPIFY / CREDIT ============

export async function checkCredit() {
  try {
    const response = await apiClient.post("/partner/shopify/credit/check");
    console.log("Credit API raw response:", response.data);
    // Returns could be: { availableCredit: 2500 } or { credit: 2500 } or { data: { availableCredit: 2500 } }
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error checking credit:", error);
    return null;
  }
}

export async function applyCredit(checkoutId: string, amount: number) {
  try {
    const response = await apiClient.post("/partner/shopify/credit/apply", {
      checkoutId,
      amount,
    });
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error applying credit:", error);
    throw error;
  }
}

export async function getCartInfo() {
  try {
    const response = await apiClient.get("/partner/shopify/cart");
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error fetching cart info:", error);
    return null;
  }
}

export async function getOrderHistory() {
  try {
    const response = await apiClient.get("/partner/shopify/orders");
    // Returns: { data: { orders: [...] } } or { data: [...] }
    const data = response.data?.orders || response.data?.data?.orders || response.data?.data || response.data;
    return Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
  } catch (error) {
    console.error("Error fetching order history:", error);
    return [];
  }
}

export async function getShopifySSOUrl() {
  const endpoints = [
    "/partner/shopify/sso",
    "/partner/shopify/sso-url",
    "/shopify/sso",
    "/shopify/sso-url",
  ];

  let lastError: any = null;
  for (const endpoint of endpoints) {
    try {
      const response = await apiClient.get(endpoint);
      return response.data?.data || response.data;
    } catch (error: any) {
      lastError = error;
      const status = error?.response?.status;
      if (status !== 404 && status !== 405) {
        console.error("Error fetching Shopify SSO URL:", error);
        return null;
      }
    }
  }

  console.error("Error fetching Shopify SSO URL:", lastError);
  return null;
}

export type ShopifyProduct = {
  id?: string | number;
  title?: string;
  handle?: string;
  vendor?: string;
  product_type?: string;
  images?: {
    id?: string | number;
    src?: string;
    alt?: string | null;
  }[];
  variants?: {
    id?: string | number;
    sku?: string | null;
    title?: string;
    price?: string | number | null;
  }[];
};

export async function getShopifyProducts(params?: {
  limit?: number;
  since_id?: string | number;
  product_type?: string;
  vendor?: string;
  collection_id?: string;
  fields?: string;
  search?: string;
}) {
  const endpoints = [
    "/shopify/products",
    "/api/v1/shopify/products",
  ];

  let lastError: any = null;
  for (const endpoint of endpoints) {
    try {
      const response = await apiClient.get(endpoint, { params });
      const products =
        response.data?.data?.products ||
        response.data?.products ||
        response.data?.data ||
        response.data;

      return {
        success: response.data?.success ?? true,
        data: {
          products: Array.isArray(products) ? products : [],
          pagination: response.data?.data?.pagination,
        },
      };
    } catch (error: any) {
      lastError = error;
      const status = error?.response?.status;
      if (status !== 404 && status !== 405) {
        console.error("Error fetching Shopify products:", error?.response?.data || error);
        return { success: false, data: { products: [] as ShopifyProduct[] } };
      }
    }
  }

  console.error("Error fetching Shopify products:", lastError?.response?.data || lastError);
  return { success: false, data: { products: [] as ShopifyProduct[] } };
}

// ============ LEADS ============

export async function getLeads(params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.search) queryParams.append("search", params.search);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const response = await apiClient.get(`/lead?${queryParams}`);
    // Returns: { data: { leads: [...], pagination: {...} } } or { data: [...] }
    const data = response.data?.leads || response.data?.data?.leads || response.data?.data || response.data;
    return Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
  } catch (error) {
    console.error("Error fetching leads:", error);
    return [];
  }
}

export async function getLeadById(id: string) {
  try {
    const response = await apiClient.get(`/lead/${id}`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error fetching lead:", error);
    return null;
  }
}

export async function createLead(data: {
  name: string;
  email: string;
  phone: string;
  source?: string;
  notes?: string;
}) {
  try {
    const response = await apiClient.post("/lead", data);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error creating lead:", error);
    throw error;
  }
}

export async function updateLead(
  id: string,
  data: Partial<{
    name: string;
    email: string;
    phone: string;
    status: string;
    notes: string;
  }>
) {
  try {
    const response = await apiClient.patch(`/lead/${id}`, data);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error updating lead:", error);
    throw error;
  }
}

export async function deleteLead(id: string) {
  try {
    const response = await apiClient.delete(`/lead/deleteLead?id=${id}`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error deleting lead:", error);
    throw error;
  }
}

export async function getLeadSources() {
  try {
    const response = await apiClient.get("/lead/sources");
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error fetching lead sources:", error);
    return [];
  }
}

// Lead Notes
export async function getLeadNotes(leadId: string) {
  try {
    const response = await apiClient.get(`/lead/${leadId}/notes`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error fetching lead notes:", error);
    return [];
  }
}

export async function addLeadNote(leadId: string, content: string) {
  try {
    const response = await apiClient.post(`/lead/${leadId}/notes`, { content });
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error adding lead note:", error);
    throw error;
  }
}

// ============ CUSTOMERS ============

export async function getCustomers(params?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append("search", params.search);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const response = await apiClient.get(`/customer?${queryParams}`);
    // Returns: { data: { customers: [...], pagination: {...} } }
    const data = response.data?.data || response.data;

    return {
      customers: data?.customers || [],
      pagination: data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 },
    };
  } catch (error) {
    console.error("Error fetching customers:", error);
    return {
      customers: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
    };
  }
}

export async function getCustomerById(id: string) {
  try {
    const response = await apiClient.get(`/customer/${id}`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error fetching customer:", error);
    return null;
  }
}

export interface UpdateCustomerPayload {
  customerName?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: "active" | "inactive";
}

export async function updateCustomer(id: string, data: UpdateCustomerPayload) {
  try {
    // Primary endpoint
    const response = await apiClient.patch(`/customer/${id}`, data);
    return response.data?.data || response.data;
  } catch (error: any) {
    // Fallback for APIs expecting PUT
    if (error?.response?.status === 404 || error?.response?.status === 405) {
      const fallback = await apiClient.put(`/customer/${id}`, data);
      return fallback.data?.data || fallback.data;
    }
    console.error("Error updating customer:", error);
    throw error;
  }
}

export async function deleteCustomer(id: string) {
  try {
    // Primary endpoint
    const response = await apiClient.delete(`/customer/${id}`);
    return response.data?.data || response.data;
  } catch (error: any) {
    // Fallback for legacy endpoint shape
    if (error?.response?.status === 404 || error?.response?.status === 405) {
      const fallback = await apiClient.delete(`/customer/deleteCustomer?id=${id}`);
      return fallback.data?.data || fallback.data;
    }
    console.error("Error deleting customer:", error);
    throw error;
  }
}

export async function getCustomerTimeline(customerId: string) {
  try {
    const response = await apiClient.get(`/customer/${customerId}/timeline`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error fetching customer timeline:", error);
    return [];
  }
}

// ============ INSTALLATIONS ============

export async function getInstallations(params?: {
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}) {
  try {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    if (params?.search) queryParams.append("search", params.search);

    const response = await apiClient.get(`/installation?${queryParams}`);
    // Returns: { data: [...] } - direct array
    const data = response.data?.installations || response.data?.data?.installations || response.data?.data || response.data;
    return Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
  } catch (error) {
    console.error("Error fetching installations:", error);
    return [];
  }
}

export async function getInstallationById(id: string) {
  try {
    const response = await apiClient.get(`/installation/${id}`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error fetching installation:", error);
    return null;
  }
}

export async function createInstallation(data: {
  customerId: string;
  address: string;
  scheduledDate: string;
  serviceType: string;
  notes?: string;
}) {
  try {
    const response = await apiClient.post("/installation/create", data);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error creating installation:", error);
    throw error;
  }
}

export async function updateInstallation(
  installationId: string,
  data: {
    products?: { productName: string; quantity: number; sku?: string }[];
    [key: string]: any;
  }
) {
  const normalizedProducts = Array.isArray(data?.products)
    ? data.products
      .map((p) => ({
        productName: String(p?.productName || "").trim(),
        quantity: Number(p?.quantity || 0),
      }))
      .filter((p) => p.productName.length > 0 && p.quantity > 0)
    : undefined;

  const canonicalBody = normalizedProducts
    ? { ...data, products: normalizedProducts }
    : data;

  try {
    const response = await apiClient.put(`/installation/${installationId}`, canonicalBody);
    return response.data?.data || response.data;
  } catch (error: any) {
    console.error("Error updating installation:", error?.response?.data || error);
    throw error;
  }
}

export async function updateInstallationStatus(
  id: string,
  status: string,
  reason?: string
) {
  try {
    const response = await apiClient.patch(`/installation/${id}/status`, {
      status,
      reason,
    });
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error updating installation status:", error);
    throw error;
  }
}

export async function assignHandyman(installationId: string, handymanId: string) {
  try {
    const response = await apiClient.post("/handyman/assign-job", {
      installationId,
      handymanId,
    });
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error assigning handyman:", error);
    throw error;
  }
}

export async function assignInstallationToSelf(
  installationId: string,
  partnerUserId: string
) {
  try {
    const response = await apiClient.put(`/installation/${installationId}`, {
      handymanId: partnerUserId,
      assignedToPartner: true,
    });
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error assigning installation to self:", error);
    throw error;
  }
}

export async function addExtraProductToInstallation(
  installationId: string,
  data: {
    name: string;
    quantity: number;
    item?: string;
    item_name?: string;
    sku?: string;
    notes?: string;
  }
) {
  const resolvedName = data.item_name || data.name;
  const payload = {
    ...data,
    name: resolvedName,
    item: data.item || resolvedName,
    item_name: resolvedName,
  };

  const endpoints = [
    { method: "post" as const, url: `/installation/${installationId}/products` },
    { method: "post" as const, url: `/installation/${installationId}/products/add` },
    { method: "post" as const, url: `/installation/${installationId}/add-product` },
    { method: "post" as const, url: `/installation/add-product`, body: { installationId, ...payload } },
  ];

  let lastError: any = null;
  for (const endpoint of endpoints) {
    try {
      const response =
        endpoint.method === "post"
          ? await apiClient.post(endpoint.url, endpoint.body || payload)
          : await apiClient.patch(endpoint.url, endpoint.body || payload);
      return response.data?.data || response.data;
    } catch (error: any) {
      lastError = error;
      const status = error?.response?.status;
      if (status !== 404 && status !== 405) {
        throw error;
      }
    }
  }

  console.error("Error adding extra product to installation:", lastError);
  throw lastError || new Error("Failed to add extra product");
}

// ============ HANDYMEN ============

export async function getHandymen(params?: {
  status?: string;
  skill?: string;
  search?: string;
}) {
  try {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.skill) queryParams.append("skill", params.skill);
    if (params?.search) queryParams.append("search", params.search);

    const response = await apiClient.get(`/handyman/list?${queryParams}`);
    // Returns: { data: [...] } - direct array
    const data = response.data?.handymen || response.data?.data?.handymen || response.data?.data || response.data;
    return Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
  } catch (error) {
    console.error("Error fetching handymen:", error);
    return [];
  }
}

export async function getHandymanById(id: string) {
  try {
    const response = await apiClient.get(`/handyman/${id}`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error fetching handyman:", error);
    return null;
  }
}

export async function getHandymanJobs(handymanId: string) {
  try {
    const response = await apiClient.get(`/handyman/${handymanId}/jobs`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error fetching handyman jobs:", error);
    return [];
  }
}

export async function getHandymanAvailability(handymanId: string) {
  try {
    const response = await apiClient.get(`/handyman/${handymanId}/availability`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error fetching handyman availability:", error);
    return null;
  }
}

export async function delinkHandyman(handymanId: string) {
  try {
    const response = await apiClient.delete(
      `/partner/handymen/${handymanId}/delink`
    );
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error delinking handyman:", error);
    throw error;
  }
}

// ============ CHAT ============

export async function getChatConnections() {
  try {
    const response = await apiClient.get("/chat/connections");
    // Returns: { data: { connections: [...], role: "partner" } }
    return response.data?.data ||
      { connections: [], role: "partner" };
  } catch (error) {
    console.error("Error fetching chat connections:", error);
    return { connections: [], role: "partner" };
  }
}

export async function getChatHistory(roomId: string) {
  try {
    const response = await apiClient.get(`/chat/history?roomId=${roomId}`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return { messages: [], roomId };
  }
}

export async function sendMessage(roomId: string, content: string) {
  try {
    const response = await apiClient.post("/chat/send", { roomId, content });
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}
