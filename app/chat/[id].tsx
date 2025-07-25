import React, { useState, useRef, useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  Pressable, 
  KeyboardAvoidingView, 
  Platform,
  SafeAreaView,
  Modal,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Send, ArrowLeft, Paperclip, Camera, Image as ImageIcon, X } from "lucide-react-native";
import Colors from "@/constants/colors";
import Header from "@/components/Header";
import MessageBubble from "@/components/MessageBubble";
import ChatShimmer from "@/components/ChatShimmer";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useChat } from "@/hooks/use-chat";
import { authClient } from "@/lib/auth-client";
import { useGetPartnerById } from "@/app/api/user/getPartner";
import { sendImage, Message } from "@/lib/chat-client";  
import { useTranslation } from "react-i18next";

export default function ChatConversationScreen() {
  const { id, partnerId, partnerName } = useLocalSearchParams<{ 
    id: string; 
    partnerId?: string; 
    partnerName?: string; 
  }>();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [messageText, setMessageText] = useState("");
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { t } = useTranslation();
  const { data: session } = authClient.useSession();
  
  // Get partner details if partnerId is provided
  const { data: partner } = useGetPartnerById(partnerId || "");
  
  // Use the chat hook with partner information
  const {
    messages,
    isLoading,
    isSending,
    sendChatMessage,
    sendImageMessage,
    loadChatHistory,
  } = useChat({
    otherUserId: partnerId,
    userType: "partner", // Assuming current user is a handyman chatting with partners
  });

  // Load chat history when component mounts
  useEffect(() => {
    if (partnerId) {
      loadChatHistory();
    }
  }, [partnerId, loadChatHistory]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendMessage = async () => {
    if (messageText.trim() && partnerId) {
      try {
        await sendChatMessage(messageText.trim());
        setMessageText("");
      } catch (error) {
        console.error("Failed to send message:", error);
        // Only show error alert, not success alert
        Alert.alert(t("chat.error"), t("chat.failedToSendMessage"));
      }
    }
  };

    const handleSendImage = async (imageUri: string) => {
    if (partnerId) {
      try {
        setIsUploadingImage(true);
        setUploadProgress(0);
        
        // For React Native, we need to handle the image URI differently
        let file: File;
        
        if (Platform.OS === 'web') {
          // Web platform - use fetch and blob
          const response = await fetch(imageUri);
          const blob = await response.blob();
          file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
        } else {
          // React Native platform - create file from URI
          const fileName = imageUri.split('/').pop() || 'image.jpg';
          const fileExtension = fileName.split('.').pop() || 'jpg';
          const mimeType = `image/${fileExtension}`;
          
          // Create a file-like object for React Native
          file = {
            uri: imageUri,
            name: fileName,
            type: mimeType,
          } as any;
        }
        
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return prev + 10;
          });
        }, 100);
        
        // Upload image using the new sendImageMessage function
        await sendImageMessage(file, partnerId);
        
        // Complete progress
        setUploadProgress(100);
        clearInterval(progressInterval);
        
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (error) {
        console.error("Failed to send image:", error);
        Alert.alert(t("chat.error"), t("chat.failedToSendImage"));
      } finally {
        setIsUploadingImage(false);
        setUploadProgress(0);
      }
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert(t("chat.permissionRequired"), t("chat.cameraPermissionRequired"));
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Validate file type - only allow images
        if (asset.type && asset.type !== 'image') {
          Alert.alert(t("chat.invalidFileType"), t("chat.onlyImagesAllowed"));
          return;
        }
        
        handleSendImage(asset.uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert(t("chat.error"), t("chat.failedToTakePhoto"));
    } finally {
      setShowMediaOptions(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert(t("chat.permissionRequired"), t("chat.galleryPermissionRequired"));
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: false,
        allowsEditing: true,
        aspect: [4, 3],
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Validate file type - only allow images
        if (asset.type && asset.type !== 'image') {
          Alert.alert(t("chat.invalidFileType"), t("chat.onlyImagesAllowed"));
          return;
        }
        
        // Additional validation for file extension
        const fileName = asset.fileName || asset.uri.split('/').pop() || '';
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
        
        if (!allowedExtensions.includes(fileExtension)) {
          Alert.alert(t("chat.invalidFileType"), t("chat.onlyImagesAllowed"));
          return;
        }
        
        handleSendImage(asset.uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert(t("chat.error"), t("chat.failedToSelectImage"));
    } finally {
      setShowMediaOptions(false);
    }
  };

  interface extendMessage extends Message {
    messageType?: string;
    imageUrl?: string;
  }
  

  const displayName = partnerName || partner?.partner_name || "Partner";

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title={t("chat.chat")} onBack={() => router.back()} />
        <View style={styles.messagesContainer}>
          <ChatShimmer count={8} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <Header title={displayName} onBack={() => router.back()} />
        
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t("chat.noMessages")}</Text>
              <Text style={styles.emptySubtext}>{t("chat.startConversation", { displayName })}</Text>
            </View>
                    ) : (
            messages.map((message) => {
              const extendedMessage = message as extendMessage;
              const isImage = extendedMessage.messageType === 'image';
              
              return (
                <MessageBubble 
                  key={message.id} 
                  message={{
                    id: message.id,
                    content: isImage ? extendedMessage.imageUrl || '' : message.message,
                    type: isImage ? "image" : "text",
                    timestamp: message.createdAt,
                    isFromMe: message.senderId === session?.user.id,
                    status: "read",
                    senderName: message.senderId === session?.user.id ? "You" : displayName,
                    senderId: message.senderId,
                  }} 
                />
              );
            })
          )}
        </ScrollView> 
        
        <View style={styles.inputContainer}>
          <Pressable 
            style={styles.attachButton} 
            onPress={() => setShowMediaOptions(true)}
            disabled={isUploadingImage}
          >
            <Paperclip size={20} color={isUploadingImage ? Colors.light.gray[300] : Colors.light.gray[500]} />
          </Pressable>
          
          <TextInput
            style={styles.textInput}
            placeholder={isUploadingImage ? t("chat.uploadingImage") : t("chat.typeMessage")}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
            placeholderTextColor={Colors.light.gray[500]}
            editable={!isUploadingImage}
          />
          
          <Pressable
            style={[
              styles.sendButton,
              messageText.trim() && !isSending && !isUploadingImage ? styles.sendButtonActive : styles.sendButtonInactive,
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || isSending || isUploadingImage}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Send
                size={20}
                color={messageText.trim() && !isUploadingImage ? "white" : Colors.light.gray[400]}
              />
            )}
          </Pressable>
        </View>
        
        {/* Upload Progress Indicator */}
        {isUploadingImage && (
          <View style={styles.uploadProgressContainer}>
            <View style={styles.uploadProgressBar}>
              <View 
                style={[
                  styles.uploadProgressFill, 
                  { width: `${uploadProgress}%` }
                ]} 
              />
            </View>
            <Text style={styles.uploadProgressText}>
              {t("chat.uploadingImage")} {uploadProgress}%
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Media Options Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showMediaOptions}
        onRequestClose={() => setShowMediaOptions(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowMediaOptions(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("chat.shareMedia")}</Text>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setShowMediaOptions(false)}
              >
                <X size={20} color={Colors.light.gray[600]} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.mediaOptions}>
              <TouchableOpacity 
                style={styles.mediaOption} 
                onPress={handleTakePhoto}
              >
                <View style={[styles.mediaIconContainer, { backgroundColor: Colors.light.primary }]}>
                  <Camera size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.mediaOptionText}>{t("chat.camera")}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.mediaOption} 
                onPress={handlePickImage}
              >
                <View style={[styles.mediaIconContainer, { backgroundColor: Colors.light.secondary }]}>
                  <ImageIcon size={24} color="#FFFFFF" />
                </View>
                  <Text style={styles.mediaOptionText}>{t("chat.gallery")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.light.gray[600],
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.gray[600],
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
    color: Colors.light.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  sendButtonInactive: {
    backgroundColor: Colors.light.gray[200],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    width: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  closeButton: {
    padding: 8,
  },
  mediaOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  mediaOption: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  mediaIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  mediaOptionText: {
    fontSize: 14,
    color: Colors.light.text,
    textAlign: "center",
  },
  uploadProgressContainer: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  uploadProgressBar: {
    height: 4,
    backgroundColor: Colors.light.gray[200],
    borderRadius: 2,
    marginBottom: 4,
  },
  uploadProgressFill: {
    height: "100%",
    backgroundColor: Colors.light.primary,
    borderRadius: 2,
  },
  uploadProgressText: {
    fontSize: 12,
    color: Colors.light.gray[600],
    textAlign: "center",
  },
});
