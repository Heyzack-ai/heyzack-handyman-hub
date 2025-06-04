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

export default function HelpSupportScreen() {
  const handleCall = () => {
    const phoneNumber = "+1-800-123-4567";
    if (Platform.OS !== "web") {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert("Contact Support", `Call ${phoneNumber}`);
    }
  };

  const handleEmail = () => {
    Linking.openURL("mailto:support@techconnect.com");
  };

  const handleChat = () => {
    Alert.alert(
      "Live Chat",
      "This would open a live chat with support in a real app."
    );
  };

  const handleOpenLink = (title: string) => {
    Alert.alert(
      title,
      `This would open the ${title} page in a real app.`
    );
  };

  const faqItems = [
    {
      question: "How do I update my availability?",
      answer: "Go to Profile > Availability to set your working hours for each day of the week."
    },
    {
      question: "How do I accept a job request?",
      answer: "Job requests appear in the Jobs tab. Tap on a job request and select 'Accept' to take the job."
    },
    {
      question: "How do I collect stock for a job?",
      answer: "Open the job details and tap on 'Collect Stock'. Follow the instructions to scan and collect each item."
    },
    {
      question: "How do I get paid for completed jobs?",
      answer: "Payments are processed automatically after a job is marked as complete and verified by the customer."
    },
    {
      question: "How do I connect with a partner company?",
      answer: "Go to Profile > Partners and tap 'Add Partner'. Enter the partner code provided by the company."
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Help & Support" onBack={() => router.back()} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          
          <Pressable style={styles.contactItem} onPress={handleCall}>
            <View style={styles.contactIcon}>
              <Phone size={24} color={Colors.light.primary} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Phone Support</Text>
              <Text style={styles.contactSubtitle}>Available 24/7</Text>
            </View>
            <ChevronRight size={20} color={Colors.light.gray[500]} />
          </Pressable>
          
          <Pressable style={styles.contactItem} onPress={handleEmail}>
            <View style={styles.contactIcon}>
              <Mail size={24} color={Colors.light.primary} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Email Support</Text>
              <Text style={styles.contactSubtitle}>Response within 24 hours</Text>
            </View>
            <ChevronRight size={20} color={Colors.light.gray[500]} />
          </Pressable>
          
          <Pressable style={styles.contactItem} onPress={handleChat}>
            <View style={styles.contactIcon}>
              <MessageSquare size={24} color={Colors.light.primary} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Live Chat</Text>
              <Text style={styles.contactSubtitle}>Available 9AM-6PM</Text>
            </View>
            <ChevronRight size={20} color={Colors.light.gray[500]} />
          </Pressable>
        </View>
        
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          
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
          <Text style={styles.sectionTitle}>Legal Information</Text>
          
          <Pressable 
            style={styles.linkItem} 
            onPress={() => handleOpenLink("Terms of Service")}
          >
            <FileText size={20} color={Colors.light.gray[600]} />
            <Text style={styles.linkText}>Terms of Service</Text>
            <ChevronRight size={20} color={Colors.light.gray[500]} />
          </Pressable>
          
          <Pressable 
            style={styles.linkItem} 
            onPress={() => handleOpenLink("Privacy Policy")}
          >
            <Shield size={20} color={Colors.light.gray[600]} />
            <Text style={styles.linkText}>Privacy Policy</Text>
            <ChevronRight size={20} color={Colors.light.gray[500]} />
          </Pressable>
        </View>
        
        <Pressable 
          style={styles.deleteAccountButton}
          onPress={() => {
            Alert.alert(
              "Delete Account",
              "Are you sure you want to delete your account? This action cannot be undone.",
              [
                { text: "Cancel", style: "cancel" },
                { 
                  text: "Delete", 
                  style: "destructive",
                  onPress: () => {
                    // Handle account deletion
                    Alert.alert("Account Deleted", "Your account has been successfully deleted.");
                  }
                }
              ]
            );
          }}
        >
          <Text style={styles.deleteAccountText}>Delete Account</Text>
        </Pressable>
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
