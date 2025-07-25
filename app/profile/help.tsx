import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  Platform,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { router, Stack } from "expo-router";
import { 
  Phone, 
  Mail, 
  ChevronRight, 
  FileText, 
  Shield, 
  HelpCircle, 
  MessageSquare 
} from "lucide-react-native";
import Colors from "@/constants/colors";
import Header from "@/components/Header";
import { useTranslation } from "react-i18next";

export default function HelpSupportScreen() {
  const { t } = useTranslation();
  const handleCall = () => {
    const phoneNumber = "+1-800-123-4567";
    if (Platform.OS !== "web") {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert(t("help.contactSupport"), `Call ${phoneNumber}`);
    }
  };

  const handleEmail = () => {
    Linking.openURL("mailto:support@techconnect.com");
  };

  const handleChat = () => {
    Alert.alert(
      t("help.liveChat"),
      t("help.thisWouldOpenALiveChatWithSupportInARealApp")
    );
  };

  const handleOpenLink = (title: string) => {
    Alert.alert(
      title,
      t("help.thisWouldOpenThePageInARealApp", { title })
    );
  };

  const faqItems = [
    {
      question: t("help.howDoIUpdateMyAvailability"),
      answer: t("help.goToProfileAvailabilityToSetYourWorkingHoursForEachDayOfTheWeek")
    },
    {
      question: t("help.howDoIAcceptAJobRequest"),
      answer: t("help.jobRequestsAppearInTheJobsTabTapOnAJobRequestAndSelectAcceptToTakeTheJob")
    },
    {
      question: t("help.howDoICollectStockForAJob"),
      answer: t("help.openTheJobDetailsAndTapOnCollectStockFollowTheInstructionsToScanAndCollectEachItem")
    },
    {
      question: t("help.howDoIPaidForCompletedJobs"),
      answer: t("help.paymentsAreProcessedAutomaticallyAfterAJobIsMarkedAsCompleteAndVerifiedByTheCustomer")
    },
    {
      question: t("help.howDoIConnectWithAPartnerCompany"),
      answer: t("help.goToProfilePartnersAndTapAddPartnerEnterThePartnerCodeProvidedByTheCompany")
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Help & Support" onBack={() => router.back()} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>{t("help.contactSupport")}</Text>
          
          <Pressable style={styles.contactItem} onPress={handleCall}>
            <View style={styles.contactIcon}>
              <Phone size={24} color={Colors.light.primary} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>{t("help.phoneSupport")}</Text>
              <Text style={styles.contactSubtitle}>{t("help.available247")}</Text>
            </View>
            <ChevronRight size={20} color={Colors.light.gray[500]} />
          </Pressable>
          
          <Pressable style={styles.contactItem} onPress={handleEmail}>
            <View style={styles.contactIcon}>
              <Mail size={24} color={Colors.light.primary} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>{t("help.emailSupport")}</Text>
              <Text style={styles.contactSubtitle}>{t("help.responseWithin24Hours")}</Text>
            </View>
            <ChevronRight size={20} color={Colors.light.gray[500]} />
          </Pressable>
          
          <Pressable style={styles.contactItem} onPress={handleChat}>
            <View style={styles.contactIcon}>
              <MessageSquare size={24} color={Colors.light.primary} />
            </View>
            <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>{t("help.liveChat")}</Text>
              <Text style={styles.contactSubtitle}>{t("help.available9AM6PM")}</Text>
            </View>
            <ChevronRight size={20} color={Colors.light.gray[500]} />
          </Pressable>
        </View>
        
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>{t("help.frequentlyAskedQuestions")}</Text>
          
          {faqItems.map((item, index) => (
            <View key={index} style={styles.faqItem}>
              <View style={styles.faqQuestion}>
                <HelpCircle size={20} color={Colors.light.primary} />
                <Text style={styles.questionText}>{item.question}</Text>
              </View>
              <Text style={styles.answerText}>{item.answer}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.linksSection}>
          <Text style={styles.sectionTitle}>{t("help.legalInformation")}</Text>
          
          <Pressable 
            style={styles.linkItem} 
            onPress={() => handleOpenLink("Terms of Service")}
          >
            <FileText size={20} color={Colors.light.gray[600]} />
            <Text style={styles.linkText}>{t("help.termsOfService")}</Text>
            <ChevronRight size={20} color={Colors.light.gray[500]} />
          </Pressable>
          
          <Pressable 
            style={styles.linkItem} 
            onPress={() => handleOpenLink("Privacy Policy")}
          >
            <Shield size={20} color={Colors.light.gray[600]} />
            <Text style={styles.linkText}>{t("help.privacyPolicy")}</Text>
            <ChevronRight size={20} color={Colors.light.gray[500]} />
          </Pressable>
        </View>
        
        <Pressable 
          style={styles.deleteAccountButton}
          onPress={() => {
            Alert.alert(
              t("help.deleteAccount"),
              t("help.areYouSureYouWantToDeleteYourAccountThisActionCannotBeUndone"),
              [
                { text: t("help.cancel"), style: "cancel" },
                { 
                  text: t("help.delete"), 
                  style: "destructive",
                  onPress: () => {
                    // Handle account deletion
                    Alert.alert(t("help.accountDeleted"), t("help.yourAccountHasBeenSuccessfullyDeleted"));
                  }
                }
              ]
            );
          }}
        >
          <Text style={styles.deleteAccountText}>{t("help.deleteAccount")}</Text>
        </Pressable>
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
  contactSection: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.text,
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 14,
    color: Colors.light.gray[600],
  },
  faqSection: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  faqItem: {
    marginBottom: 16,
  },
  faqQuestion: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  questionText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.text,
    marginLeft: 8,
    flex: 1,
  },
  answerText: {
    fontSize: 14,
    color: Colors.light.gray[600],
    marginLeft: 28,
  },
  linksSection: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  linkItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  linkText: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 12,
  },
  deleteAccountButton: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 8,
  },
  deleteAccountText: {
    fontSize: 16,
    color: Colors.light.error,
    fontWeight: "500",
  },
});
