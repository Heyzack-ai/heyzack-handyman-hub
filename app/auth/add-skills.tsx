import React, { useState } from "react";
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
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Plus, X } from "lucide-react-native";
import Colors from "@/constants/colors";
import Header from "@/components/Header";
import { useTranslation } from "react-i18next";
export default function SkillsScreen() {
  const router = useRouter();
  const { email, password } = useLocalSearchParams();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { t } = useTranslation();
  
  const availableSkills = [
    {value: "Electrical work", label: t("auth.electricalWork")},
    {value: "HVAC", label: t("auth.hvac")},
    {value: "Glass work", label: t("auth.glassWork")},
    {value: "Heat Pump installation", label: t("auth.heatPumpInstallation")},
    {value: "Plumbing", label: t("auth.plumbing")},
    {value: "Carpentry", label: t("auth.carpentry")},
    {value: "Painting", label: t("auth.painting")},
    {value: "Flooring", label: t("auth.flooring")},
    {value: "Roofing", label: t("auth.roofing")},
    {value: "Solar Panel Installation", label: t("auth.solarPanelInstallation")},
    {value: "Smart Home Setup", label: t("auth.smartHomeSetup")},
    {value: "Security Systems", label: t("auth.securitySystems")}
  ];
  
  const unselectedSkills = availableSkills.filter(
    skill => !selectedSkills.includes(skill.value)
  );

  const handleAddSkill = (skill: {value: string, label: string}) => {
    setSelectedSkills([...selectedSkills, skill.value]);
  };

  const handleRemoveSkill = (skill: {value: string, label: string}) => {
    setSelectedSkills(selectedSkills.filter(s => s !== skill.value));
  };

  const handleSave = () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      Alert.alert(t("auth.success"), t("auth.skillsUpdatedSuccessfully"));

        router.push({
          pathname: "/auth/add-area",
          params: {
            email,
            password,
            selectedSkills,
          },
        });
        }, 1000);
    };

  return (
    <SafeAreaView style={styles.safeArea}>
     <Header title={t("auth.skillsAndExpertise")} onBack={() => router.back()} />
      
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <Text style={styles.description}>
            {t("auth.selectSkills")}
          </Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("auth.yourSkills")}</Text>
            {selectedSkills.length > 0 ? (
              <View style={styles.skillTags}>
                {selectedSkills.map((skill) => {
                  const skillData = availableSkills.find(s => s.value === skill);
                  return (
                    <View key={skill} style={styles.selectedSkillTag}>
                      <Text style={styles.selectedSkillText}>{skillData?.label}</Text>
                    <Pressable
                      style={styles.removeButton}
                      onPress={() => handleRemoveSkill({value: skill, label: skillData?.label || "" })}
                    >
                      <X size={16} color={Colors.light.primary} />
                    </Pressable>
                  </View>
                );
              })}
              </View>
            ) : (
              <Text style={styles.emptyText}>
                {t("auth.youHavenTAddedAnySkillsYetAddSkillsFromTheListBelow")}
              </Text>
            )}
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("auth.availableSkills")}</Text>
            <View style={styles.skillTags}>
              {unselectedSkills.map((skill) => (
                <Pressable
                  key={skill.value}
                  style={styles.unselectedSkillTag}
                  onPress={() => handleAddSkill(skill)}
                >
                  <Plus size={16} color={Colors.light.gray[600]} />
                  <Text style={styles.unselectedSkillText}>{skill.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
        
        <View style={styles.footer}>
          <Pressable
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? t("auth.saving") : t("auth.saveChanges")}
            </Text>
          </Pressable>
        </View>
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
  section: {
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
  skillTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  selectedSkillTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.primary + "20",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  selectedSkillText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: "500",
    marginRight: 4,
  },
  removeButton: {
    padding: 2,
  },
  unselectedSkillTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.gray[200],
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  unselectedSkillText: {
    fontSize: 14,
    color: Colors.light.gray[700],
    fontWeight: "500",
    marginLeft: 4,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.gray[600],
    fontStyle: "italic",
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
