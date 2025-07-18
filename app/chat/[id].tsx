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
  
  const { data: session } = authClient.useSession();
  
  // Get partner details if partnerId is provided
  const { data: partner } = useGetPartnerById(partnerId || "");
  
  // Use the chat hook with partner information
  const {
    messages,
    isLoading,
    isSending,
    sendChatMessage,
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
        Alert.alert("Error", "Failed to send message. Please try again.");
      }
    }
  };

  const handleSendImage = async (imageUri: string) => {
    if (partnerId) {
      try {
        // For now, we'll send the image URI as text
        // In a real app, you'd upload the image first and send the URL
        await sendChatMessage(`[Image: ${imageUri}]`);
      } catch (error) {
        console.error("Failed to send image:", error);
        Alert.alert("Error", "Failed to send image. Please try again.");
      }
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert("Permission Required", "Camera permission is needed to take photos");
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        handleSendImage(result.assets[0].uri);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
    } finally {
      setShowMediaOptions(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert("Permission Required", "Gallery permission is needed to select photos");
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: false,
        allowsEditing: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        handleSendImage(result.assets[0].uri);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image");
    } finally {
      setShowMediaOptions(false);
    }
  };

  const displayName = partnerName || partner?.partner_name || "Partner";

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Chat" onBack={() => router.back()} />
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
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start the conversation with {displayName}</Text>
            </View>
          ) : (
            messages.map((message) => (
              <MessageBubble 
                key={message.id} 
                message={{
                  id: message.id,
                  content: message.message,
                  type: "text",
                  timestamp: message.createdAt,
                  isFromMe: message.senderId === session?.user.id,
                  status: "read",
                  senderName: message.senderId === session?.user.id ? "You" : displayName,
                  senderId: message.senderId,
                }} 
              />
            ))
          )}
        </ScrollView> 
        
        <View style={styles.inputContainer}>
          <Pressable 
            style={styles.attachButton} 
            onPress={() => setShowMediaOptions(true)}
          >
            <Paperclip size={20} color={Colors.light.gray[500]} />
          </Pressable>
          
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
            placeholderTextColor={Colors.light.gray[500]}
          />
          
          <Pressable
            style={[
              styles.sendButton,
              messageText.trim() && !isSending ? styles.sendButtonActive : styles.sendButtonInactive,
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Send
                size={20}
                color={messageText.trim() ? "white" : Colors.light.gray[400]}
              />
            )}
          </Pressable>
        </View>
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
              <Text style={styles.modalTitle}>Share Media</Text>
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
                <Text style={styles.mediaOptionText}>Camera</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.mediaOption} 
                onPress={handlePickImage}
              >
                <View style={[styles.mediaIconContainer, { backgroundColor: Colors.light.secondary }]}>
                  <ImageIcon size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.mediaOptionText}>Gallery</Text>
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
});
