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
import { Product } from "@/types/job";
import { useUpdateJobStatus } from "@/app/api/jobs/updateStatus";

export default function CollectStockScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { products, item_name } = useLocalSearchParams<{ products: string, item_name: string }>();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [parsedProducts, setParsedProducts] = useState<Product[]>([]);
  const { mutate: updateJobStatus, isPending: isUpdatingJobStatus } = useUpdateJobStatus();
  
  console.log("CollectStockScreen params:", { jobId, products, item_name });
  
  // Parse products from params
  useEffect(() => {
    if (products) {
      try {
        const productsData = JSON.parse(products);
        console.log("Parsed products:", productsData);
        setParsedProducts(productsData);
      } catch (error) {
        console.error('Failed to parse products:', error);
      }
    }
  }, [products]);
  
  

  const handleCollectProduct = async (productId: string) => {
    if (!jobId) return;
    
    // Show options dialog
    Alert.alert(
      "Select Photo",
      "Choose how you want to add a photo",
      [
        {
          text: "Camera",
          onPress: () => handleCameraCapture(productId),
        },
        {
          text: "Gallery",
          onPress: () => handleGalleryPick(productId),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const handleCameraCapture = async (productId: string) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert("Permission Required", "Camera permission is needed to take photos");
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
      });
      
      handleImageResult(result, productId);
    } catch (error) {
      console.error("Error collecting product:", error);
      Alert.alert("Error", "Failed to collect product");
    }
  };

  const handleGalleryPick = async (productId: string) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert("Permission Required", "Gallery permission is needed to select photos");
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.8,
        allowsEditing: false,
        allowsMultipleSelection: true,
        selectionLimit: 5, // Allow up to 5 images for product collection
      });
      
      handleImageResult(result, productId);
    } catch (error) {
      console.error("Error collecting product:", error);
      Alert.alert("Error", "Failed to collect product");
    }
  };

  const handleImageResult = (result: any, productId: string) => {
    if (!result.canceled && result.assets && result.assets.length > 0) {
      console.log(`Processing ${result.assets.length} images for product ${productId}`);
      
      // Process each selected image
      result.assets.forEach((asset: any, index: number) => {
        console.log(`Processing image ${index + 1} for product ${productId}`);
        
        // Update job status for each image (you might want to modify this based on your requirements)
        updateJobStatus({ jobId: jobId, status: "Stock Collected" });
        
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        if (index === result.assets.length - 1) {
          // Show success message only after the last image is processed
          Alert.alert("Success", `${result.assets.length} photo(s) uploaded for product collection`);
        }
      });
    }
  };

  const handleConfirmCollection = () => {
    if (!jobId) return;
    setIsLoading(true);
    
    // Check if all required products are collected
    const allCollected = parsedProducts.every((product: Product) => product.isCollected);
    
    if (!allCollected) {
      Alert.alert(
        "Incomplete Collection",
        "Not all products have been collected. Do you want to continue anyway?",
        [
          { text: "Cancel", style: "cancel", onPress: () => setIsLoading(false) },
          { 
            text: "Continue", 
            onPress: () => {
              if (jobId) {
                updateJobStatus({ jobId: jobId, status: "Stock Collected" });
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
      updateJobStatus({ jobId: jobId, status: "Stock Collected" });
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
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text>Loading Job Details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
     <Header title="Collect Stock" onBack={() => router.back()} />
      
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {parsedProducts.map((product: Product) => {
            // Default to 1 required if not specified
            const requiredQuantity = 1;
            const isInsufficient = false; // We'll handle this based on actual stock data if needed
            
            return (
              <View key={product.id} style={styles.productItem}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.item_name}</Text>
                  <Text style={styles.productRequired}>Required: {requiredQuantity}</Text>
                  {/* <Text style={styles.productDescription}>{product.description}</Text> */}
                  
                  {isInsufficient && (
                    <Text style={styles.insufficientText}>
                      Insufficient Stock
                    </Text>
                  )}
                  
                </View>
                
                {product.isCollected ? (
                  <View style={styles.collectedBadge}>
                    <Text style={styles.collectedText}>Collected</Text>
                  </View>
                ) : (
                  <View style={styles.toCollectBadge}>
                    <Text style={styles.toCollectText}>To Collect</Text>
                  </View>
                )}
                
                <Pressable 
                  style={styles.collectButton}
                  onPress={() => handleCollectProduct(product.id)}
                >
                  <Camera size={16} color={Colors.light.text} />
                  <Text style={styles.collectButtonText}>Upload Photo & Collect</Text>
                </Pressable>

                {product.manualUrl && (
                  <Pressable style={[styles.collectButton, { marginTop: 8 }]} onPress={() => product.manualUrl && Linking.openURL(product.manualUrl)}>
                    <Book size={16} color={Colors.light.text} />
                    <Text style={styles.collectButtonText}>
                      Installation Guides
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </ScrollView>
        
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
});
