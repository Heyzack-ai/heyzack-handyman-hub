import { authClient } from "@/lib/auth-client";
import { Product } from "@/types/job";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import * as SecureStore from 'expo-secure-store';
import { Job } from "@/types/job";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

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

export function useGetProduct(productId: string) {
    return useQuery<Product>({
        queryKey: ["product", productId],
        queryFn: async () => {
            try {
                const token = await SecureStore.getItemAsync('auth_token');
                if (!token) {
                    throw new Error("Authentication token not found");
                }
                
                //   searchParams.append('filter', `[["name", "=", "${productId}"]]`);
                console.log(`Fetching product with ID: ${productId}`);
                const response = await axios.get<{ data: Product }>(`${BASE_URL}/products/${productId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                console.log("Product", response);

                if (!response.data) {
                    throw new Error("Product not found");
                }

                return response.data.data;
            } catch (error: any) {
                console.error("Failed to fetch product:", error?.response?.data || error);
                throw error instanceof Error
                    ? error
                    : new Error("Failed to fetch product data");
            }
        },
        enabled: !!productId,
        staleTime: 5 * 60 * 1000,
    });
}

export function useUpdateProductCollect() {
    return useMutation({
        mutationKey: ["update-product-collect"],
        mutationFn: async ({ fileUri, jobId, productId }: { fileUri: string, jobId: string, productId: string }) => {
            try {
                const token = await SecureStore.getItemAsync('auth_token');
                if (!token) throw new Error("Authentication token not found");

                const user = await authClient.getSession();
                if (!user.data?.user) throw new Error("User not found");

                const extendedUser = user.data.user as ExtendedUser;

                // 1. Upload file to ERPNext
                const formData = new FormData();
                const fileName = fileUri.split("/").pop() || `kyc_${Date.now()}.jpg`;
                const fileType = fileUri.toLowerCase().endsWith(".pdf")
                    ? "application/pdf"
                    : fileUri.toLowerCase().endsWith(".png")
                        ? "image/png"
                        : "image/jpeg";

                // @ts-ignore
                formData.append("file", {
                    uri: fileUri,
                    name: fileName,
                    type: fileType
                });
                formData.append("is_private", "1");

                console.log("Form Data:", formData);


                const uploadRes = await axios.post(
                    `${BASE_URL}/erp/upload`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "multipart/form-data"
                        },
                        timeout: 30000, // 30 second timeout
                    }
                );

                if (!uploadRes.data?.data?.message?.file_url) {
                    throw new Error("Invalid file upload response");
                }

                const fileUrl = uploadRes.data.data.message.file_url;

                console.log("File URL:", fileUrl);
              
                // 4. First get the existing Installation data
                const getResponse = await axios.get(`${BASE_URL}/erp/resource/Installation/${jobId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!getResponse.data?.data) {
                    throw new Error("Installation not found");
                }

                const installation = getResponse.data.data;
                console.log("Existing Installation:", installation);

                // 5. Update the specific product in the products array
                const updatedProducts = installation.products?.map((product: any) => {
                    if (product.item === productId) {
                        return {
                            ...product,
                            item_reference_image: fileUrl,
                            status: "collected"
                        };
                    }
                    return product;
                }) || [];

                // 6. Update the Installation with the modified products array
                const response = await axios.put<{ data: Job }>(`${BASE_URL}/erp/resource/Installation/${jobId}`,
                    {
                        products: updatedProducts
                    }, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                console.log("Installation update response:", response.data);

                if (!response.data?.data) {
                    throw new Error("Job not found");
                }

                return response.data.data;

            } catch (error) {
                console.error("Product collect error:", error);
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
                throw error;
            }
        },
    });
}