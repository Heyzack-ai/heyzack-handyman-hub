import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Check } from "lucide-react-native";
import Colors from "@/constants/colors";

type Language = {
  code: string;
  name: string;
  localName: string;
};

export default function LanguageScreen() {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isSaving, setIsSaving] = useState(false);
  
  const languages: Language[] = [
    { code: "en", name: "English", localName: "English" },
    { code: "fr", name: "French", localName: "Français" },
    // Add more languages as needed
  ];

  const handleSelectLanguage = (code: string) => {
    setSelectedLanguage(code);
  };

  const handleSave = () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      Alert.alert("Success", "Language updated successfully");
      router.back();
    }, 1000);
  };

  return (
    <>
      <Stack.Screen options={{ title: "Language" }} />
      
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <Text style={styles.description}>
            Choose your preferred language for the app interface.
          </Text>
          
          <View style={styles.languagesContainer}>
            {languages.map((language) => (
              <Pressable
                key={language.code}
                style={[
                  styles.languageItem,
                  selectedLanguage === language.code && styles.selectedLanguageItem,
                ]}
                onPress={() => handleSelectLanguage(language.code)}
              >
                <View style={styles.languageInfo}>
                  <Text style={styles.languageName}>{language.name}</Text>
                  <Text style={styles.languageLocalName}>{language.localName}</Text>
                </View>
                
                {selectedLanguage === language.code && (
                  <View style={styles.checkIcon}>
                    <Check size={20} color={Colors.light.primary} />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
          
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Language Settings</Text>
            <Text style={styles.infoText}>
              • Changing the language will affect all text in the app.
            </Text>
            <Text style={styles.infoText}>
              • Some content from partners may still appear in their original language.
            </Text>
            <Text style={styles.infoText}>
              • You can change your language preference at any time.
            </Text>
          </View>
        </ScrollView>
        
        <View style={styles.footer}>
          <Pressable
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? "Saving..." : "Save Language"}
            </Text>
          </Pressable>
        </View>
      </View>
    </>
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
    paddingBottom: 80,
  },
  description: {
    fontSize: 16,
    color: Colors.light.gray[600],
    marginBottom: 24,
  },
  languagesContainer: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 24,
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  selectedLanguageItem: {
    backgroundColor: Colors.light.primary + "10",
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.text,
    marginBottom: 4,
  },
  languageLocalName: {
    fontSize: 14,
    color: Colors.light.gray[600],
  },
  checkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primary + "20",
    alignItems: "center",
    justifyContent: "center",
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
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: Colors.light.gray[400],
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});