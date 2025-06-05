import React, { useState } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  SafeAreaView, 
  Pressable, 
  Modal,
  TouchableOpacity,
  Alert
} from "react-native";
import { useRouter } from "expo-router";
import { useChatStore } from "@/store/chat-store";
import ConversationItem from "@/components/ConversationItem";
import Colors from "@/constants/colors";
import { Plus, Camera, Image as ImageIcon, X } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export default function ChatScreen() {
  const router = useRouter();
  const conversations = useChatStore((state) => state.conversations);
  const totalUnreadCount = useChatStore((state) => state.getTotalUnreadCount());
  const [showMediaOptions, setShowMediaOptions] = useState(false);

  const handleNewChat = () => {
    // In a real app, this would open a contact picker or new chat screen
    Alert.alert("New Chat", "This would open a new chat screen in a real app.");
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
        // In a real app, you would upload this image to your server
        // For now, we'll just show an alert
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        Alert.alert("Success", "Photo captured! In a real app, you would select a contact to send this to.");
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
        // In a real app, you would upload this image to your server
        // For now, we'll just show an alert
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        Alert.alert("Success", "Photo selected! In a real app, you would select a contact to send this to.");
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image");
    } finally {
      setShowMediaOptions(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Messages</Text>
          <View style={styles.headerRight}>
            {totalUnreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                </Text>
              </View>
            )}
            <Pressable 
              style={styles.newChatButton} 
              onPress={() => setShowMediaOptions(true)}
            >
              <Plus size={24} color={Colors.light.primary} />
            </Pressable>
          </View>
        </View>
        
        <ScrollView style={styles.conversationsList} showsVerticalScrollIndicator={false}>
          {conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
            />
          ))}
        </ScrollView>

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
                
                <TouchableOpacity 
                  style={styles.mediaOption} 
                  onPress={handleNewChat}
                >
                  <View style={[styles.mediaIconContainer, { backgroundColor: Colors.light.success }]}>
                    <Plus size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.mediaOptionText}>New Chat</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.text,
  },
  unreadBadge: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginRight: 12,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  newChatButton: {
    padding: 4,
  },
  conversationsList: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
  },
  closeButton: {
    padding: 4,
  },
  mediaOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  mediaOption: {
    alignItems: "center",
    width: 80,
  },
  mediaIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  mediaOptionText: {
    fontSize: 14,
    color: Colors.light.text,
  },
});
