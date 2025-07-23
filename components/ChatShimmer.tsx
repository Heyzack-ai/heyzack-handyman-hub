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
          {/* Chat bubble shimmer - alternating left and right */}
          <View style={[
            styles.bubbleContainer,
            index % 2 === 0 ? styles.bubbleLeft : styles.bubbleRight
          ]}>
            <Shimmer style={[
              styles.messageBubble,
              index % 2 === 0 ? styles.bubbleLeftStyle : styles.bubbleRightStyle
            ]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  messageContainer: {
    marginBottom: 12,
  },
  bubbleContainer: {
    maxWidth: "80%",
  },
  bubbleLeft: {
    alignSelf: "flex-start",
  },
  bubbleRight: {
    alignSelf: "flex-end",
  },
  messageBubble: {
    height: 20,
    borderRadius: 16,
  },
  bubbleLeftStyle: {
    width: Math.random() * 120 + 80, // Random width between 80-200
    borderBottomLeftRadius: 4,
  },
  bubbleRightStyle: {
    width: Math.random() * 120 + 80, // Random width between 80-200
    borderBottomRightRadius: 4,
  },
}); 