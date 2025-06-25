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
import { ArrowLeft, CheckCircle, AlertCircle, Package, Camera, Book } from "lucide-react-native";
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

// Custom skeleton for collect stock page
const CollectStockSkeleton = () => {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Skeleton Product Items */}
        {[1, 2, 3].map((index) => (
          <View key={index} style={styles.productItem}>
            <View style={styles.productInfo}>
              {/* Product Name Skeleton */}
              <View style={[styles.skeletonText, { width: '70%', height: 20, marginBottom: 8 }]} />
              {/* Required Quantity Skeleton */}
              <View style={[styles.skeletonText, { width: '40%', height: 16, marginBottom: 8 }]} />
              {/* Insufficient Stock Skeleton */}
              <View style={[styles.skeletonText, { width: '50%', height: 16, marginBottom: 12 }]} />
            </View>
            
            {/* Status Badge Skeleton */}
            <View style={[styles.skeletonBadge, { width: 80, height: 24, marginBottom: 12 }]} />
            
            {/* Collect Button Skeleton */}
            <View style={[styles.skeletonButton, { height: 40, marginBottom: 8 }]} />
            
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
const CollectProductItem = ({ product, onCollect }: { product: any, onCollect: (productId: string) => void }) => {
  const { data: productData } = useGetProduct(product.item);
  const { data: stockData } = useGetStock(product.item);
  console.log(`Stock Data for ${product.item}:`, stockData);
  console.log(`Product item: ${product.item}, quantity: ${product.quantity}`);
  return (
    <View style={styles.productItem}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{productData?.item_name || `Item ${product.item}`}</Text>
        <Text style={styles.productRequired}>Required: {product.quantity || 1}</Text>
        
        {stockData?.quantity !== undefined && stockData.quantity < (product.quantity) && product.status === "Collected" && (
          <Text style={styles.insufficientText}>
            Insufficient Stock: {stockData.quantity}
          </Text>
        )}
      </View>
      
      {product.status === "collected" ? (
        <View style={styles.collectedBadge}>
          <Text style={styles.collectedText}>Collected</Text>
        </View>
      ) : (
        <View style={styles.toCollectBadge}>
          <Text style={styles.toCollectText}>To Collect</Text>
        </View>
      )}


      {product.status === "Collected" && (
      <Pressable 
        style={styles.collectButton}
        onPress={() => onCollect(product.item)}
      >
        <Camera size={16} color={Colors.light.text} />
        <Text style={styles.collectButtonText}>Upload Photo & Collect</Text>
      </Pressable>
      )}

      {productData?.installation_guide && (
        <Pressable style={[styles.collectButton, { marginTop: 8 }]} onPress={() => productData.installation_guide && Linking.openURL(productData.installation_guide)}>
          <Book size={16} color={Colors.light.text} />
          <Text style={styles.collectButtonText}>
            Installation Guides
          </Text>
        </Pressable>
      )}
    </View>
  );
};

export default function CollectStockScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { products, item_name } = useLocalSearchParams<{ products: string, item_name: string }>();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [parsedProducts, setParsedProducts] = useState<Product[]>([]);
  const { mutate: updateJobStatus, isPending: isUpdatingJobStatus } = useUpdateJobStatus();
  const { mutate: updateProductCollect, isPending: isUpdatingProductCollect } = useUpdateProductCollect();
  const queryClient = useQueryClient();
  console.log("CollectStockScreen params:", { jobId, products, item_name });
  console.log("Products type:", typeof products);
  console.log("Products value:", products);
  console.log("jobId type:", typeof jobId);
  console.log("jobId value:", jobId);
  console.log("All params:", useLocalSearchParams());
  
  // Parse products from params
  useEffect(() => {
    console.log("useEffect triggered with products:", products);
    if (products) {
      try {
        const productsData = JSON.parse(products);
        console.log("Parsed products:", productsData);
        console.log("Parsed products length:", productsData?.length);
        setParsedProducts(productsData);
      } catch (error) {
        console.error('Failed to parse products:', error);
        console.error('Products string that failed to parse:', products);
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
      Alert.alert("Error", "Job ID not found. Please try again.");
      return;
    }
    
    // Check if we're on web platform
    if (Platform.OS === 'web') {
      console.log("Web platform detected, using alternative approach");
      Alert.alert("Not Supported", "Camera functionality is not available on web platform. Please use a mobile device.");
      return;
    }
    
    console.log("Showing photo selection dialog...");
    
    // Show options dialog
    Alert.alert(
      "Select Photo",
      "Choose how you want to add a photo",
      [
        {
          text: "Camera",
          onPress: () => {
            console.log("Camera option selected");
            handleCameraCapture(productId);
          },
        },
        {
          text: "Gallery",
          onPress: () => {
            console.log("Gallery option selected");
            handleGalleryPick(productId);
          },
        },
        {
          text: "Cancel",
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
        Alert.alert("Permission Required", "Camera permission is needed to take photos");
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
      Alert.alert("Error", "Failed to collect product");
    }
  };

  const handleGalleryPick = async (productId: string) => {
    console.log("handleGalleryPick called for productId:", productId);
    try {
      console.log("Requesting gallery permissions...");
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log("Gallery permission status:", status);
      
      if (status !== "granted") {
        console.log("Gallery permission denied");
        Alert.alert("Permission Required", "Gallery permission is needed to select photos");
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
      Alert.alert("Error", "Failed to collect product");
    }
  };

  const handleImageResult = (result: any, productId: string) => {
    if (!result.canceled && result.assets && result.assets.length > 0) {
      console.log(`Processing ${result.assets.length} images for product ${productId}`);
      
      // Get the current jobId
      const currentJobId = jobId || "fallback-job-id";
      
      // Process each selected image
      result.assets.forEach((asset: any, index: number) => {
        console.log(`Processing image ${index + 1} for product ${productId}`);
        
        // Update product collection status with the image
        updateProductCollect({
          fileUri: asset.uri,
          jobId: currentJobId,
          productId: productId
        }, {
          onSuccess: (updatedJob) => {
            console.log(`Successfully updated product collection for ${productId}`);
            
            // Update local state to mark product as collected
            setParsedProducts(prev => prev.map(product => 
              product.item === productId 
                ? { ...product, isCollected: true }
                : product
            ));
            
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            
            if (index === result.assets.length - 1) {
              // Show success message only after the last image is processed
              queryClient.invalidateQueries({ queryKey: ["job", jobId] });
              Alert.alert("Success", `${result.assets.length} photo(s) uploaded for product collection`);
            }
          },
          onError: (error) => {
            console.error(`Failed to update product collection for ${productId}:`, error);
            Alert.alert("Error", `Failed to collect product: ${error.message}`);
          }
        });
      });
    }
  };

  const handleConfirmCollection = () => {
    const currentJobId = jobId || "fallback-job-id";
    if (!currentJobId || currentJobId === "fallback-job-id") return;
    setIsLoading(true);
    
    // Check if all required products are collected
    const allCollected = parsedProducts.every((product: Product) => product.status === "collected");
    
    if (!allCollected) {
      Alert.alert(
        "Incomplete Collection",
        "Not all products have been collected. Do you want to continue anyway?",
        [
          { text: "Cancel", style: "cancel", onPress: () => setIsLoading(false) },
          { 
            text: "Continue", 
            onPress: () => {
              if (currentJobId) {
                updateJobStatus({ jobId: currentJobId, status: "Stock Collected" });
                if (Platform.OS !== "web") {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
                setIsLoading(false);
                router.back();
              }
            } 
          }
        ]
      );
    } else {
      updateJobStatus({ jobId: currentJobId, status: "Stock Collected" });
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
        <Header title="Collect Stock" onBack={() => router.back()} />
        <CollectStockSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
     <Header title="Collect Stock" onBack={() => router.back()} />
      
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {parsedProducts.map((product: Product, index: number) => {
            console.log(`Rendering product ${index + 1}/${parsedProducts.length}:`, product);
            // Default to 1 required if not specified
            const requiredQuantity = 1;
            const isInsufficient = false; // We'll handle this based on actual stock data if needed
            
            return (
              <CollectProductItem key={product.name || product.item} product={product} onCollect={handleCollectProduct} />
            );
          })}
        </ScrollView>
        

        {parsedProducts.every((product: Product) => product.status === "collected") && (
        <Pressable 
          style={[
            styles.confirmButton,
            isLoading && styles.disabledButton
          ]} 
          onPress={handleConfirmCollection}
          disabled={isLoading}
        >
          <Text style={styles.confirmButtonText}>Confirm Stock Collection</Text>
        </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
