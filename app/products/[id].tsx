import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  SafeAreaView,
  Linking,
  Platform,
  StatusBar,
} from "react-native";
import { Image } from "expo-image";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { 
  ArrowLeft, 
  Info, 
  Wrench, 
  FileText, 
  Star, 
  Package, 
  Truck 
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useJobStore } from "@/store/job-store";
import ActionButton from "@/components/ActionButton";

export default function ProductDetailScreen() {
  const { id, jobId } = useLocalSearchParams<{ id: string; jobId: string }>();
  const router = useRouter();
  const { getCurrentJob, setCurrentJobId } = useJobStore();
  
  // Set current job ID when screen loads
  React.useEffect(() => {
    if (jobId) {
      setCurrentJobId(jobId);
    }
    return () => setCurrentJobId(null);
  }, [jobId, setCurrentJobId]);
  
  const job = getCurrentJob();
  const product = job?.products.find(p => p.id === id);
  
  if (!product) {
    return (
      <View style={styles.container}>
        <Text>Product not found</Text>
      </View>
    );
  }

  const handleOpenManual = () => {
    if (product.manualUrl) {
      Linking.openURL(product.manualUrl);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: "Product Details",
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.headerButton}>
              <ArrowLeft size={24} color={Colors.light.text} />
            </Pressable>
          ),
        }}
      />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Image
          source={{ uri: product.image }}
          style={styles.image}
          contentFit="cover"
        />
        
        <View style={styles.card}>
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.description}>{product.description}</Text>
          
          {product.manualUrl && (
            <ActionButton
              title="View Installation Manual"
              variant="outline"
              onPress={handleOpenManual}
              style={styles.manualButton}
            />
          )}
        </View>
        
        {product.specifications && product.specifications.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Info size={20} color={Colors.light.primary} />
              <Text style={styles.sectionTitle}>Specifications</Text>
            </View>
            
            <View style={styles.specsList}>
              {product.specifications.map((spec, index) => (
                <View key={index} style={styles.specItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.specText}>{spec}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {product.toolsRequired && product.toolsRequired.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Wrench size={20} color={Colors.light.primary} />
              <Text style={styles.sectionTitle}>Tools Required</Text>
            </View>
            
            <View style={styles.toolsList}>
              {product.toolsRequired.map((tool, index) => (
                <View key={index} style={styles.toolItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.toolText}>{tool}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color={Colors.light.primary} />
            <Text style={styles.sectionTitle}>Installation Notes</Text>
          </View>
          
          <Text style={styles.installationText}>
            1. Ensure power is disconnected before installation.
          </Text>
          <Text style={styles.installationText}>
            2. Follow the manufacturer's instructions in the manual.
          </Text>
          <Text style={styles.installationText}>
            3. Test the device after installation to ensure proper functionality.
          </Text>
          <Text style={styles.installationText}>
            4. Demonstrate usage to the customer.
          </Text>
        </View>
      </ScrollView>
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
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  image: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: Colors.light.gray[200],
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: Colors.light.gray[700],
    marginBottom: 16,
  },
  manualButton: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginLeft: 8,
  },
  specsList: {
    marginBottom: 8,
  },
  specItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
    marginRight: 8,
  },
  specText: {
    fontSize: 16,
    color: Colors.light.gray[700],
  },
  toolsList: {
    marginBottom: 8,
  },
  toolItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  toolText: {
    fontSize: 16,
    color: Colors.light.gray[700],
  },
  installationText: {
    fontSize: 16,
    color: Colors.light.gray[700],
    marginBottom: 8,
  },
  headerButton: {
    padding: 8,
  },
});
