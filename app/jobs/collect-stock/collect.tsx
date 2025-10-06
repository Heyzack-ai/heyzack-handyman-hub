import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Alert,
  SafeAreaView,
  Platform,
  StatusBar,
  Linking,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Package,
  Camera,
  Book,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import Header from "@/components/Header";
import ShimmerSkeleton from "@/components/ShimmerSkeleton";
import { Product } from "@/types/job";
import { useUpdateJobStatus } from "@/app/api/jobs/updateStatus";
import { useGetProduct } from "@/app/api/products/getProduct";
import { useUpdateProductCollect } from "@/app/api/products/getProduct";
import { useQueryClient } from "@tanstack/react-query";
import { useGetStock } from "@/app/api/products/getStock";
import { useTranslation } from "react-i18next";

// Custom skeleton for collect stock page
const CollectStockSkeleton = () => {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Skeleton Product Items */}
        {[1, 2, 3].map((index) => (
          <View key={index} style={styles.productItem}>
            <View style={styles.productInfo}>
              {/* Product Name Skeleton */}
              <View
                style={[
                  styles.skeletonText,
                  { width: "70%", height: 20, marginBottom: 8 },
                ]}
              />
              {/* Required Quantity Skeleton */}
              <View
                style={[
                  styles.skeletonText,
                  { width: "40%", height: 16, marginBottom: 8 },
                ]}
              />
              {/* Insufficient Stock Skeleton */}
              <View
                style={[
                  styles.skeletonText,
                  { width: "50%", height: 16, marginBottom: 12 },
                ]}
              />
            </View>

            {/* Status Badge Skeleton */}
            <View
              style={[
                styles.skeletonBadge,
                { width: 80, height: 24, marginBottom: 12 },
              ]}
            />

            {/* Collect Button Skeleton */}
            <View
              style={[styles.skeletonButton, { height: 40, marginBottom: 8 }]}
            />

            {/* Installation Guide Button Skeleton */}
            <View style={[styles.skeletonButton, { height: 40 }]} />
          </View>
        ))}
      </ScrollView>

      {/* Confirm Button Skeleton */}
      <View style={[styles.skeletonConfirmButton, { height: 56 }]} />
    </View>
  );
};

// Product Item Component that fetches its own data
const CollectProductItem = ({
  product,
  onCollect,
}: {
  product: any;
  onCollect: (sku: string) => void;
}) => {
  const { t } = useTranslation();
  // Use the stable `item` identifier passed from Installation products
  const rawItemId = product?.item ?? product?.inventoryItemId ?? "";
  const itemId = String(rawItemId).trim();
  if (!itemId) {
    console.log("CollectProductItem: missing itemId for product", product);
  } else {
    console.log("CollectProductItem: using itemId", itemId);
  }
  const { data: productData } = useGetProduct(itemId);
  const { data: stockData } = useGetStock(itemId);
  console.log(`Product Data for ${itemId}:`, productData);


  return (
    <View style={styles.productItem}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>
          {productData?.item_name || productData?.name || product.productName || `Item ${itemId}`}
        </Text>
        <Text style={styles.productRequired}>
          {t("collectStock.required")}: {product.quantity || 1}
        </Text>

        {stockData?.quantity !== undefined &&
          stockData.quantity < (product.quantity || 1) &&
          String(product.status).toLowerCase() === "collected" && (
            <Text style={styles.insufficientText}>
              {t("collectStock.insufficientStock", {
                quantity: stockData.quantity,
              })}
            </Text>
          )}
      </View>

      {String(product.status).toLowerCase() === "collected" || product.isCollected ? (
        <View style={styles.collectedBadge}>
          <Text style={styles.collectedText}>
            {t("collectStock.collected")}
          </Text>
        </View>
      ) : (
        <View style={styles.toCollectBadge}>
          <Text style={styles.toCollectText}>
            {t("collectStock.toCollect")}
          </Text>
        </View>
      )}

      {!(String(product.status).toLowerCase() === "collected" || product.isCollected) && (
        <Pressable
          style={styles.collectButton}
          onPress={() => onCollect(itemId)}
        >
          <Camera size={16} color={Colors.light.text} />
          <Text style={styles.collectButtonText}>
            {t("collectStock.uploadPhotoAndCollect")}
          </Text>
        </Pressable>
      )}

      {productData?.manualUrl && (
        <Pressable
          style={[styles.collectButton, { marginTop: 8 }]}
          onPress={() =>
            productData.manualUrl && Linking.openURL(productData.manualUrl)
          }
        >
          <Book size={16} color={Colors.light.text} />
          <Text style={styles.collectButtonText}>
            {/* {t("collectStock.installationGuides")} */}
            {productData?.manualUrl ? t("collectStock.installationGuides") : ""}
          </Text>
        </Pressable>
      )}
    </View>
  );
};

