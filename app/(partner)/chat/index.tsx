import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Image as RNImage,
} from "react-native";
import ChatListShimmer from "@/components/ChatListShimmer";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import Colors from "@/constants/colors";
import { Plus, Camera, Image as ImageIcon, X, Users, Image, Wrench } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useChat } from "@/hooks/use-chat";
import {
  getUnreadCount,
  getUnreadCountDetailed,
  getChatConnections,
  getChatHistory,
  type ChatConnection,
  type UnreadByRoom,
  type ChatRoom,
  type Message,
} from "@/lib/chat-client";
import { authClient } from "@/lib/auth-client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "@/src/i18n/useTranslations";
import { useAuth } from "@/lib/auth-context";
import { getHandymen } from "@/lib/api/partner-api";

interface Handyman {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "Available" | "Busy" | "On Leave" | "offline";
  rating: number;
  totalJobs: number;
  skills: string[];
  current_location?: string;
  profile_image?: string;
  verified: boolean;
}

export default function PartnerChatScreen() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const queryClient = useQueryClient();
  const [showHandymanList, setShowHandymanList] = useState(false);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const { t } = useTranslations();
  const { role } = useAuth();

  // Get total unread count
  const { data: totalUnreadCount, isLoading: unreadCountLoading } = useQuery({
    queryKey: ["unread-count"],
    queryFn: getUnreadCount,
    enabled: !!session?.user?.id,
  });

  // Get detailed unread counts per room
  const { data: unreadByRoomData } = useQuery({
    queryKey: ["unread-count-detailed"],
    queryFn: getUnreadCountDetailed,
    enabled: !!session?.user?.id,
  });

  // Create a map of userId to unread count for quick lookup
  const unreadCountMap = React.useMemo(() => {
    const map = new Map<string, number>();
    unreadByRoomData?.byRoom.forEach((room: UnreadByRoom | null | undefined) => {
      if (room) {
        map.set(room.otherUserId, room.unreadCount);
      }
    });
    return map;
  }, [unreadByRoomData]);

  // Get chat connections (partners, handymen, admin)
  const {
    data: chatConnections,
    isLoading: connectionsLoading,
    error: connectionsError,
  } = useQuery({
    queryKey: ["chat-connections"],
    queryFn: getChatConnections,
    enabled: !!session?.user?.id,
    retry: 1,
  });

  // Get handymen list for the partner
  const { data: handymen, isLoading: handymenLoading } = useQuery<Handyman[]>({
    queryKey: ["partner-handymen"],
    queryFn: async () => {
      const response = await getHandymen();
      return response.map((h: any) => ({
        id: h?.id || h?.name || String(Math.random()),
        name:
          typeof h?.name === "object"
            ? h.name?.name || t("chat.unknownHandyman", "Unknown Handyman")
            : h?.name || h?.handyman_name || t("chat.unknownHandyman", "Unknown Handyman"),
        email: h?.email || "",
        phone: h?.phone || h?.contact_number || "",
        status: (h?.availability_status || "offline").toLowerCase(),
        rating: parseFloat(h?.rating) || 0,
        totalJobs: h?.completedJobs || 0,
        skills: h?.skills
          ? typeof h.skills === "string"
            ? h.skills.split(",").map((s: string) => s.trim())
            : Array.isArray(h.skills)
              ? h.skills
              : []
          : [],
        current_location: h?.current_location || "",
        profile_image: h?.profile_image || "",
        verified: h?.is_verified === 1 || h?.verified === true,
      }));
    },
    enabled: !!session?.user?.id,
  });

  // Fetch last messages for all handymen
  const { data: handymanLastMessages } = useQuery({
    queryKey: ["handyman-last-messages", handymen?.map(h => h.id).join(",")],
    queryFn: async () => {
      if (!handymen || handymen.length === 0) return {};

      const messagesMap: Record<string, Message | null> = {};

      // Fetch last message for each handyman
      await Promise.all(
        handymen.map(async (handyman) => {
          try {
            const history = await getChatHistory(handyman.id, "handyman", 1, 1);
            if (history.messages && history.messages.length > 0) {
              // Get the most recent message
              const sorted = [...history.messages].sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
              messagesMap[handyman.id] = sorted[0];
            } else {
              messagesMap[handyman.id] = null;
            }
          } catch (error) {
            console.error(`Failed to fetch chat history for ${handyman.id}:`, error);
            messagesMap[handyman.id] = null;
          }
        })
      );

      return messagesMap;
    },
    enabled: !!handymen && handymen.length > 0 && !!session?.user?.id,
    staleTime: 30000, // 30 seconds
  });

  // Extract admin from connections API response or use hardcoded fallback
  const adminConnection = useMemo(() => {
    // First, try to find admin in connections from API response
    const admin = chatConnections?.connections?.find(
      (conn: ChatConnection | null | undefined) => {
        if (!conn) return false;
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

    // Hardcoded fallback - admin_heyzack
    // This ensures admin chat is always available even if not in API response
    return {
      id: "admin_heyzack",
      name: t("chat.heyzackAdmin") || "HeyZack Admin",
      email: "admin@heyzack.ai",
      image: null,
    };
  }, [chatConnections, t]);

  // Get chat history with admin
  const { data: adminChatHistory } = useQuery({
    queryKey: ["admin-chat-history", adminConnection?.id],
    queryFn: () =>
      adminConnection
        ? getChatHistory(adminConnection.id, "admin", 1, 50)
        : Promise.resolve(null),
    enabled: !!adminConnection?.id,
    retry: 1,
  });

  // Refresh chat data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      queryClient.refetchQueries({ queryKey: ["unread-count"] });
      queryClient.refetchQueries({ queryKey: ["unread-count-detailed"] });
      queryClient.refetchQueries({ queryKey: ["partner-handymen"] });
      queryClient.refetchQueries({ queryKey: ["handyman-last-messages"] });
    }, [queryClient])
  );

  console.log("Partner Chat - Chat Connections Query State:", {
    data: chatConnections,
    isLoading: connectionsLoading,
    error: connectionsError,
  });

  if (connectionsError) {
    console.error("Error fetching chat connections:", connectionsError);
  }

  console.log("Partner Chat - Admin Connection Found:", adminConnection);

  const handleNewChat = () => {
    setShowHandymanList(true);
  };

  const handleHandymanSelect = (handyman: Handyman) => {
    const userId = session?.user?.id;
    if (!userId) return;

    const roomId = `chat_${userId}_${handyman.id}`;

    router.push({
      pathname: `/(partner)/chat/[id]`,
      params: {
        id: roomId,
        handymanId: handyman.id,
        handymanName: handyman.name,
      },
    });
    setShowHandymanList(false);
  };
  const handleHandymanClick = (handyman: Handyman) => {
    const userId = session?.user?.id;
    if (!userId) return;

    const roomId = `chat_${userId}_${handyman.id}`;

    router.push({
      pathname: `/(partner)/chat/[id]`,
      params: {
        id: roomId,
        handymanId: handyman.id,
        handymanName: handyman.name,
      },
    });
  };

  const handleAdminClick = () => {
    if (!adminConnection) return;
    const userId = session?.user?.id;
    if (!userId) return;

    const roomId = `chat_${userId}_${adminConnection.id}`;

    router.push({
      pathname: `/(partner)/chat/[id]`,
      params: {
        id: roomId,
        adminId: adminConnection.id,
        adminName: adminConnection.name || t("chat.heyzackAdmin") || "HeyZack Admin",
      },
    });
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          t("chat.permissionRequired"),
          t("chat.cameraPermissionRequired")
        );
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
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          t("chat.permissionRequired"),
          t("chat.galleryPermissionRequired")
        );
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

  const renderHandymanItem = (handyman: Handyman) => (
    <TouchableOpacity
      key={handyman.id}
      style={styles.handymanItem}
      onPress={() => handleHandymanSelect(handyman)}
      activeOpacity={0.7}
    >
      <View style={styles.handymanAvatar}>
        <Text style={styles.handymanInitial}>
          {handyman.name?.charAt(0) || "H"}
        </Text>
      </View>
      <View style={styles.handymanInfo}>
        <Text style={styles.handymanName}>
          {handyman.name || "Unknown Handyman"}
        </Text>
        <Text style={styles.latestMessage}>{t("chat.startChat")}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderHandymanChatItem = (handyman: Handyman) => {
    // Get unread count from the detailed API (most accurate)
    const unreadCountFromApi =
      unreadCountMap.get(handyman.id) ||
      unreadCountMap.get(handyman.id) ||
      0;

    const unreadCount = unreadCountFromApi ?? 0;

    // Get last message for this handyman
    const lastMessage = handymanLastMessages?.[handyman.id];
    const isImageMessage = lastMessage?.messageType === 'image';

    // Format timestamp
    const getTimeAgo = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'now';
      if (diffMins < 60) return `${diffMins}m`;
      if (diffHours < 24) return `${diffHours}h`;
      if (diffDays < 7) return `${diffDays}d`;
      return date.toLocaleDateString();
    };

    return (
      <TouchableOpacity
        key={handyman.id}
        style={styles.handymanItem}
        onPress={() => {
          console.log("Handyman pressed:", handyman.id, handyman.name);
          handleHandymanClick(handyman);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.handymanAvatar}>
          {handyman.profile_image ? (
            <RNImage
              source={{ uri: handyman.profile_image }}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.handymanInitial}>
              {handyman.name?.charAt(0) || "H"}
            </Text>
          )}
          {handyman.status === "Available" && (
            <View style={styles.onlineIndicator} />
          )}
        </View>
        <View style={styles.handymanInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.handymanName} numberOfLines={1}>
              {handyman.name || t("chat.unknownHandyman")}
            </Text>
            {lastMessage && (
              <Text style={styles.timeText}>
                {getTimeAgo(lastMessage.createdAt)}
              </Text>
            )}
          </View>
          <View style={styles.latestMessageContainer}>
            {isImageMessage ? (
              <View style={styles.imageMessageContainer}>
                <Image size={14} color={Colors.light.gray[500]} />
                <Text style={styles.imageMessageText}>{t("chat.photo")}</Text>
              </View>
            ) : (
              <Text style={styles.latestMessage} numberOfLines={1} ellipsizeMode="tail">
                {lastMessage?.message || t("chat.tapToChat")}
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

  // Show loading while fetching session
  if (sessionLoading) {
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
            {totalUnreadCount !== undefined &&
              totalUnreadCount !== null &&
              totalUnreadCount > 0 && (
                <View style={styles.headerUnreadBadge}>
                  <Text style={styles.headerUnreadText}>
                    {totalUnreadCount > 99
                      ? "99+"
                      : totalUnreadCount.toString()}
                  </Text>
                </View>
              )}
          </View>
        </View>

        <ScrollView style={styles.conversationsList} showsVerticalScrollIndicator={false}>
          {/* Admin Chat - always show for partners */}
          {adminConnection && (() => {
            // Get admin unread count from detailed API (most accurate)
            const adminUnreadCountFromApi = unreadCountMap.get(adminConnection.id);
            const adminUnreadCount = adminUnreadCountFromApi ?? 0;

            // Get last message from chat history
            let adminLastMessage = undefined;
            if (adminChatHistory?.messages && adminChatHistory.messages.length > 0) {
              const sortedMessages = [...adminChatHistory.messages].sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              );
              adminLastMessage = sortedMessages[0];
            }
            const isAdminImageMessage =
              adminLastMessage && (adminLastMessage as any).messageType === "image";

            return (
              <TouchableOpacity
                key="admin-chat"
                style={styles.adminItem}
                onPress={() => {
                  console.log("Admin chat pressed");
                  handleAdminClick();
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.adminAvatar,
                    { backgroundColor: Colors.light.secondary },
                  ]}
                >
                  <Text style={styles.adminInitial}>
                    {adminConnection.name?.charAt(0) || "A"}
                  </Text>
                </View>
                <View style={styles.adminInfo}>
                  <Text style={styles.adminName}>
                    {adminConnection.name || t("chat.heyzackAdmin")}
                  </Text>
                  <View style={styles.latestMessageContainer}>
                    {isAdminImageMessage ? (
                      <View style={styles.imageMessageContainer}>
                        <Image size={16} color={Colors.light.gray[500]} />
                        <Text style={styles.imageMessageText}>
                          {t("chat.photo")}
                        </Text>
                      </View>
                    ) : (
                      <Text
                        style={styles.latestMessage}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {adminLastMessage?.message || t("chat.noMessages")}
                      </Text>
                    )}
                  </View>
                </View>
                {adminUnreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>
                      {adminUnreadCount > 99
                        ? "99+"
                        : adminUnreadCount.toString()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })()}

          {/* Section Header for Handymen */}
          <View style={styles.sectionHeader}>
            <Wrench size={18} color={Colors.light.gray[600]} />
            <Text style={styles.sectionTitle}>
              {t("chat.yourHandymen") || "Your Handymen"}
            </Text>
          </View>

          {/* Handymen List */}
          {handymenLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.light.primary} />
              <Text style={styles.loadingText}>{t("chat.loadingHandymen")}</Text>
            </View>
          ) : !handymen || handymen.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Users size={48} color={Colors.light.gray[400]} />
              <Text style={styles.emptyTitle}>{t("chat.noHandymen")}</Text>
              <Text style={styles.emptySubtitle}>
                {t("chat.noHandymenText")}
              </Text>
            </View>
          ) : (
            handymen.map(renderHandymanChatItem)
          )}
        </ScrollView>

        {/* Handyman List Modal for New Chat */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showHandymanList}
          onRequestClose={() => setShowHandymanList(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowHandymanList(false)}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {t("chat.selectHandyman")}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowHandymanList(false)}
                >
                  <X size={20} color={Colors.light.gray[600]} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.handymanList}>
                {handymenLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator
                      size="large"
                      color={Colors.light.primary}
                    />
                    <Text style={styles.loadingText}>
                      {t("chat.loadingHandymen")}
                    </Text>
                  </View>
                ) : !handymen || handymen.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>
                      {t("chat.noAvailableHandymen")}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                      {t("chat.noHandymenAssigned")}
                    </Text>
                  </View>
                ) : (
                  handymen.map(renderHandymanItem)
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
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
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
                  <View
                    style={[
                      styles.mediaIconContainer,
                      { backgroundColor: Colors.light.primary },
                    ]}
                  >
                    <Camera size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.mediaOptionText}>
                    {t("chat.camera", "Camera")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.mediaOption}
                  onPress={handlePickImage}
                >
                  <View
                    style={[
                      styles.mediaIconContainer,
                      { backgroundColor: Colors.light.secondary },
                    ]}
                  >
                    <ImageIcon size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.mediaOptionText}>
                    {t("chat.gallery", "Gallery")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.mediaOption}
                  onPress={handleNewChat}
                >
                  <View
                    style={[
                      styles.mediaIconContainer,
                      { backgroundColor: Colors.light.success },
                    ]}
                  >
                    <Plus size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.mediaOptionText}>
                    {t("chat.newChat", "New Chat")}
                  </Text>
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
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
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
  conversationsList: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.gray[100],
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.gray[700],
    textTransform: "uppercase",
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
    paddingHorizontal: 32,
  },
  adminItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.gray[100],
  },
  adminAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.secondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  adminInitial: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  adminInfo: {
    flex: 1,
  },
  adminName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  handymanItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: "white",
  },
  handymanAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    position: "relative",
    overflow: "hidden",
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  handymanInitial: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.light.success,
    borderWidth: 2,
    borderColor: "white",
  },
  handymanInfo: {
    flex: 1,
  },
  handymanName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
    color: Colors.light.gray[500],
    marginLeft: 8,
  },
  handymanEmail: {
    fontSize: 14,
    color: Colors.light.gray[600],
  },
  latestMessage: {
    fontSize: 14,
    color: Colors.light.gray[600],
  },
  latestMessageContainer: {
    marginTop: 2,
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
  handymanList: {
    flex: 1,
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
