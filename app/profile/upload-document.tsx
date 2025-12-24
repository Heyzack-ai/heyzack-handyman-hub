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
  Platform,
  StatusBar,
} from "react-native";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Camera, Upload, Check, FileText } from "lucide-react-native";
import Colors from "@/constants/colors";
import Header from "@/components/Header";
import { Handyman } from "@/types/handyman";
import { useUpdateUser } from "@/app/api/user/getUser";
import { useQueryClient } from "@tanstack/react-query";
import { useUploadKycDocument } from "@/app/api/user/addDocument";
import { useUploadProfileImage } from "@/app/api/user/addProfileImage";
import axios from "axios";
import * as DocumentPicker from "expo-document-picker";
import { t } from "i18next";
import * as Linking from "expo-linking";

export default function UploadDocumentScreen() {
  const router = useRouter();

  const [kycDocument, setKycDocument] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useLocalSearchParams<{ user: string }>();

  const [documentType, setDocumentType] = useState<"image" | "pdf" | null>(
    null
  );
  const queryClient = useQueryClient();



  const { mutate: uploadKyc, status: uploadStatus } = useUploadKycDocument();
  const isUploading = uploadStatus === "pending";

  const uploadKycDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const file = result.assets[0];

      const isPdf =
        file.mimeType === "application/pdf" ||
        file.name?.toLowerCase().endsWith(".pdf");
      setDocumentType(isPdf ? "pdf" : "image");

      // Check file size - limit to 5MB
      if (file.size && file.size > 5 * 1024 * 1024) {
        Alert.alert(
          t("editProfile.fileTooLarge"),
          t("editProfile.pleaseSelectSmallerFile")
        );
        return;
      }

      setKycDocument(file.uri);
      setIsSaving(true);

      // Add a timeout to prevent infinite loading
      const uploadTimeout = setTimeout(() => {
        if (uploadStatus === "pending") {
          setIsSaving(false);
          Alert.alert(
            t("editProfile.uploadTimeout"),
            t("editProfile.uploadTimeoutDescription")
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
            Alert.alert(
              t("editProfile.success"),
              t("editProfile.documentUploadedSuccessfully")
            );
            setIsSaving(false);
            // Use replace to go back to home and prevent navigation loops
            router.back();
          },
          onError: (error: any) => {
            clearTimeout(uploadTimeout);
            setIsSaving(false);
            console.log("Upload error:", error?.response.data);
            Alert.alert(
              t("editProfile.error"),
              error instanceof Error
                ? error.message
                : t("editProfile.failedToUploadDocument")
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


  const {
    mutate: uploadProfileImage,
    status: uploadProfileImageStatus,
    error: uploadProfileImageError,
  } = useUploadProfileImage();

  

  // const handleChangePassword = () => {
  //   router.push("/profile/change-password");
  // };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={'Upload Document'}
        onBack={() => router.back()}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.kycSection}>
          <Text style={styles.sectionTitle}>
            {t("editProfile.identityVerification")}
          </Text>
          <Text style={styles.kycDescription}>
            {t("editProfile.kycDescription")} Maximum file size: 5MB.
          </Text>
        </View>

        <Pressable
          style={[styles.kycButton, isUploading && styles.kycButtonDisabled]}
          onPress={uploadKycDocument}
          disabled={isUploading}
        >
          {isUploading ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="small" color={Colors.light.primary} />
              <Text style={styles.kycButtonText}>
                {t("editProfile.uploadingPleaseWait")}
              </Text>
            </View>
          ) : (
            <>
              <Upload size={20} color={Colors.light.primary} />
              <Text style={styles.kycButtonText}>
                {kycDocument
                  ? t("editProfile.changeDocument")
                  : t("editProfile.uploadDocument")}
              </Text>
            </>
          )}
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
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
  pdfPreview: {
    width: "100%",
    height: 150,
    // backgroundColor: Colors.light.gray[100],
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  pdfText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginTop: 8,
  },
  pdfSubtext: {
    fontSize: 12,
    color: Colors.light.gray[600],
    maxWidth: "80%",
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
    padding: 16,
  },
  documentImage: {
    width: "100%",
    height: 150,
    backgroundColor: Colors.light.gray[200],
  },
  documentStatus: {
    padding: 8,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    marginTop: 16,
    borderRadius: 8,
  },
  viewDocumentButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  viewDocumentText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  documentStatusText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.white,
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
    marginTop: 16,
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
