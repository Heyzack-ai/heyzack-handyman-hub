import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Conversation } from "@/types/chat";
import Colors from "@/constants/colors";

type ConversationItemProps = {
  conversation: Conversation;
};

export default function ConversationItem({ conversation }: ConversationItemProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/chat/${conversation.id}`);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      onPress={handlePress}
    >
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: conversation.avatar }}
          style={styles.avatar}
          contentFit="cover"
        />
        {conversation.isGroup && (
          <View style={styles.groupIndicator}>
            <Text style={styles.groupText}>G</Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {conversation.title}
          </Text>
          {conversation.lastMessage && (
            <Text style={styles.timestamp}>
              {formatTime(conversation.lastMessage.timestamp)}
            </Text>
          )}
        </View>
        
        {conversation.lastMessage && (
          <Text style={styles.lastMessage} numberOfLines={2}>
            {conversation.lastMessage.isFromMe ? "You: " : ""}
            {conversation.lastMessage.content}
          </Text>
        )}
      </View>
      
      {conversation.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>
            {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  pressed: {
    backgroundColor: Colors.light.gray[100],
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.light.gray[200],
  },
  groupIndicator: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  groupText: {
    fontSize: 10,
    fontWeight: "600",
    color: "white",
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.light.gray[500],
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.light.gray[600],
  },
  unreadBadge: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
});