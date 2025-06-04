import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Alert,
  SafeAreaView,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Plus, X } from "lucide-react-native";
import Colors from "@/constants/colors";

export default function SkillsScreen() {
  const router = useRouter();
  const [selectedSkills, setSelectedSkills] = useState([
    "Electrical work",
    "HVAC",
    "Glass work"
  ]);
  const [isSaving, setIsSaving] = useState(false);
  
  const availableSkills = [
    "Electrical work",
    "HVAC",
    "Glass work",
    "Heat Pump installation",
    "Plumbing",
    "Carpentry",
    "Painting",
    "Flooring",
    "Roofing",
    "Solar Panel Installation",
    "Smart Home Setup",
    "Security Systems"
  ];
  
  const unselectedSkills = availableSkills.filter(
    skill => !selectedSkills.includes(skill)
  );

  const handleAddSkill = (skill: string) => {
    setSelectedSkills([...selectedSkills, skill]);
  };

  const handleRemoveSkill = (skill: string) => {
    setSelectedSkills(selectedSkills.filter(s => s !== skill));
  };

  const handleSave = () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      Alert.alert("Success", "Skills updated successfully");
      router.back();
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: "Skills & Expertise" }} />
      
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <Text style={styles.description}>
            Select skills that best represent your expertise. These will be visible to customers and partners.
          </Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Skills</Text>
            {selectedSkills.length > 0 ? (
              <View style={styles.skillTags}>
                {selectedSkills.map((skill) => (
                  <View key={skill} style={styles.selectedSkillTag}>
                    <Text style={styles.selectedSkillText}>{skill}</Text>
                    <Pressable
                      style={styles.removeButton}
                      onPress={() => handleRemoveSkill(skill)}
                    >
                      <X size={16} color={Colors.light.primary} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>
                You haven't added any skills yet. Add skills from the list below.
              </Text>
            )}
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Skills</Text>
            <View style={styles.skillTags}>
              {unselectedSkills.map((skill) => (
                <Pressable
                  key={skill}
                  style={styles.unselectedSkillTag}
                  onPress={() => handleAddSkill(skill)}
                >
                  <Plus size={16} color={Colors.light.gray[600]} />
                  <Text style={styles.unselectedSkillText}>{skill}</Text>
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
              {isSaving ? "Saving..." : "Save Changes"}
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
