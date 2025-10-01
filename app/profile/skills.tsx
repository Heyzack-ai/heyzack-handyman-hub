import React, { useState, useEffect } from "react";
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
import { Stack, useRouter } from "expo-router";
import { Plus, X } from "lucide-react-native";
import Colors from "@/constants/colors";
import Header from "@/components/Header";
import {useAddSkills, useGetSkills} from "@/app/api/user/addskills";

import { useQueryClient } from "@tanstack/react-query";

export default function SkillsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  const { data: skillsData, isLoading, error: skillsError } = useGetSkills();

  useEffect(() => {
    console.log("Skills data:", skillsData);
    
    if (skillsData && !isLoading) {
      try {
        let skillsArray;
        
        // Check different possible response structures
        if (skillsData?.data?.skills) {
          // Nested under data.skills
          if (Array.isArray(skillsData.data.skills)) {
            skillsArray = skillsData.data.skills;
          } else {
            const parsedSkills = JSON.parse(skillsData.data.skills);
            skillsArray = parsedSkills.skills;
          }
        } else if (skillsData?.skills) {
          // Direct skills property
          if (Array.isArray(skillsData.skills)) {
            skillsArray = skillsData.skills;
          } else {
            const parsedSkills = JSON.parse(skillsData.skills);
            skillsArray = parsedSkills.skills;
          }
        } else {
          // No skills found - user hasn't added any yet
          console.log("No skills found - user hasn't added any skills yet");
          return;
        }
        
        const skillNames = skillsArray.map((skill: { name: string }) => skill.name);
        setSelectedSkills(skillNames);
      } catch (error) {
        console.error("Error parsing skills:", error);
      }
    }
  }, [skillsData, isLoading]);
  

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

  const { mutate, error, isPending } = useAddSkills(selectedSkills);

  const handleSave = () => {
    if (!selectedSkills || selectedSkills.length === 0) {
      Alert.alert("Validation", "Please select at least one skill");
      return;
    }


  
    setIsSaving(true);
  
    mutate(undefined, {
      onSuccess: (data) => {
        setIsSaving(false);
        queryClient.invalidateQueries({ queryKey: ["get-skills"] });

        Alert.alert("Success", "Skills added successfully", [
          {
            text: "OK",
            onPress: () => router.back()
          }
        ]);
      },
      onError: (error) => {
        setIsSaving(false);
        Alert.alert("Error", error instanceof Error ? error.message : "Failed to add skills");
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
     <Header title="Skills & Expertise" onBack={() => router.back()} />
      
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <Text style={styles.description}>
            Select skills that best represent your expertise. These will be visible to customers and partners.
          </Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Skills</Text>
            {isLoading ? (
              <Text style={styles.emptyText}>Loading your skills...</Text>
            ) : skillsError ? (
              <Text style={[styles.emptyText, { color: 'red' }]}>
                Error loading skills: {skillsError instanceof Error ? skillsError.message : 'Unknown error'}
              </Text>
            ) : selectedSkills.length > 0 ? (
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
