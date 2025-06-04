import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Modal,
  SafeAreaView,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Plus, X, Building2, Link2 } from "lucide-react-native";
import Colors from "@/constants/colors";
import Header from "@/components/Header";

type Partner = {
  id: string;
  name: string;
  code: string;
  joinedDate: string;
};

export default function PartnersScreen() {
  const router = useRouter();
  const [partners, setPartners] = useState<Partner[]>([
    {
      id: "1",
      name: "Home Solutions Inc.",
      code: "HS1234",
      joinedDate: "2025-01-15",
    },
    {
      id: "2",
      name: "Smart Living Technologies",
      code: "SLT567",
      joinedDate: "2025-03-22",
    },
  ]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [partnerCode, setPartnerCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleAddPartner = () => {
    setPartnerCode("");
    setModalVisible(true);
  };

  const handleJoinPartner = () => {
    if (!partnerCode.trim()) {
      Alert.alert("Error", "Please enter a partner code");
      return;
    }

    setIsJoining(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsJoining(false);
      
      // Mock partner data based on code
      const newPartner: Partner = {
        id: Date.now().toString(),
        name: "New Partner Company",
        code: partnerCode,
        joinedDate: new Date().toISOString().split("T")[0],
      };
      
      setPartners([...partners, newPartner]);
      setModalVisible(false);
      Alert.alert("Success", `You've successfully joined ${newPartner.name}`);
    }, 1000);
  };

  const handleRemovePartner = (partnerId: string) => {
    Alert.alert(
      "Remove Partner",
      "Are you sure you want to remove this partner?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setPartners(partners.filter(p => p.id !== partnerId));
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Partners" onBack={() => router.back()} />
      
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.description}>
            Connect with partner companies to receive job assignments and collaborate on projects.
          </Text>
          
          <Pressable style={styles.addButton} onPress={handleAddPartner}>
            <Plus size={20} color="white" />
            <Text style={styles.addButtonText}>Add Partner</Text>
          </Pressable>
          
          {partners.length > 0 ? (
            <View style={styles.partnersContainer}>
              {partners.map((partner) => (
                <View key={partner.id} style={styles.partnerCard}>
                  <View style={styles.partnerHeader}>
                    <View style={styles.partnerIcon}>
                      <Building2 size={24} color={Colors.light.primary} />
                    </View>
                    <View style={styles.partnerInfo}>
                      <Text style={styles.partnerName}>{partner.name}</Text>
                      <Text style={styles.partnerCode}>Code: {partner.code}</Text>
                    </View>
                    <Pressable
                      style={styles.removeButton}
                      onPress={() => handleRemovePartner(partner.id)}
                    >
                      <X size={20} color={Colors.light.gray[500]} />
                    </Pressable>
                  </View>
                  
                  <View style={styles.partnerFooter}>
                    <Text style={styles.joinedDate}>
                      Joined on {formatDate(partner.joinedDate)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Link2 size={48} color={Colors.light.gray[400]} />
              <Text style={styles.emptyTitle}>No Partners Yet</Text>
              <Text style={styles.emptyText}>
                Add a partner by entering their partner code to start receiving job assignments.
              </Text>
            </View>
          )}
          
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>About Partnerships</Text>
            <Text style={styles.infoText}>
              • Partners can assign jobs directly to you through the platform.
            </Text>
            <Text style={styles.infoText}>
              • You'll need a valid partner code to establish a connection.
            </Text>
            <Text style={styles.infoText}>
              • You can remove a partner at any time, but this will affect future job assignments.
            </Text>
          </View>
        </ScrollView>
        
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Partner</Text>
                <Pressable
                  style={styles.modalCloseButton}
                  onPress={() => setModalVisible(false)}
                >
                  <X size={24} color={Colors.light.text} />
                </Pressable>
              </View>
              
              <Text style={styles.modalDescription}>
                Enter the partner code provided by the company you want to connect with.
              </Text>
              
              <View style={styles.codeInputContainer}>
                <TextInput
                  style={styles.codeInput}
                  value={partnerCode}
                  onChangeText={setPartnerCode}
                  placeholder="Enter partner code"
                  autoCapitalize="characters"
                />
              </View>
              
              <Pressable
                style={[styles.joinButton, isJoining && styles.joinButtonDisabled]}
                onPress={handleJoinPartner}
                disabled={isJoining}
              >
                <Text style={styles.joinButtonText}>
                  {isJoining ? "Joining..." : "Join Partner"}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  description: {
    fontSize: 16,
    color: Colors.light.gray[600],
    marginBottom: 24,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 14,
    marginBottom: 24,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginLeft: 8,
  },
  partnersContainer: {
    marginBottom: 24,
  },
  partnerCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  partnerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  partnerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  partnerCode: {
    fontSize: 14,
    color: Colors.light.gray[600],
  },
  removeButton: {
    padding: 8,
  },
  partnerFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 12,
  },
  joinedDate: {
    fontSize: 14,
    color: Colors.light.gray[600],
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 32,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.gray[600],
    textAlign: "center",
  },
  infoBox: {
    backgroundColor: Colors.light.primary + "10",
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.gray[700],
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 16,
    color: Colors.light.gray[600],
    marginBottom: 24,
  },
  codeInputContainer: {
    marginBottom: 24,
  },
  codeInput: {
    height: 56,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    textAlign: "center",
    letterSpacing: 2,
  },
  joinButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
  },
  joinButtonDisabled: {
    backgroundColor: Colors.light.gray[400],
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});