import { authClient } from "@/lib/auth-client";
import { getOrderHistory } from "@/lib/api/partner-api";
import { Product } from "@/types/job";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import * as SecureStore from 'expo-secure-store';
// import { Job } from "@/types/job";

const BASE_URL =
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.EXPO_PUBLIC_CHAT_API_URL ||
    "https://api.heyzack.ai/api/v1";

type ExtendedUser = {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    image?: string | null;
    erpId?: string;
};

export function useGetProduct(productId: string | number) {
    const id = String(productId ?? "").trim();
    return useQuery<Product | null>({
        queryKey: ["product", id],
        queryFn: async () => {
            try {
                const token = await SecureStore.getItemAsync('auth_token');
                if (!token) {
                    throw new Error("Authentication token not found");
                }

                console.log(`Fetching product with ID: ${id}`);

                // Attempt primary product endpoint
                let response: any;
                try {
                    response = await axios.get(`${BASE_URL}/products/${encodeURIComponent(id)}`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    });
                    console.log("Product response raw (primary):", response?.data);
                } catch (primaryErr: any) {
                    console.warn(`Primary products endpoint failed for ${id}:`, primaryErr?.response?.data || primaryErr);
                }

                const normalizeProduct = (raw: any): Product | null => {
                    if (!raw) return null;
                    // Shape A: { data: Product }
                    if (raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) {
                        return raw.data as Product;
                    }
                    // Shape B: direct Product object
                    if (typeof raw === 'object' && raw && !Array.isArray(raw)) {
                        return raw as Product;
                    }
                    // Shape C: { data: { data: Product } }
                    if (raw.data && raw.data.data) {
                        return raw.data.data as Product;
                    }
                    return null;
                };

                let productPayload = normalizeProduct(response?.data);

                if (!productPayload) {
                    console.log(`Product ${id} not found or payload missing after all attempts, returning null`);
                    return null;
                }

                return productPayload as Product;
            } catch (error: any) {
                console.error("Failed to fetch product:", error?.response?.data || error);
                // Return null rather than throw, so UI can still render with provided product fields
                return null;
            }
        },
        enabled: id.length > 0,
        staleTime: 5 * 60 * 1000,
    });
}

export function useUpdateProductCollect() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ["update-product-collect"],
        mutationFn: async ({ fileUri, jobId, productId }: { fileUri: string, jobId: string, productId: string }) => {
            try {
                const token = await SecureStore.getItemAsync('auth_token');
                if (!token) throw new Error("Authentication token not found");

                const id = String(productId ?? "").trim();
                if (!jobId) throw new Error("Job ID is required");
                if (!id) throw new Error("Product ID is required");

                // Build multipart form data for the PATCH request
                const formData = new FormData();
                const fileName = fileUri.split("/").pop() || `collection_${Date.now()}.jpg`;
                const lower = fileUri.toLowerCase();
                const fileType = lower.endsWith(".pdf")
                    ? "application/pdf"
                    : lower.endsWith(".png")
                        ? "image/png"
                        : "image/jpeg";

                formData.append("inventoryItemId", id);
                formData.append("status", "collected");
                // @ts-ignore React Native FormData file object
                formData.append("photo", {
                    uri: fileUri,
                    name: fileName,
                    type: fileType,
                });

                console.log("Sending collect PATCH for job:", jobId, "item:", id);

                const response = await axios.patch(
                    `${BASE_URL}/jobs/${jobId}/products/status`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "multipart/form-data",
                        },
                        timeout: 30000,
                    }
                );

                console.log("Collect status update response:", response.data);
                return response.data;

            } catch (error:any) {
                console.error("Product collect error:", error?.response?.data);
                if (axios.isAxiosError(error)) {
                    if (error.code === "ECONNABORTED") {
                        throw new Error("Upload timed out. Please try again with a smaller file.");
                    }
                    if (error.response) {
                        throw new Error(`Server error: ${error.response.status} - ${error.response.data?.message || "Unknown error"}`);
                    }
                    if (error.request) {
                        throw new Error("No response from server. Please check your internet connection.");
                    }
                }
                throw error instanceof Error ? error : new Error("Failed to update product collect status");
            }
        },
        onMutate: async ({ productId }) => {
            const id = String(productId ?? "").trim();
            await queryClient.cancelQueries({ queryKey: ["product", id] });
            const previousProduct = queryClient.getQueryData(["product", id]);
            queryClient.setQueryData(["product", id], (prev: any) => {
                if (!prev || typeof prev !== "object") return prev;
                return { ...prev, status: "collected", isCollected: true };
            });
            return { previousProduct, id } as any;
        },
        onError: (_error, _variables, context: any) => {
            if (context?.id && context?.previousProduct) {
                queryClient.setQueryData(["product", context.id], context.previousProduct);
            }
        },
        onSuccess: (_data, { productId, jobId }) => {
            const id = String(productId ?? "").trim();
            queryClient.invalidateQueries({ queryKey: ["product", id] });
            queryClient.invalidateQueries({ queryKey: ["stock", id] });
            if (jobId) {
                queryClient.invalidateQueries({ queryKey: ["get-jobs", jobId] });
                queryClient.refetchQueries({ queryKey: ["get-jobs", jobId], type: "active" });
            }
            // Trigger immediate refetch for active product and stock queries
            queryClient.refetchQueries({ queryKey: ["product", id], type: "active" });
            queryClient.refetchQueries({ queryKey: ["stock", id], type: "active" });
        },
    });
}

