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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Send, ArrowLeft, Paperclip, Camera, Image as ImageIcon, X } from "lucide-react-native";
import { useChatStore } from "@/store/chat-store";
import MessageBubble from "@/components/MessageBubble";
import Colors from "@/constants/colors";
import Header from "@/components/Header";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";

export default function ChatConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [messageText, setMessageText] = useState("");
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  
  const {
    getCurrentConversation,
    getConversationMessages,
    setCurrentConversationId,
    sendMessage,
    markConversationAsRead,
  } = useChatStore();
  
  // Set current conversation ID when screen loads
  useEffect(() => {
    if (id) {
      setCurrentConversationId(id);
      markConversationAsRead(id);
    }
    return () => setCurrentConversationId(null);
  }, [id, setCurrentConversationId, markConversationAsRead]);
  
  const conversation = getCurrentConversation();
  const messages = conversation ? getConversationMessages(conversation.id) : [];
  
  if (!conversation) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Chat" onBack={() => router.back()} />
        <View style={styles.container}>
          <Text>Conversation not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSendMessage = () => {
    if (messageText.trim() && conversation) {
      sendMessage(conversation.id, messageText.trim(), "text");
      setMessageText("");
      
      // Scroll to bottom after sending message
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleSendImage = (imageUri: string, type: "image") => {
    if (conversation) {
      sendMessage(conversation.id, imageUri, type);
      
      // Scroll to bottom after sending message
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
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
        handleSendImage(result.assets[0].uri, "image");
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
        handleSendImage(result.assets[0].uri, "image");
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

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <Header title={conversation.title} onBack={() => router.back()} />
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={scrollToBottom}
        >
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
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
              messageText.trim() ? styles.sendButtonActive : styles.sendButtonInactive,
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim()}
          >
            <Send
              size={20}
              color={messageText.trim() ? "white" : Colors.light.gray[400]}
            />
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
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
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
