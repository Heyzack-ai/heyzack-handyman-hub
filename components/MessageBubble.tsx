import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Image } from "expo-image";
import Colors from "@/constants/colors";
import { Message } from "@/types/chat";

type MessageBubbleProps = {
  message: Message;
};

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isFromMe = message.isFromMe;
  const isImage = message.type === "image";
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <View style={[
      styles.container,
      isFromMe ? styles.containerFromMe : styles.containerFromOther
    ]}>
      {!isFromMe && message.senderName && (
        <Text style={styles.senderName}>{message.senderName}</Text>
      )}
      
      {isImage ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: message.content }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        </View>
      ) : (
        <Text style={[
          styles.messageText,
          isFromMe ? styles.messageTextFromMe : styles.messageTextFromOther
        ]}>
          {message.content}
        </Text>
      )}
      
      <Text style={[
        styles.timestamp,
        isFromMe ? styles.timestampFromMe : styles.timestampFromOther
      ]}>
        {formatTime(message.timestamp)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: "80%",
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 16,
  },
  containerFromMe: {
    alignSelf: "flex-end",
    backgroundColor: Colors.light.primary,
    borderBottomRightRadius: 4,
  },
  containerFromOther: {
    alignSelf: "flex-start",
    backgroundColor: Colors.light.gray[200],
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.gray[600],
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTextFromMe: {
    color: "white",
  },
  messageTextFromOther: {
    color: Colors.light.text,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  timestampFromMe: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  timestampFromOther: {
    color: Colors.light.gray[500],
  },
  imageContainer: {
    borderRadius: 12,
    overflow: "hidden",
    width: 200,
    height: 200,
  },
  image: {
    width: "100%",
    height: "100%",
  }
});
