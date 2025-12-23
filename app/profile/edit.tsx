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
  const parsedUser = user ? (JSON.parse(user) as Handyman) : null;
  const [documentType, setDocumentType] = useState<"image" | "pdf" | null>(
    null
  );
  const queryClient = useQueryClient();
  const BASE_URL = process.env.EXPO_PUBLIC_ASSET_URL;

  React.useEffect(() => {
    if (parsedUser) {
      setFullName(parsedUser.name || "");
      setEmail(parsedUser.email || "");
      setPhone(parsedUser.phone || "");
      const url = `https://ui-avatars.com/api/?name=${parsedUser?.name?.replace(/ /g, "+")}&background=random&color=fff`;
      setAvatar(
        parsedUser?.profile_image
          ? `${parsedUser.profile_image}`
          : url
      );
      if (parsedUser?.kyc_document) {
        const docUrl = `${parsedUser.kyc_document}`;

        setKycDocument(docUrl);

        // Detect if it's a PDF based on URL
        const isPdf = docUrl.toLowerCase().endsWith(".pdf");
        setDocumentType(isPdf ? "pdf" : "image");

        setIsVerified(
          String(parsedUser?.is_verified) === "1" ||
            String(parsedUser?.is_verified) === "true"
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const openDocument = async () => {
    if (!kycDocument) return;

    try {
      // Check if it's a remote URL or local file
      const isRemoteUrl =
        kycDocument.startsWith("http://") || kycDocument.startsWith("https://");

      if (isRemoteUrl) {
        // Open remote URL in browser/viewer
        const supported = await Linking.canOpenURL(kycDocument);
        if (supported) {
          await Linking.openURL(kycDocument);
        } else {
          Alert.alert(t("editProfile.error"), "Cannot open this document");
        }
      } else {
        // For local files (newly picked but not yet uploaded)
        Alert.alert(
          t("editProfile.info"),
          "Document preview will be available after saving"
        );
      }
    } catch (error) {
      console.error("Error opening document:", error);
      Alert.alert(t("editProfile.error"), "Failed to open document");
    }
  };

  const { mutate: updateUser } = useUpdateUser();

  const handleSave = () => {
    setIsSaving(true);
    updateUser(
      {
        ...parsedUser,
        name: fullName,
        email: email,
        phone: phone,
      } as Handyman & {
        name: string;
        email: string;
        phone: string;
      },
      {
        onSuccess: () => {
          setIsSaving(false);
          queryClient.invalidateQueries({ queryKey: ["user"] });
          Alert.alert(
            t("editProfile.success"),
            t("editProfile.profileUpdatedSuccessfully")
          );
          router.back();
        },
        onError: (error) => {
          setIsSaving(false);
          Alert.alert(
            t("editProfile.error"),
            t("editProfile.failedToUpdateProfile")
          );
        },
      }
    );
  };

  const {
    mutate: uploadProfileImage,
    status: uploadProfileImageStatus,
    error: uploadProfileImageError,
  } = useUploadProfileImage();
  const isUploadingProfileImage = uploadProfileImageStatus === "pending";

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        t("editProfile.permissionRequired"),
        t("editProfile.grantCameraRollPermissions")
      );
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
            t("editProfile.fileTooLarge"),
            t("editProfile.pleaseSelectSmallerFile")
          );
          return;
        }

        setIsSaving(true);

        // Add a timeout to prevent infinite loading
        const uploadTimeout = setTimeout(() => {
          if (uploadProfileImageStatus === "pending") {
            setIsSaving(false);
            Alert.alert(
              t("editProfile.uploadTimeout"),
              t("editProfile.uploadTimeoutDescription")
            );
          }
        }, 50000); // 50 second timeout (slightly longer than API timeout)

        uploadProfileImage(
          { fileUri: result.assets[0].uri },
          {
            onSuccess: (response) => {
              clearTimeout(uploadTimeout);
              queryClient.invalidateQueries({ queryKey: ["user"] });

              console.log("Camera upload success response:", response);
              console.log(
                "Camera upload success response.data:",
                response?.data
              );

              // Check if response has the expected structure
              if (!response?.data?.image_url) {
                console.error("Invalid response structure:", response);
                setIsSaving(false);
                Alert.alert(
                  t("editProfile.error"),
                  t("editProfile.invalidResponseFromServer")
                );
                return;
              }

              const fileUrl = response.data.image_url;

              // Update the UI immediately with the new image
              // The response already contains the full URL, no need to prepend BASE_URL
              setAvatar(fileUrl);
              setIsSaving(false);

              // Refresh user data
              queryClient.invalidateQueries({ queryKey: ["user"] });
              Alert.alert(
                t("editProfile.success"),
                t("editProfile.profilePhotoUpdatedSuccessfully")
              );
            },
            onError: (error) => {
              clearTimeout(uploadTimeout);
              setIsSaving(false);

              // Provide more specific error messages
              if (axios.isAxiosError(error) && error.response?.status === 403) {
                Alert.alert(
                  t("editProfile.permissionError"),
                  t("editProfile.contactSupportForPermission")
                );
              } else {
                Alert.alert(
                  t("editProfile.error"),
                  error instanceof Error
                    ? error.message
                    : t("editProfile.failedToUploadImage")
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
        t("editProfile.error"),
        t("editProfile.imageSelectionProblem")
      );
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        t("editProfile.permissionRequired"),
        t("editProfile.grantCameraPermissions")
      );
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
            t("editProfile.fileTooLarge"),
            t("editProfile.pleaseSelectSmallerFile")
          );
          return;
        }

        setIsSaving(true);

        // Add a timeout to prevent infinite loading
        const uploadTimeout = setTimeout(() => {
          if (uploadProfileImageStatus === "pending") {
            setIsSaving(false);
            Alert.alert(
              t("editProfile.uploadTimeout"),
              t("editProfile.uploadTimeoutDescription")
            );
          }
        }, 30000); // 30 second timeout

        uploadProfileImage(
          { fileUri: result.assets[0].uri },
          {
            onSuccess: (response) => {
              clearTimeout(uploadTimeout);
              queryClient.invalidateQueries({ queryKey: ["user"] });

              console.log("Upload success response:", response);
              console.log("Upload success response.data:", response?.data);

              // Check if response has the expected structure
              if (!response?.data?.image_url) {
                console.error("Invalid response structure:", response);
                setIsSaving(false);
                Alert.alert(
                  t("editProfile.error"),
                  t("editProfile.invalidResponseFromServer")
                );
                return;
              }

              const fileUrl = response.data.image_url;

              // Update the UI immediately with the new image
              // The response already contains the full URL, no need to prepend BASE_URL
              setAvatar(fileUrl);
              setIsSaving(false);

              // Refresh user data
              queryClient.invalidateQueries({ queryKey: ["user"] });
              Alert.alert(
                t("editProfile.success"),
                t("editProfile.profilePhotoUpdatedSuccessfully")
              );
            },
            onError: (error) => {
              clearTimeout(uploadTimeout);
              setIsSaving(false);

              // Provide more specific error messages
              if (axios.isAxiosError(error) && error.response?.status === 403) {
                Alert.alert(
                  t("editProfile.permissionError"),
                  t("editProfile.contactSupportForPermission")
                );
              } else {
                Alert.alert(
                  "Error",
                  error instanceof Error
                    ? error.message
                    : t("editProfile.failedToUploadImage")
                );
              }
            },
          }
        );
      }
    } catch (error) {
      console.error("Camera error:", error);
      setIsSaving(false);
      Alert.alert(t("editProfile.error"), t("editProfile.photoTakingProblem"));
    }
  };

  // const handleChangePassword = () => {
  //   router.push("/profile/change-password");
  // };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={t("editProfile.editProfile")}
        onBack={() => router.back()}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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
              <Text style={styles.photoButtonText}>
                {t("editProfile.camera")}
              </Text>
            </Pressable>

            <Pressable style={styles.photoButton} onPress={pickImage}>
              <Upload size={20} color={Colors.light.primary} />
              <Text style={styles.photoButtonText}>
                {t("editProfile.gallery")}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("editProfile.fullName")}</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder={t("editProfile.fullNamePlaceholder")}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("editProfile.email")}</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder={t("editProfile.emailPlaceholder")}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("editProfile.phoneNumber")}</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder={t("editProfile.phoneNumberPlaceholder")}
              keyboardType="phone-pad"
            />
          </View>
        </View>

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

        {/* {kycDocument && (
            <View style={styles.documentPreview}>
              <Image
                source={{ uri: kycDocument }}
                style={styles.documentImage}
                contentFit="cover"
              />
              <View style={styles.documentStatus}>
                <Text style={styles.documentStatusText}>
                  {isVerified
                    ? t("editProfile.verified")
                    : isUploading
                    ? t("editProfile.uploading...")
                    : t("editProfile.pendingVerification")}
                </Text>
              </View>
            </View>
          )}
        </View> */}

        {kycDocument && (
          <View style={styles.documentPreview}>
            {documentType === "pdf" ? (
              <View style={styles.pdfPreview}>
                <FileText size={48} color={Colors.light.primary} />
                <Text style={styles.pdfText}>PDF Document</Text>
                <Text style={styles.pdfSubtext} numberOfLines={1}>
                  {kycDocument.split("/").pop()}
                </Text>
              </View>
            ) : (
              <Image
                source={{ uri: kycDocument }}
                style={styles.documentImage}
                contentFit="cover"
              />
            )}

            {/* View Document Button */}
            <Pressable style={styles.viewDocumentButton} onPress={openDocument}>
              <Text style={styles.viewDocumentText}>
                {t("editProfile.viewDocument")}
              </Text>
            </Pressable>

            <View style={styles.documentStatus}>
              <Text style={styles.documentStatusText}>
                {isVerified
                  ? t("editProfile.verified")
                  : isUploading
                  ? t("editProfile.uploading...")
                  : t("editProfile.pendingVerification")}
              </Text>
            </View>
          </View>
        )}

        <Pressable
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving
              ? t("editProfile.saving...")
              : t("editProfile.saveChanges")}
          </Text>
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