export type ProductCatalogItem = {
    id: string;
    item?: string;
    item_name?: string;
    name?: string;
    sku?: string;
};

export function useGetProducts(searchTerm?: string) {
    const search = String(searchTerm ?? "").trim();
    return useQuery<ProductCatalogItem[]>({
        queryKey: ["products-catalog", search],
        queryFn: async () => {
            try {
                const token = await SecureStore.getItemAsync("auth_token");
                if (!token) {
                    throw new Error("Authentication token not found");
                }

                const productParams = new URLSearchParams();
                if (search) productParams.append("search", search);
                productParams.append("limit", "100");
                const query = productParams.toString();

                const requests = [
                    `${BASE_URL}/products${query ? `?${query}` : ""}`,
                    `${BASE_URL}/products`,
                    `${BASE_URL}/product${query ? `?${query}` : ""}`,
                    `${BASE_URL}/inventory/products${query ? `?${query}` : ""}`,
                ];

                let rawPayload: any = null;
                for (const url of requests) {
                    try {
                        const response = await axios.get(url, {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                            },
                        });
                        rawPayload = response?.data;
                        if (rawPayload) break;
                    } catch (error: any) {
                        if (error?.response?.status !== 404) {
                            throw error;
                        }
                    }
                }

                const rawList =
                    rawPayload?.products ||
                    rawPayload?.data?.products ||
                    rawPayload?.data?.items ||
                    rawPayload?.items ||
                    rawPayload?.result?.products ||
                    rawPayload?.data ||
                    rawPayload;

                const list = Array.isArray(rawList) ? rawList : [];
                const normalizedList = list
                    .map((entry: any) => {
                        const id = String(
                            entry?.id ??
                            entry?._id ??
                            entry?.item ??
                            entry?.inventorycode ??
                            entry?.sku ??
                            ""
                        ).trim();
                        if (!id) return null;
                        return {
                            id,
                            item: String(entry?.item ?? entry?.inventorycode ?? id),
                            item_name: String(entry?.item_name ?? entry?.name ?? entry?.title ?? "").trim(),
                            name: String(entry?.name ?? entry?.item_name ?? entry?.title ?? entry?.productName ?? "").trim(),
                            sku: String(entry?.sku ?? "").trim() || undefined,
                        } as ProductCatalogItem;
                    })
                    .filter(Boolean) as ProductCatalogItem[];

                if (normalizedList.length > 0) {
                    return normalizedList;
                }

                // Fallback: derive product options from Shopify order line-items if direct catalog APIs are unavailable.
                try {
                    const orders = await getOrderHistory();
                    const derived: ProductCatalogItem[] = [];
                    const seen = new Set<string>();

                    for (const order of orders) {
                        const items =
                            order?.line_items ||
                            order?.lineItems ||
                            order?.items ||
                            order?.products ||
                            [];
                        const arr = Array.isArray(items) ? items : [];

                        for (const item of arr) {
                            const name = String(
                                item?.title ??
                                item?.name ??
                                item?.productName ??
                                item?.item_name ??
                                ""
                            ).trim();
                            const sku = String(item?.sku ?? item?.item ?? item?.inventorycode ?? "").trim();
                            const id = String(item?.id ?? sku ?? name).trim();
                            if (!id || !name) continue;

                            const key = `${id}::${name}`;
                            if (seen.has(key)) continue;
                            seen.add(key);

                            const entry: ProductCatalogItem = {
                                id,
                                item: sku || id,
                                item_name: name,
                                name,
                                sku: sku || undefined,
                            };

                            if (search) {
                                const hay = `${entry.item_name} ${entry.name} ${entry.item} ${entry.sku}`.toLowerCase();
                                if (!hay.includes(search.toLowerCase())) continue;
                            }

                            derived.push(entry);
                        }
                    }

                    return derived;
                } catch (fallbackErr: any) {
                    console.error("Failed fallback product derivation from orders:", fallbackErr?.response?.data || fallbackErr);
                }

                return [];
            } catch (error: any) {
                console.error("Failed to fetch products catalog:", error?.response?.data || error);
                return [];
            }
        },
        staleTime: 5 * 60 * 1000,
    });
}