export default function CollectStockScreen() {
  const { t } = useTranslation();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { products, item_name } = useLocalSearchParams<{
    products: string;
    item_name: string;
  }>();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [parsedProducts, setParsedProducts] = useState<Product[]>([]);
  const { mutate: updateJobStatus, isPending: isUpdatingJobStatus } =
    useUpdateJobStatus();
  const { mutate: updateProductCollect, isPending: isUpdatingProductCollect } =
    useUpdateProductCollect();
  const queryClient = useQueryClient();
  

  // Parse products from params
  useEffect(() => {

    console.log("products:", products);
  
    if (products) {
      try {
        const productsData = JSON.parse(products);
        console.log("Parsed products:", productsData);
        console.log("Parsed products length:", productsData?.length);
        setParsedProducts(productsData);
      } catch (error) {
        console.error("Failed to parse products:", error);
        console.error("Products string that failed to parse:", products);
      }
    } else {
      console.log("No products parameter received");
    }
  }, [products]);

  const handleCollectProduct = async (productId: string) => {
    console.log("handleCollectProduct called with productId:", productId);
    console.log("jobId:", jobId);
    console.log("Platform:", Platform.OS);

    // Use fallback jobId if not available from params
    const currentJobId = jobId || "fallback-job-id";
    console.log("Using jobId:", currentJobId);

    if (!currentJobId || currentJobId === "fallback-job-id") {
      console.log("No valid jobId, returning early");
      Alert.alert(t("collectStock.error"), t("collectStock.jobIdNotFound"));
      return;
    }

    // Check if we're on web platform
    if (Platform.OS === "web") {
      console.log("Web platform detected, using alternative approach");
      Alert.alert(
        t("collectStock.notSupported"),
        t("collectStock.cameraNotAvailable")
      );
      return;
    }

    console.log("Showing photo selection dialog...");

    // Show options dialog
    Alert.alert(
      t("collectStock.selectPhoto"),
      t("collectStock.chooseHowToAddPhotos"),
      [
        {
          text: t("collectStock.camera"),
          onPress: () => {
            console.log("Camera option selected");
            handleCameraCapture(productId);
          },
        },
        {
          text: t("collectStock.gallery"),
          onPress: () => {
            console.log("Gallery option selected");
            handleGalleryPick(productId);
          },
        },
        {
          text: t("collectStock.cancel"),
          style: "cancel",
          onPress: () => {
            console.log("Cancel option selected");
          },
        },
      ]
    );
  };

  const handleCameraCapture = async (productId: string) => {
    console.log("handleCameraCapture called for productId:", productId);
    try {
      console.log("Requesting camera permissions...");
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log("Camera permission status:", status);

      if (status !== "granted") {
        console.log("Camera permission denied");
        Alert.alert(
          t("collectStock.permissionRequired"),
          t("collectStock.cameraPermissionNeeded")
        );
        return;
      }

      console.log("Launching camera...");
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
      });

      console.log("Camera result:", result);
      handleImageResult(result, productId);
    } catch (error) {
      console.error("Error in handleCameraCapture:", error);
      Alert.alert(
        t("collectStock.error"),
        t("collectStock.failedToCollectProduct")
      );
    }
  };

  const handleGalleryPick = async (productId: string) => {
    console.log("handleGalleryPick called for productId:", productId);
    try {
      console.log("Requesting gallery permissions...");
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log("Gallery permission status:", status);

      if (status !== "granted") {
        console.log("Gallery permission denied");
        Alert.alert(
          t("collectStock.permissionRequired"),
          t("collectStock.galleryPermissionNeeded")
        );
        return;
      }

      console.log("Launching gallery...");
      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.8,
        allowsEditing: false,
        allowsMultipleSelection: false,
        selectionLimit: 5, // Allow up to 5 images for product collection
      });

      console.log("Gallery result:", result);
      handleImageResult(result, productId);
    } catch (error) {
      console.error("Error in handleGalleryPick:", error);
      Alert.alert(
        t("collectStock.error"),
        t("collectStock.failedToCollectProduct")
      );
    }
  };

  const handleImageResult = (result: any, productId: string) => {
    if (!result.canceled && result.assets && result.assets.length > 0) {
      console.log(
        `Processing ${result.assets.length} images for product ${productId}`
      );

      // Get the current jobId
      const currentJobId = jobId || "fallback-job-id";

      // Process each selected image
      result.assets.forEach((asset: any, index: number) => {
        console.log(`Processing image ${index + 1} for product ${productId}`);

        // Update product collection status with the image
        updateProductCollect(
          {
            fileUri: asset.uri,
            jobId: currentJobId,
            productId: productId,
          },
          {
            onSuccess: (updatedJob) => {
              console.log(
                `Successfully updated product collection for ${productId}`
              );

              // Silently refetch product and stock details to update status/info
              try {
                // Mark queries stale
                queryClient.invalidateQueries({ queryKey: ["product", productId] });
                queryClient.invalidateQueries({ queryKey: ["stock", productId] });

                // Optimistically update product cache for immediate UI feedback
                queryClient.setQueryData(["product", productId], (prev: any) => {
                  if (!prev || typeof prev !== "object") return prev;
                  return {
                    ...prev,
                    status: "collected",
                    isCollected: true,
                  };
                });
              } catch (e) {
                console.warn("Failed to invalidate/update product cache for", productId, e);
              }

              // Update local state to mark product as collected (match by item or inventoryItemId)
              setParsedProducts((prev) =>
                prev.map((p) =>
                  (String((p as any).item ?? "") === String(productId)) ||
                  (String((p as any).inventoryItemId ?? "") === String(productId))
                    ? { ...p, isCollected: true, status: "collected" }
                    : p
                )
              );

              if (Platform.OS !== "web") {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
              }

              if (index === result.assets.length - 1) {
                // Show success message only after the last image is processed
                const currentJobId = jobId || "fallback-job-id";
                if (currentJobId && currentJobId !== "fallback-job-id") {
                  // Invalidate job details using the correct query key
                  queryClient.invalidateQueries({ queryKey: ["get-jobs", currentJobId] });
                }
                Alert.alert(
                  t("collectStock.success"),
                  t("collectStock.photosUploadedSuccessfully", {
                    count: result.assets.length,
                  })
                );
                // Explicitly refetch the affected product and stock queries
                try {
                  const normalizedId = String(productId ?? "").trim();
                  queryClient.refetchQueries({ queryKey: ["product", normalizedId], type: "active" });
                  queryClient.refetchQueries({ queryKey: ["stock", normalizedId], type: "active" });
                  if (currentJobId && currentJobId !== "fallback-job-id") {
                    queryClient.refetchQueries({ queryKey: ["get-jobs", currentJobId], type: "active", exact: true });
                  }
                } catch (e) {
                  console.warn("Refetch failed for keys", { productId }, e);
                }
              }
            },
            onError: (error) => {
              console.error(
                `Failed to update product collection for ${productId}:`,
                error
              );
              Alert.alert(
                t("collectStock.error"),
                t("collectStock.failedToCollectProduct")
              );
            },
          }
        );
      });
    }
  };

  const handleConfirmCollection = () => {
    const currentJobId = jobId || "fallback-job-id";
    if (!currentJobId || currentJobId === "fallback-job-id") return;
    setIsLoading(true);

    // Check if all required products are collected
    const allCollected = parsedProducts.every(
      (product: Product) => String(product.status).toLowerCase() === "collected" || (product as any).isCollected === true
    );

    if (!allCollected) {
      Alert.alert(
        t("collectStock.incompleteCollection"),
        t("collectStock.notAllProductsCollected"),
        [
          {
            text: t("collectStock.cancel"),
            style: "cancel",
            onPress: () => setIsLoading(false),
          },
          {
            text: t("collectStock.continue"),
            onPress: () => {
              if (currentJobId) {
                updateJobStatus({
                  jobId: currentJobId,
                  status: "stock_collected",
                });
                if (Platform.OS !== "web") {
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success
                  );
                }
                setIsLoading(false);
                router.back();
              }
            },
          },
        ]
      );
    } else {
      // Send standardized lowercase status expected by API
      updateJobStatus({ jobId: currentJobId, status: "stock_collected" });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setIsLoading(false);
      router.back();
    }
  };

  if (parsedProducts.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header
          title={t("collectStock.collectStock")}
          onBack={() => router.back()}
        />
        <CollectStockSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={t("collectStock.collectStock")}
        onBack={() => router.back()}
      />

      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
        >
          {parsedProducts.map((product: Product, index: number) => {
            console.log(
              `Rendering product ${index + 1}/${parsedProducts.length}:`,
              product
            );
            // Default to 1 required if not specified
            const requiredQuantity = 1;
            const isInsufficient = false; // We'll handle this based on actual stock data if needed

            return (
              <CollectProductItem
                key={(product as any).inventoryItemId || product.item || product.sku || `${product.item}-${index}`}
                product={product}
                onCollect={handleCollectProduct}
              />
            );
          })}
        </ScrollView>

        {parsedProducts.every(
          (product: Product) => String(product.status).toLowerCase() === "collected" || (product as any).isCollected === true
        ) && (
          <Pressable
            style={[styles.confirmButton, isLoading && styles.disabledButton]}
            onPress={handleConfirmCollection}
            disabled={isLoading}
          >
            <Text style={styles.confirmButtonText}>
              {t("collectStock.confirmCollection")}
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 80,
    marginTop: 16,
  },
  productItem: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  productInfo: {
    marginBottom: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  productRequired: {
    fontSize: 14,
    color: Colors.light.gray[600],
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: Colors.light.gray[600],
    marginBottom: 4,
  },
  insufficientText: {
    fontSize: 14,
    color: Colors.light.error,
    marginBottom: 4,
  },
  specificationsContainer: {
    marginBottom: 12,
  },
  specificationsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  specificationItem: {
    fontSize: 14,
    color: Colors.light.gray[600],
    marginBottom: 4,
  },
  toolsContainer: {
    marginBottom: 12,
  },
  toolsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  toolItem: {
    fontSize: 14,
    color: Colors.light.gray[600],
    marginBottom: 4,
  },
  collectedBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#E8F5E8",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  collectedText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.success,
  },
  toCollectBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  toCollectText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.error,
  },
  collectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  collectButtonText: {
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 8,
  },
  confirmButton: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "#000000",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: Colors.light.gray[400],
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  // Skeleton styles
  skeletonText: {
    backgroundColor: Colors.light.gray[200],
    borderRadius: 4,
  },
  skeletonBadge: {
    backgroundColor: Colors.light.gray[200],
    borderRadius: 12,
  },
  skeletonButton: {
    backgroundColor: Colors.light.gray[200],
    borderRadius: 8,
  },
  skeletonConfirmButton: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: Colors.light.gray[200],
    borderRadius: 25,
  },
});
