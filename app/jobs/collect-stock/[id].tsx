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
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, CheckCircle, AlertCircle, Package, Camera } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useJobStore } from "@/store/job-store";
import Colors from "@/constants/colors";
import Header from "@/components/Header";

export default function CollectStockScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const { 
    getCurrentJob, 
    setCurrentJobId, 
    updateJobStatus,
    updateProductCollectionStatus
  } = useJobStore();
  
  // Set current job ID when screen loads
  useEffect(() => {
    if (id) {
      setCurrentJobId(id);
    }
    return () => setCurrentJobId(null);
  }, [id, setCurrentJobId]);
  
  const job = getCurrentJob();
  
  if (!job) {
    return (
      <View style={styles.container}>
        <Text>Job not found</Text>
      </View>
    );
  }

  const handleCollectProduct = async (productId: string) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert("Permission Required", "Camera permission is needed to take photos");
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        updateProductCollectionStatus(job.id, productId, true);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        Alert.alert("Success", "Product marked as collected");
      }
    } catch (error) {
      console.error("Error collecting product:", error);
      Alert.alert("Error", "Failed to collect product");
    }
  };

  const handleConfirmCollection = () => {
    setIsLoading(true);
    
    // Check if all required products are collected
    const allCollected = job.products.every(product => product.isCollected);
    
    if (!allCollected) {
      Alert.alert(
        "Incomplete Collection",
        "Not all products have been collected. Do you want to continue anyway?",
        [
          { text: "Cancel", style: "cancel", onPress: () => setIsLoading(false) },
          { 
            text: "Continue", 
            onPress: () => {
              updateJobStatus(job.id, "stock_collected");
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              setIsLoading(false);
              router.back();
            } 
          }
        ]
      );
    } else {
      updateJobStatus(job.id, "stock_collected");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setIsLoading(false);
      router.back();
    }
  };

  // Mock data for stock availability
  const stockAvailability = {
    "prod-001": { available: 1, required: 1 },
    "prod-002": { available: 4, required: 5 },
    "prod-003": { available: 2, required: 2 },
    "prod-004": { available: 4, required: 4 },
    "prod-005": { available: 2, required: 2 },
    "prod-006": { available: 1, required: 1 },
    "prod-007": { available: 1, required: 1 },
    "prod-008": { available: 1, required: 1 },
    "prod-009": { available: 1, required: 1 },
    "prod-010": { available: 1, required: 1 },
    "prod-011": { available: 1, required: 1 },
    "prod-012": { available: 1, required: 1 },
    "prod-013": { available: 1, required: 1 },
    "prod-014": { available: 1, required: 1 },
    "prod-015": { available: 1, required: 1 },
    "prod-016": { available: 1, required: 1 },
    "prod-017": { available: 3, required: 4 },
  };

  return (
    <SafeAreaView style={styles.safeArea}>
     <Header title="Collect Stock" onBack={() => router.back()} />
      
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {job.products.map((product) => {
            const stockInfo = stockAvailability[product.id as keyof typeof stockAvailability] || { available: 1, required: 1 };
            const isInsufficient = stockInfo && stockInfo.available < stockInfo.required;
            
            return (
              <View key={product.id} style={styles.productItem}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productRequired}>Required: {stockInfo?.required || 1}</Text>
                  
                  {isInsufficient && (
                    <Text style={styles.insufficientText}>
                      Insufficient Stock: {stockInfo.available} Available, {stockInfo.required} Required
                    </Text>
                  )}
                </View>
                
                {product.isCollected ? (
                  <View style={styles.collectedBadge}>
                    <Text style={styles.collectedText}>Collected</Text>
                  </View>
                ) : (
                  isInsufficient ? (
                    <View style={styles.toCollectBadge}>
                      <Text style={styles.toCollectText}>To Collect</Text>
                    </View>
                  ) : null
                )}
                
                <Pressable 
                  style={styles.collectButton}
                  onPress={() => handleCollectProduct(product.id)}
                >
                  <Camera size={16} color={Colors.light.text} />
                  <Text style={styles.collectButtonText}>Upload Photo & Collect</Text>
                </Pressable>
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
  insufficientText: {
    fontSize: 14,
    color: Colors.light.error,
    marginTop: 4,
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
