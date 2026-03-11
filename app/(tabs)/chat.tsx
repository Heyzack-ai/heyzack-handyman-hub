import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  Pressable,
  Modal,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import ChatListShimmer from "@/components/ChatListShimmer";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useChatStore } from "@/store/chat-store";
import ConversationItem from "@/components/ConversationItem";
import Colors from "@/constants/colors";
import { Plus, Camera, Image as ImageIcon, X, Users, Image } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useGetPartner } from "@/app/api/user/getPartner";
import { getAssignedPartners } from "@/lib/partner-client";
import { useChat } from "@/hooks/use-chat";
import { getChatRooms, getUnreadCount, getUnreadCountDetailed, getChatConnections, getChatHistory, type ChatConnection, type UnreadByRoom } from "@/lib/chat-client";
import { authClient } from "@/lib/auth-client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "@/src/i18n/useTranslations";

export default function ChatScreen() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();
  const [showPartnerList, setShowPartnerList] = useState(false);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const { t } = useTranslations();
  // Get current user's partner data - this IS the assigned partner
  const { data: currentPartner, isLoading: currentPartnerLoading } = useGetPartner("None");

  console.log("Current Partner:", currentPartner);
  // console.log("Session:", session);

  // Get chat data for the current partner
  const { messages: partnerMessages, loadChatHistory } = useChat({
    otherUserId: currentPartner?.id,
    userType: "partner",
  });

  // Get chat rooms to get unread counts
  const { data: chatRooms, isLoading: chatRoomsLoading } = useQuery({
    queryKey: ["chat-rooms"],
    queryFn: getChatRooms,
    enabled: !!session?.user.id,
  });


  // Get total unread count
  const { data: totalUnreadCount, isLoading: unreadCountLoading } = useQuery({
    queryKey: ["unread-count"],
    queryFn: getUnreadCount,
    enabled: !!session?.user.id,
  });

  // Get detailed unread counts per room
  const { data: unreadByRoomData } = useQuery({
    queryKey: ["unread-count-detailed"],
    queryFn: getUnreadCountDetailed,
    enabled: !!session?.user.id,
  });

  // Create a map of userId to unread count for quick lookup
  const unreadCountMap = React.useMemo(() => {
    const map = new Map<string, number>();
    unreadByRoomData?.byRoom.forEach((room: UnreadByRoom) => {
      map.set(room.otherUserId, room.unreadCount);
    });
    return map;
  }, [unreadByRoomData]);

  // Load chat history when current partner is available
  useEffect(() => {
    if (currentPartner?.name) {
      loadChatHistory();
    }
  }, [currentPartner?.name, loadChatHistory]);

  // Refresh chat history when screen comes into focus (e.g., returning from individual chat)
  useFocusEffect(
    React.useCallback(() => {
      if (currentPartner?.name) {
        loadChatHistory();
      }
      // Refetch chat-related queries to get fresh unread counts
      queryClient.refetchQueries({ queryKey: ["chat-rooms"] });
      queryClient.refetchQueries({ queryKey: ["unread-count"] });
      queryClient.refetchQueries({ queryKey: ["unread-count-detailed"] });
    }, [currentPartner?.name, loadChatHistory, queryClient])
  );

  // Get unassigned partners for new chat creation
  const { data: unassignedPartners, isLoading: unassignedLoading } = useQuery({
    queryKey: ["unassigned-partners"],
    queryFn: () => getAssignedPartners("None"),
    enabled: !!session?.user.id,
  });

  // Get chat connections (partners, handymen, admin)
  const { data: chatConnections, isLoading: connectionsLoading, error: connectionsError } = useQuery({
    queryKey: ["chat-connections"],
    queryFn: getChatConnections,
    enabled: !!session?.user.id,
    retry: 1,
  });

  console.log("Chat Connections Query State:", {
    data: chatConnections,
    isLoading: connectionsLoading,
    error: connectionsError,
  });

  if (connectionsError) {
    console.error("Error fetching chat connections:", connectionsError);
  }

  console.log("Chat Connections:", chatConnections);

  // Extract admin from connections API response or use hardcoded fallback
  const adminConnection = useMemo(() => {
    // First, try to find admin in connections from API response
    const admin = chatConnections?.connections?.find(
      (conn: ChatConnection) => {
        const idLower = conn.id?.toLowerCase() || "";
        const nameLower = conn.name?.toLowerCase() || "";
        const emailLower = conn.email?.toLowerCase() || "";

        return (
          idLower.includes("admin") ||
          nameLower.includes("admin") ||
          emailLower.includes("admin") ||
          emailLower === "admin@heyzack.ai" ||
          emailLower === "admin@heyzack.com" ||
          /^admin[_-]/.test(conn.id || "")
        );
      }
    );

    // If found in API response, use it
    if (admin) {
      return admin;
    }

    // Check chat rooms for admin room (from API response)
    if (chatRooms) {
      const adminRoom = chatRooms.find(room =>
        room.otherUser.type === "admin" ||
        room.roomId.includes("admin") ||
        room.otherUser.name?.toLowerCase().includes("admin") ||
        room.otherUser.email?.toLowerCase().includes("admin")
      );

      if (adminRoom) {
        return {
          id: adminRoom.otherUser.id,
          name: adminRoom.otherUser.name || t("chat.heyzackAdmin"),
          email: adminRoom.otherUser.email || "admin@heyzack.ai",
          image: null,
        };
      }
    }

    // Hardcoded fallback - admin_heyzack
    // This ensures admin chat is always available even if not in API response
    return {
      id: "admin_heyzack",
      name: t("chat.heyzackAdmin"),
      email: "admin@heyzack.ai",
      image: null,
    };
  }, [chatConnections, chatRooms]);

  console.log("Admin Connection Found:", adminConnection);

  // Check if admin room exists in chatRooms
  const adminRoomExists = useMemo(() => {
    if (!chatRooms || !adminConnection) return false;
    return chatRooms.some(room =>
      room.otherUser.type === "admin" ||
      room.otherUser.id === adminConnection.id ||
      (room.roomId && room.roomId.toLowerCase().includes("admin"))
    );
  }, [chatRooms, adminConnection]);

  // Fetch admin chat history to get the last message when chatRooms doesn't include admin room
  // Pass "admin" as recipientType since we're chatting with an admin
  const { data: adminChatHistory } = useQuery({
    queryKey: ["admin-chat-history", adminConnection?.id],
    queryFn: () => adminConnection ? getChatHistory(adminConnection.id, "admin", 1, 50) : Promise.resolve(null), // recipientType is "admin" since we're chatting with admin
    enabled: !!adminConnection?.id && !adminRoomExists, // Only fetch if admin exists and room not found in chatRooms
    retry: 1,
  });

  const handleNewChat = () => {
    setShowPartnerList(true);
  };

  const handlePartnerSelect = (partner: any) => {
    // Generate chat room ID and navigate to chat
    const roomId = `chat_${session?.user.id}_${partner.id || partner.name}`;
    router.push(`/chat/${roomId}?partnerId=${partner.id || partner.name}&partnerName=${partner.name || partner.partner_name}`);
    setShowPartnerList(false);
  };

  const handlePartnerClick = (partner: any) => {
    // Navigate directly to chat with this partner
    const roomId = `chat_${session?.user.id}_${partner.id || partner.name}`;
    router.push(`/chat/${roomId}?partnerId=${partner.id || partner.name}&partnerName=${partner.name || partner.partner_name}`);
  };

  const handleAdminClick = () => {
    if (adminConnection) {
      const roomId = `chat_${session?.user.id}_${adminConnection.id}`;
      router.push(`/chat/${roomId}?adminId=${adminConnection.id}&adminName=${adminConnection.name || t("chat.heyzackAdmin")}`);
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
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        Alert.alert(t("chat.success"), t("chat.photoCaptured"));
      }
    } catch (error) {
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
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        Alert.alert(t("chat.success"), t("chat.photoSelected"));
      }
    } catch (error) {
      Alert.alert(t("chat.error"), t("chat.failedToSelectImage"));
    } finally {
      setShowMediaOptions(false);
    }
  };

  const renderPartnerItem = (partner: any) => (
    <TouchableOpacity
      key={partner.id || partner.name}
      style={styles.partnerItem}
      onPress={() => handlePartnerSelect(partner)}
    >
      <View style={styles.partnerAvatar}>
        <Text style={styles.partnerInitial}>
          {partner.name?.charAt(0) || partner.partner_name?.charAt(0) || "P"}
        </Text>
      </View>
      <View style={styles.partnerInfo}>
        <Text style={styles.partnerName}>{partner.name || partner.partner_name || "Unknown Partner"}</Text>
        <Text style={styles.latestMessage}>{t("chat.startChat")}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderAssignedPartnerItem = (partner: any) => {
    // Get the latest message from the chat
    const latestMessage = partnerMessages.length > 0
      ? partnerMessages[partnerMessages.length - 1]
      : null;

    // Check if the latest message is an image
    const isImageMessage = latestMessage && (latestMessage as any).messageType === 'image';

    // Get unread count from the detailed API response (most accurate)
    const partnerIdentifier = partner.id || partner.name;
    const unreadCountFromApi = unreadCountMap.get(partnerIdentifier) || unreadCountMap.get(partner.id || "");
    
    // Fallback to chat rooms data if API doesn't have it
    const partnerChatRoom = chatRooms?.find(room =>
      room.otherUser.id === partnerIdentifier ||
      room.otherUser.id === partner.id ||
      room.roomId?.includes(partnerIdentifier) ||
      room.roomId?.includes(partner.id || "")
    );

    const unreadCount = unreadCountFromApi ?? partnerChatRoom?.unreadCount ?? 0;

    return (
      <TouchableOpacity
        key={partner.id || partner.name}
        style={styles.partnerItem}
        onPress={() => handlePartnerClick(partner)}
      >
        <View style={styles.partnerAvatar}>
          <Text style={styles.partnerInitial}>
            {partner.name?.charAt(0) || partner.partner_name?.charAt(0) || "P"}
          </Text>
        </View>
        <View style={styles.partnerInfo}>
          <Text style={styles.partnerName}>{partner.name || t("chat.unknownPartner")}</Text>
          <View style={styles.latestMessageContainer}>
            {isImageMessage ? (
              <View style={styles.imageMessageContainer}>
                <Image size={16} color={Colors.light.gray[500]} />
                <Text style={styles.imageMessageText}>{t("chat.photo")}</Text>
              </View>
            ) : (
              <Text style={styles.latestMessage} numberOfLines={1} ellipsizeMode="tail">
                {latestMessage ? latestMessage.message : t("chat.noMessages")}
              </Text>
            )}
          </View>
        </View>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>
              {unreadCount > 99 ? "99+" : unreadCount.toString()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Show loading while fetching current partner data
  if (currentPartnerLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{t("chat.chat")}</Text>
          </View>
          <ChatListShimmer />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t("chat.chat")}</Text>
          <View style={styles.headerRight}>
            {totalUnreadCount !== undefined && totalUnreadCount !== null && totalUnreadCount > 0 && (
              <View style={styles.headerUnreadBadge}>
                <Text style={styles.headerUnreadText}>
                  {totalUnreadCount > 99 ? "99+" : totalUnreadCount.toString()}
                </Text>
              </View>
            )}

          </View>
        </View>

        <ScrollView style={styles.conversationsList} showsVerticalScrollIndicator={false}>
          {/* Admin Chat - only show if admin exists in API response */}
          {(() => {
            // Don't render if no admin connection from API
            if (!adminConnection) return null;

            // Find admin chat room to get unread count and last message
            // Try multiple matching strategies to ensure we find the admin room
            const adminChatRoom = chatRooms?.find(room => {

              // Match by user type first (most reliable)
              if (room.otherUser.type === "admin") return true;

              // Match by room ID containing "admin"
              if (room.roomId && (room.roomId.toLowerCase().includes("admin") || room.roomId.includes("admin_"))) return true;

              // Match by user ID
              if (room.otherUser.id === adminConnection.id) return true;

              // Match by email
              if (room.otherUser.email && (
                room.otherUser.email.toLowerCase().includes("admin") ||
                room.otherUser.email === adminConnection.email
              )) return true;

              // Match by name
              if (room.otherUser.name && room.otherUser.name.toLowerCase().includes("admin")) return true;

              return false;
            });

            console.log("Admin Chat Room Search:", {
              chatRooms: chatRooms?.length,
              adminConnection: adminConnection?.id,
              foundRoom: adminChatRoom ? {
                roomId: adminChatRoom.roomId,
                otherUser: adminChatRoom.otherUser,
                lastMessage: adminChatRoom.lastMessage,
              } : null,
              chatHistoryLastMessage: adminChatHistory?.messages?.[0],
            });

            // Get admin unread count from detailed API (most accurate), fallback to chat rooms
            const adminUnreadCountFromApi = unreadCountMap.get(adminConnection.id);
            const adminUnreadCount = adminUnreadCountFromApi ?? adminChatRoom?.unreadCount ?? 0;
            // Use lastMessage from chatRooms if available, otherwise use the most recent message from chat history
            let adminLastMessage = adminChatRoom?.lastMessage;
            if (!adminLastMessage && adminChatHistory?.messages && adminChatHistory.messages.length > 0) {
              // Messages might be in chronological (oldest first) or reverse chronological (newest first) order
              // Get the message with the most recent createdAt timestamp
              const sortedMessages = [...adminChatHistory.messages].sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
              adminLastMessage = sortedMessages[0]; // Most recent message
            }
            const isAdminImageMessage = adminLastMessage && (adminLastMessage as any).messageType === 'image';

            return (
              <TouchableOpacity
                key="admin-chat"
                style={styles.partnerItem}
                onPress={handleAdminClick}
              >
                <View style={[styles.partnerAvatar, { backgroundColor: Colors.light.secondary }]}>
                  <Text style={styles.partnerInitial}>
                    {adminConnection.name?.charAt(0) || "A"}
                  </Text>
                </View>
                <View style={styles.partnerInfo}>
                  <Text style={styles.partnerName}>
                    {adminConnection.name || t("chat.heyzackAdmin")}
                  </Text>
                  <View style={styles.latestMessageContainer}>
                    {isAdminImageMessage ? (
                      <View style={styles.imageMessageContainer}>
                        <Image size={16} color={Colors.light.gray[500]} />
                        <Text style={styles.imageMessageText}>{t("chat.photo")}</Text>
                      </View>
                    ) : (
                      <Text style={styles.latestMessage} numberOfLines={1} ellipsizeMode="tail">
                        {adminLastMessage?.message || t("chat.noMessages")}
                      </Text>
                    )}
                  </View>
                </View>
                {adminUnreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>
                      {adminUnreadCount > 99 ? "99+" : adminUnreadCount.toString()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })()}

          {/* Partner Chat */}
          {!currentPartner ? (
            <View style={styles.emptyContainer}>
              <Users size={48} color={Colors.light.gray[400]} />
              <Text style={styles.emptyTitle}>{t("chat.noAssignedPartner")}</Text>
              <Text style={styles.emptySubtitle}>{t("chat.noAssignedPartnerText")}</Text>
            </View>
          ) : (
            renderAssignedPartnerItem(currentPartner)
          )}
        </ScrollView>

        {/* Partner List Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showPartnerList}
          onRequestClose={() => setShowPartnerList(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowPartnerList(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t("chat.selectPartner")}</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowPartnerList(false)}
                >
                  <X size={20} color={Colors.light.gray[600]} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.partnerList}>
                {unassignedLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.light.primary} />
                    <Text style={styles.loadingText}>{t("chat.loadingPartners")}</Text>
                  </View>
                ) : !unassignedPartners || unassignedPartners.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>{t("chat.noAvailablePartners")}</Text>
                    <Text style={styles.emptySubtitle}>{t("chat.allPartnersAssigned")}</Text>
                  </View>
                ) : (
                  unassignedPartners.map(renderPartnerItem)
                )}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>

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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
  headerUnreadBadge: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginRight: 12,
  },
  headerUnreadText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.text,
  },
  newChatButton: {
    padding: 4,
  },
  conversationsList: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.light.gray[600],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.gray[600],
    textAlign: "center",
    marginBottom: 24,
  },
  debugText: {
    fontSize: 12,
    color: Colors.light.gray[500],
    textAlign: "center",
    marginTop: 8,
  },
  mockDataContainer: {
    padding: 16,
  },
  mockDataTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 16,
  },
  startChatButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startChatButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
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
    maxHeight: "80%",
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
  partnerList: {
    flex: 1,
  },
  partnerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  partnerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  partnerInitial: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  partnerEmail: {
    fontSize: 14,
    color: Colors.light.gray[600],
  },
  latestMessage: {
    fontSize: 14,
    color: Colors.light.gray[600],
    marginTop: 4,
  },
  latestMessageContainer: {
    marginTop: 4,
  },
  imageMessageContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  imageMessageText: {
    fontSize: 14,
    color: Colors.light.gray[600],
    marginLeft: 4,
  },

  unreadBadge: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
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
