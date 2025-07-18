import React from "react";
import { View, StyleSheet } from "react-native";
import Shimmer from "./Shimmer";
import Colors from "@/constants/colors";

interface ChatShimmerProps {
  count?: number;
}

export default function ChatShimmer({ count = 6 }: ChatShimmerProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.messageContainer}>
          {/* Avatar shimmer */}
          <View style={styles.avatarContainer}>
            <Shimmer style={styles.avatar} />
          </View>
          
          {/* Message content shimmer */}
          <View style={styles.messageContent}>
            {/* Name shimmer */}
            <Shimmer style={styles.name} />
            
            {/* Message bubble shimmer */}
            <View style={styles.bubbleContainer}>
              <Shimmer style={styles.messageBubble} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  messageContent: {
    flex: 1,
  },
  name: {
    width: 80,
    height: 14,
    borderRadius: 7,
    marginBottom: 8,
  },
  bubbleContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  messageBubble: {
    width: Math.random() * 150 + 100, // Random width between 100-250
    height: 20,
    borderRadius: 16,
    backgroundColor: Colors.light.gray[200],
  },
}); 