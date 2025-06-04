import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Camera, Upload, Check } from "lucide-react-native";
import Colors from "@/constants/colors";
import Header from "@/components/Header";

export default function EditProfileScreen() {
  const router = useRouter();
  const [avatar, setAvatar] = useState("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300");
  const [fullName, setFullName] = useState("John Doe");
  const [email, setEmail] = useState("john.doe@example.com");
  const [phone, setPhone] = useState("+1 (555) 123-4567");
  const [location, setLocation] = useState("San Francisco, CA");
  const [kycDocument, setKycDocument] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please grant camera roll permissions to change your profile photo.");
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatar(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please grant camera permissions to take a profile photo.");
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatar(result.assets[0].uri);
    }
  };

  const uploadKycDocument = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please grant camera roll permissions to upload documents.");
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setKycDocument(result.assets[0].uri);
      // In a real app, you would upload this to your server and verify
      setIsVerified(true);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      Alert.alert("Success", "Profile updated successfully");
      router.back();
    }, 1000);
  };

  const handleChangePassword = () => {
    router.push("/profile/change-password");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Edit Profile" onBack={() => router.back()} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: avatar }}
              style={styles.avatar}
              contentFit="cover"
            />
            {isVerified && (
              <View style={styles.verifiedBadge}>
                <Check size={12} color="white" />
              </View>
            )}
          </View>
          
          <View style={styles.photoButtons}>
            <Pressable style={styles.photoButton} onPress={takePhoto}>
              <Camera size={20} color={Colors.light.primary} />
              <Text style={styles.photoButtonText}>Camera</Text>
            </Pressable>
            
            <Pressable style={styles.photoButton} onPress={pickImage}>
              <Upload size={20} color={Colors.light.primary} />
              <Text style={styles.photoButtonText}>Gallery</Text>
            </Pressable>
          </View>
        </View>
        
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Enter your location"
            />
          </View>
          
          <Pressable style={styles.passwordButton} onPress={handleChangePassword}>
            <Text style={styles.passwordButtonText}>Change Password</Text>
          </Pressable>
        </View>
        
        <View style={styles.kycSection}>
          <Text style={styles.sectionTitle}>Identity Verification</Text>
          <Text style={styles.kycDescription}>
            Upload a government-issued ID to verify your identity and get a verified badge.
          </Text>
          
          <Pressable 
            style={styles.kycButton} 
            onPress={uploadKycDocument}
          >
            <Upload size={20} color={Colors.light.primary} />
            <Text style={styles.kycButtonText}>
              {kycDocument ? "Change Document" : "Upload Document"}
            </Text>
          </Pressable>
          
          {kycDocument && (
            <View style={styles.documentPreview}>
              <Image
                source={{ uri: kycDocument }}
                style={styles.documentImage}
                contentFit="cover"
              />
              <View style={styles.documentStatus}>
                <Text style={styles.documentStatusText}>
                  {isVerified ? "Verified" : "Pending Verification"}
                </Text>
              </View>
            </View>
          )}
        </View>
        
        <Pressable 
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Text>
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
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.light.gray[200],
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  photoButtons: {
    flexDirection: "row",
    gap: 16,
  },
  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  photoButtonText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: "500",
    marginLeft: 6,
  },
  formSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: "white",
  },
  passwordButton: {
    alignSelf: "flex-start",
    marginTop: 8,
  },
  passwordButtonText: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: "500",
  },
  kycSection: {
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
    marginBottom: 8,
  },
  kycDescription: {
    fontSize: 14,
    color: Colors.light.gray[600],
    marginBottom: 16,
  },
  kycButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    backgroundColor: "white",
  },
  kycButtonText: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: "500",
    marginLeft: 8,
  },
  documentPreview: {
    marginTop: 16,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  documentImage: {
    width: "100%",
    height: 150,
    backgroundColor: Colors.light.gray[200],
  },
  documentStatus: {
    padding: 8,
    backgroundColor: "white",
    alignItems: "center",
  },
  documentStatusText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.primary,
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
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
