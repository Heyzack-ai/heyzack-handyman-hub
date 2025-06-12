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
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Camera, Upload, Check } from "lucide-react-native";
import Colors from "@/constants/colors";
import Header from "@/components/Header";
import { Handyman } from "@/types/handyman";
import { useUpdateUser } from "@/app/api/user/getUser";
import { useQueryClient } from "@tanstack/react-query";
import { useUploadKycDocument } from "@/app/api/user/addDocument";
import { useUploadProfileImage } from "@/app/api/user/addProfileImage";
import axios from "axios";
import * as DocumentPicker from 'expo-document-picker';

export default function EditProfileScreen() {
  const router = useRouter();
  const [avatar, setAvatar] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [kycDocument, setKycDocument] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useLocalSearchParams<{ user: string }>();
  const parsedUser = user ? JSON.parse(user) as Handyman : null;
  const queryClient = useQueryClient();
  const BASE_URL = process.env.EXPO_PUBLIC_ASSET_URL;


  React.useEffect(() => {
    if (parsedUser) {
      setFullName(parsedUser.handyman_name || "");
      setEmail(parsedUser.email || "");
      setPhone(parsedUser.contact_number || "");
      setAvatar(`${BASE_URL}${parsedUser.profile_image}` || `https://avatar.iran.liara.run/username?username=${parsedUser.handyman_name}`);
      if (parsedUser?.kyc_document) {
        setKycDocument(`${BASE_URL}${parsedUser.kyc_document}`);
        setIsVerified( String(parsedUser?.is_verified) === "1" || String(parsedUser?.is_verified) === "true");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const { mutate: uploadKyc, status: uploadStatus } = useUploadKycDocument();
  const isUploading = uploadStatus === 'pending';

  const uploadKycDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      // Check file size - limit to 5MB
      if (file.size && file.size > 5 * 1024 * 1024) {
        Alert.alert("File Too Large", "Please select a file smaller than 5MB.");
        return;
      }

      setKycDocument(file.uri);
      setIsSaving(true);

      // Add a timeout to prevent infinite loading
      const uploadTimeout = setTimeout(() => {
        if (uploadStatus === 'pending') {
          setIsSaving(false);
          Alert.alert(
            "Upload Timeout",
            "The upload is taking longer than expected. Please try again with a smaller file or check your connection."
          );
        }
      }, 30000); // 30 second timeout

      uploadKyc(
        { fileUri: file.uri },
        {
          onSuccess: () => {
            clearTimeout(uploadTimeout);
            setIsVerified(true);
            queryClient.invalidateQueries({ queryKey: ["user"] });
            Alert.alert("Success", "Document uploaded successfully");
            setIsSaving(false);
          },
          onError: (error) => {
            clearTimeout(uploadTimeout);
            setIsSaving(false);
            console.error("Upload error:", error);
            Alert.alert(
              "Error",
              error instanceof Error
                ? error.message
                : "Failed to upload document. Please try again with a smaller file or check your connection."
            );
          },
        }
      );
    } catch (error) {
      console.error("Document selection error:", error);
      setIsSaving(false);
      Alert.alert(
        "Error",
        "There was a problem selecting the document. Please try again."
      );
    }
  };

  const { mutate: updateUser } = useUpdateUser();

  const handleSave = () => {
    setIsSaving(true);
    updateUser({
      ...parsedUser,
      handyman_name: fullName,
      email: email,
      contact_number: phone,
    } as Handyman & {
      handyman_name: string;
      email: string;
      contact_number: string;
    }, {
      onSuccess: () => {
        setIsSaving(false);
        queryClient.invalidateQueries({ queryKey: ["user"] });
        Alert.alert("Success", "Profile updated successfully");
        router.back();
      },
      onError: (error) => {
        setIsSaving(false);
        Alert.alert("Error", "Failed to update profile");
      },
    }); 
  };

  const { mutate: uploadProfileImage, status: uploadProfileImageStatus, error: uploadProfileImageError } = useUploadProfileImage();
  const isUploadingProfileImage = uploadProfileImageStatus === 'pending';


  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please grant camera roll permissions to change your profile photo.");
      return;
    }
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Check file size - limit to 5MB
        const fileInfo = await FileSystem.getInfoAsync(result.assets[0].uri);
        if (fileInfo.exists && fileInfo.size > 5 * 1024 * 1024) {
          Alert.alert(
            "File Too Large", 
            "Please select a file smaller than 5MB."
          );
          return;
        }
        
        setIsSaving(true);
        
        // Add a timeout to prevent infinite loading
        const uploadTimeout = setTimeout(() => {
          if (uploadProfileImageStatus === 'pending') {
            setIsSaving(false);
            Alert.alert(
              "Upload Timeout", 
              "The upload is taking longer than expected. Please try again with a smaller file or check your connection."
            );
          }
        }, 30000); // 30 second timeout
        
        uploadProfileImage(
          { fileUri: result.assets[0].uri },
          {
            onSuccess: (response) => {
              clearTimeout(uploadTimeout);
              queryClient.invalidateQueries({ queryKey: ["user"] });
              
              // Check if response has the expected structure
              if (!response?.data?.profile_image) {
                setIsSaving(false);
                Alert.alert("Error", "Invalid response from server. Profile image path not found.");
                return;
              }
              
              const fileUrl = response.data.profile_image;
              
              // Update the UI immediately with the new image
              setAvatar(`${BASE_URL}${fileUrl}`);
              setIsSaving(false);
              
              // Refresh user data
              queryClient.invalidateQueries({ queryKey: ["user"] });
              Alert.alert("Success", "Profile image updated successfully");
            },
            onError: (error) => {
              clearTimeout(uploadTimeout);
              setIsSaving(false);
              
              // Provide more specific error messages
              if (axios.isAxiosError(error) && error.response?.status === 403) {
                Alert.alert(
                  "Permission Error",
                  "You don't have permission to update your profile image. Please contact support."
                );
              } else {
                Alert.alert(
                  "Error",
                  error instanceof Error
                    ? error.message
                    : "Failed to upload image. Please try again."
                );
              }
            },
          }
        );
      }
    } catch (error) {
      console.error("Image selection error:", error);
      setIsSaving(false);
      Alert.alert(
        "Error", 
        "There was a problem selecting the image. Please try again."
      );
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please grant camera permissions to take a profile photo.");
      return;
    }
    
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Check file size - limit to 5MB
        const fileInfo = await FileSystem.getInfoAsync(result.assets[0].uri);
        if (fileInfo.exists && fileInfo.size > 5 * 1024 * 1024) {
          Alert.alert(
            "File Too Large", 
            "Please select a file smaller than 5MB."
          );
          return;
        }
        
        setIsSaving(true);
        
        // Add a timeout to prevent infinite loading
        const uploadTimeout = setTimeout(() => {
          if (uploadProfileImageStatus === 'pending') {
            setIsSaving(false);
            Alert.alert(
              "Upload Timeout", 
              "The upload is taking longer than expected. Please try again with a smaller file or check your connection."
            );
          }
        }, 30000); // 30 second timeout
        
        uploadProfileImage(
          { fileUri: result.assets[0].uri },
          {
            onSuccess: (response) => {
              clearTimeout(uploadTimeout);
              queryClient.invalidateQueries({ queryKey: ["user"] });
              
              // Check if response has the expected structure
              if (!response?.data?.profile_image) {
                setIsSaving(false);
                Alert.alert("Error", "Invalid response from server. Profile image path not found.");
                return;
              }
              
              const fileUrl = response.data.profile_image;
              
              // Update the UI immediately with the new image
              setAvatar(`${BASE_URL}${fileUrl}`);
              setIsSaving(false);
              
              // Refresh user data
              queryClient.invalidateQueries({ queryKey: ["user"] });
              Alert.alert("Success", "Profile image updated successfully");
            },
            onError: (error) => {
              clearTimeout(uploadTimeout);
              setIsSaving(false);
              
              // Provide more specific error messages
              if (axios.isAxiosError(error) && error.response?.status === 403) {
                Alert.alert(
                  "Permission Error",
                  "You don't have permission to update your profile image. Please contact support."
                );
              } else {
                Alert.alert(
                  "Error",
                  error instanceof Error
                    ? error.message
                    : "Failed to upload image. Please try again."
                );
              }
            },
          }
        );
      }
    } catch (error) {
      console.error("Camera error:", error);
      setIsSaving(false);
      Alert.alert(
        "Error", 
        "There was a problem taking the photo. Please try again."
      );
    }
  };

  // const handleChangePassword = () => {
  //   router.push("/profile/change-password");
  // };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Edit Profile" onBack={() => router.back()} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
          
     
        </View>
        
        <View style={styles.kycSection}>
          <Text style={styles.sectionTitle}>Identity Verification</Text>
          <Text style={styles.kycDescription}>
            Upload a government-issued ID to verify your identity and get a verified badge.
            Maximum file size: 5MB.
          </Text>
          
          <Pressable 
            style={[styles.kycButton, isUploading && styles.kycButtonDisabled]} 
            onPress={uploadKycDocument}
            disabled={isUploading}
          >
            {isUploading ? (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="small" color={Colors.light.primary} />
                <Text style={styles.kycButtonText}>Uploading... Please wait</Text>
              </View>
            ) : (
              <>
                <Upload size={20} color={Colors.light.primary} />
                <Text style={styles.kycButtonText}>
                  {kycDocument ? "Change Document" : "Upload Document"}
                </Text>
              </>
            )}
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
                  {isVerified ? "Verified" : isUploading ? "Uploading..." : "Pending Verification"}
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
  kycButtonDisabled: {
    borderColor: Colors.light.gray[400],
    backgroundColor: Colors.light.gray[100],
  },
  uploadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
