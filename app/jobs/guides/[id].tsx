import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  Pressable,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  Wrench,
  AlertTriangle,
  CheckCircle,
  FileText,
  ExternalLink,
  ChevronRight,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import Header from "@/components/Header";

export default function InstallationGuideScreen() {
  const { id, productId } = useLocalSearchParams<{ id: string; productId: string }>();
  const router = useRouter();
  
  // Hardcoded product data (temporary until backend integration)
  const product = {
    id: productId || "prod-001",
    name: "Smart Thermostat Pro",
    image: "https://images.unsplash.com/photo-1567925368711-895d3a1bfd98?q=80&w=300",
    description: "Energy-efficient smart thermostat with voice control",
    manualUrl: "https://example.com/manuals/thermostat-pro.pdf",
    specifications: ["Wi-Fi enabled", "Voice control compatible", "Energy usage reports"],
    toolsRequired: ["Screwdriver", "Wire stripper", "Level", "Voltage tester", "Drill (optional)"],
  };

  const handleOpenManual = () => {
    if (product.manualUrl) {
      Linking.openURL(product.manualUrl);
    }
  };

  // Hardcoded installation steps
  const installationSteps = [
    {
      title: "Preparation",
      description: "Ensure power is disconnected before installation. Turn off the power at the circuit breaker. Gather all required tools and materials.",
      image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=300"
    },
    {
      title: "Remove Old Thermostat",
      description: "Carefully remove the old thermostat cover. Take a photo of the wiring for reference. Label the wires according to their terminals.",
      image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=300"
    },
    {
      title: "Install Mounting Plate",
      description: "Disconnect wires from old thermostat. Remove the old mounting plate. Install the new mounting plate using the provided screws.",
      image: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=300"
    },
    {
      title: "Connect Wiring",
      description: "Connect the wires to the appropriate terminals on the new thermostat according to your wiring photo and the manual's wiring diagram.",
      image: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?q=80&w=300"
    },
    {
      title: "Attach Thermostat",
      description: "Carefully push excess wires back into the wall. Attach the thermostat to the mounting plate until it clicks into place.",
      image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=300"
    },
    {
      title: "Power and Setup",
      description: "Restore power at the circuit breaker. Follow the on-screen instructions to set up Wi-Fi connection and initial configuration.",
      image: "https://images.unsplash.com/photo-1581092921461-7d65ca45ec9a?q=80&w=300"
    }
  ];

  // Hardcoded safety warnings
  const safetyWarnings = [
    "Always turn off power at the circuit breaker before installation",
    "Use a voltage tester to confirm power is off before touching any wires",
    "Follow all local electrical codes and regulations",
    "If you encounter aluminum wiring, consult a professional electrician",
    "Keep small parts away from children and pets"
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Installation Guide" onBack={() => router.back()} />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Product Overview */}
        <View style={styles.productHeader}>
          <Image
            source={{ uri: product.image }}
            style={styles.productImage}
            contentFit="cover"
          />
          
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productDescription} numberOfLines={2}>
              {product.description}
            </Text>
          </View>
        </View>
        
        {/* Manual Button */}
        <Pressable style={styles.manualButton} onPress={handleOpenManual}>
          <FileText size={20} color={Colors.light.primary} />
          <Text style={styles.manualButtonText}>View Full Manual</Text>
          <ExternalLink size={16} color={Colors.light.primary} />
        </Pressable>
        
        {/* Required Tools */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Wrench size={20} color={Colors.light.primary} />
            <Text style={styles.sectionTitle}>Required Tools</Text>
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
        
        {/* Safety Warnings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertTriangle size={20} color={Colors.light.error} />
            <Text style={[styles.sectionTitle, { color: Colors.light.error }]}>Safety Warnings</Text>
          </View>
          
          <View style={styles.warningsList}>
            {safetyWarnings.map((warning, index) => (
              <View key={index} style={styles.warningItem}>
                <AlertTriangle size={16} color={Colors.light.error} />
                <Text style={styles.warningText}>{warning}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Installation Steps */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CheckCircle size={20} color={Colors.light.primary} />
            <Text style={styles.sectionTitle}>Installation Steps</Text>
          </View>
          
          {installationSteps.map((step, index) => (
            <View key={index} style={styles.stepItem}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                </View>
                <Text style={styles.stepTitle}>{step.title}</Text>
              </View>
              
              <Image
                source={{ uri: step.image }}
                style={styles.stepImage}
                contentFit="cover"
              />
              
              <Text style={styles.stepDescription}>{step.description}</Text>
            </View>
          ))}
        </View>
        
        {/* Tips for Success */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CheckCircle size={20} color={Colors.light.success} />
            <Text style={[styles.sectionTitle, { color: Colors.light.success }]}>Tips for Success</Text>
          </View>
          
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <View style={[styles.bulletPoint, { backgroundColor: Colors.light.success }]} />
              <Text style={styles.tipText}>Take photos before disconnecting any wires</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={[styles.bulletPoint, { backgroundColor: Colors.light.success }]} />
              <Text style={styles.tipText}>Label wires with tape if needed</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={[styles.bulletPoint, { backgroundColor: Colors.light.success }]} />
              <Text style={styles.tipText}>Keep small parts in a container to avoid losing them</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={[styles.bulletPoint, { backgroundColor: Colors.light.success }]} />
              <Text style={styles.tipText}>Test the device before finalizing the installation</Text>
            </View>
          </View>
        </View>
        
        {/* Support Contact */}
        <View style={styles.supportSection}>
          <Text style={styles.supportTitle}>Need Help?</Text>
          <Text style={styles.supportText}>
            Contact manufacturer support at 1-800-123-4567 or visit their website for additional assistance.
          </Text>
          <Pressable style={styles.supportButton} onPress={() => Linking.openURL('https://example.com/support')}>
            <Text style={styles.supportButtonText}>Contact Support</Text>
            <ChevronRight size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      </ScrollView>
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
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  productHeader: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: Colors.light.gray[600],
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  manualButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.primary,
    marginLeft: 8,
    marginRight: 8,
  },
  section: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 8,
  },
  toolsList: {
    marginBottom: 8,
  },
  toolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
    marginRight: 8,
  },
  toolText: {
    fontSize: 16,
    color: Colors.light.gray[700],
  },
  warningsList: {
    marginBottom: 8,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  warningText: {
    fontSize: 14,
    color: Colors.light.gray[800],
    marginLeft: 8,
    flex: 1,
  },
  stepItem: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.gray[200],
    paddingBottom: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  stepImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 14,
    color: Colors.light.gray[700],
    lineHeight: 20,
  },
  tipsList: {
    marginBottom: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: Colors.light.gray[700],
  },
  supportSection: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  supportText: {
    fontSize: 14,
    color: Colors.light.gray[600],
    textAlign: 'center',
    marginBottom: 16,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginRight: 8,
  },
});
