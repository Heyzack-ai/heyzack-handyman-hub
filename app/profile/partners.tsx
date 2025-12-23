import React, { useState, useEffect } from "react";
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
  Platform,
  StatusBar,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Plus, X, Building2, Link2 } from "lucide-react-native";
import Colors from "@/constants/colors";
import Header from "@/components/Header";
import { useGetPartner } from "@/app/api/user/getPartner";
import { Handyman } from "@/types/handyman";
import { useLinkPartner } from "@/app/api/user/linkPartner";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

type Partner = {
  id: string;
  name: string;
  code: string;
  joinedDate: string;
};

export default function PartnersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ partner_code: string, handyman_name: string }>();
  const { user } = useLocalSearchParams<{ user: string }>();
  const parsedUser = user ? JSON.parse(user) as Handyman : null;
  
  const [partners, setPartners] = useState<Partner[]>([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [partnerCode, setPartnerCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const { data: initialPartner, refetch: refetchInitialPartner } = useGetPartner(parsedUser?.partner || "");
  const { mutate: linkPartner } = useLinkPartner(partnerCode);
  const queryClient = useQueryClient();
  console.log("initialPartner", initialPartner);
  
  // Handle deep link parameters
  useEffect(() => {
    if (params.partner_code) {
      setPartnerCode(params.partner_code);
      setModalVisible(true);
    }
  }, [params.partner_code]);

  // Fetch current partner on mount if exists
  useEffect(() => {
    if (parsedUser?.partner) {
      refetchInitialPartner();
    }
  }, [parsedUser?.partner]);

  const handleAddPartner = () => {
    setPartnerCode("");
    setModalVisible(true);
  };

  const handleJoinPartner = async () => {
    if (!partnerCode.trim()) {
      Alert.alert(t("partners.error"), t("partners.pleaseEnterPartnerCode"));
      return;
    }

    setIsJoining(true);
    try {
      if (!parsedUser) {
        Alert.alert(t("partners.error"), t("partners.failedToGetUserData"));
        setIsJoining(false);
        return;
      }

      linkPartner(undefined, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["user"] });
          Alert.alert(t("partners.success"), t("partners.youveSuccessfullyJoinedThePartner"));
          refetchInitialPartner();
          setModalVisible(false);
        },
        onError: () => {
          Alert.alert(t("partners.error"), t("partners.failedToJoinPartner"));
        }
      });
    } catch (error) {
      Alert.alert(t("partners.error"), t("partners.failedToJoinPartner"));
    } finally {
      setIsJoining(false);
    }
  };

  const handleRemovePartner = (partnerId: string) => {
    Alert.alert(
      t("partners.removePartner"),
      t("partners.areYouSureYouWantToRemoveThisPartner"),
      [
        { text: t("partners.cancel"), style: "cancel" },
        {
          text: t("partners.remove"),
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
    <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
      <Header title={t("partners.partners")} onBack={() => router.back()} />
      
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {!initialPartner && (
            <>
             <Text style={styles.description}>
            {t("partners.connectWithPartnerCompaniesToReceiveJobAssignmentsAndCollaborateOnProjects")}
          </Text>
          
          <Pressable style={styles.addButton} onPress={handleAddPartner}>
            <Plus size={20} color="white" />
            <Text style={styles.addButtonText}>{t("partners.addPartner")}</Text>
          </Pressable>
            </>
          )}
         
          
          <View style={styles.partnersContainer}>
            {initialPartner ? (
              <View style={styles.partnerCard}>
                <View style={styles.partnerHeader}>
                  <View style={styles.partnerIcon}>
                    <Building2 size={24} color={Colors.light.primary} />
                  </View>
                  <View style={styles.partnerInfo}>
                    <Text style={styles.partnerName}>{initialPartner.partner_name || initialPartner.name}</Text>
                    <Text style={styles.partnerCode}>{t("partners.code")}: {initialPartner.partner_code || initialPartner.name}</Text>
                    {initialPartner.email && <Text style={styles.partnerCode}>{t("partners.email")}: {initialPartner.email}</Text>}
                    {initialPartner.contact_person && <Text style={styles.partnerCode}>{t("partners.contactPerson")}: {initialPartner.contact_person}</Text>}
                    {initialPartner.phone && <Text style={styles.partnerCode}>{t("partners.phone")}: {initialPartner.phone}</Text>}
                    {initialPartner.address && <Text style={styles.partnerCode}>{t("partners.address")}: {initialPartner.address}</Text>}
                  </View>
                  {/* <Pressable
                    style={styles.removeButton}
                    onPress={() => {
                      setPartners([]); // Remove from UI
                      // TODO: Add backend unlink logic here if needed
                    }}
                  >
                    <X size={20} color={Colors.light.gray[500]} />
                  </Pressable> */}
                </View>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Link2 size={48} color={Colors.light.gray[400]} />
                <Text style={styles.emptyTitle}>{t("partners.noPartnersYet")}</Text>
                <Text style={styles.emptyText}>
                  {t("partners.addAPartnerByEnteringTheirPartnerCodeToStartReceivingJobAssignments")}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>{t("partners.aboutPartnerships")}</Text>
            <Text style={styles.infoText}>
              {t("partners.partnersCanAssignJobsDirectlyToYouThroughThePlatform")}
            </Text>
            <Text style={styles.infoText}>
              {t("partners.youllNeedAValidPartnerCodeToEstablishAConnection")}
            </Text>
            <Text style={styles.infoText}>
              {t("partners.youCanRemoveAPartnerAtAnyTimeButThisWillAffectFutureJobAssignments")}
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
                <Text style={styles.modalTitle}>{t("partners.addPartner")}</Text>
                <Pressable
                  style={styles.modalCloseButton}
                  onPress={() => setModalVisible(false)}
                >
                  <X size={24} color={Colors.light.text} />
                </Pressable>
              </View>
              
              <Text style={styles.modalDescription}>
                {t("partners.enterThePartnerCodeProvidedByTheCompanyYouWantToConnectWith")}
              </Text>
              
              <View style={styles.codeInputContainer}>
                <TextInput
                  style={styles.codeInput}
                  value={partnerCode}
                  onChangeText={setPartnerCode}
                  placeholder={t("partners.enterPartnerCode")}
                  autoCapitalize="characters"
                />
              </View>
              
              <Pressable
                style={[styles.joinButton, isJoining && styles.joinButtonDisabled]}
                onPress={handleJoinPartner}
                disabled={isJoining}
              >
                <Text style={styles.joinButtonText}>
                  {isJoining ? t("partners.joining") : t("partners.joinPartner")}
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
    alignItems: "flex-start",
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
