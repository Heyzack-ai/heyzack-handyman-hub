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
} from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { Send, ArrowLeft } from "lucide-react-native";
import { useChatStore } from "@/store/chat-store";
import MessageBubble from "@/components/MessageBubble";
import Colors from "@/constants/colors";
import Header from "@/components/Header";

export default function ChatConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [messageText, setMessageText] = useState("");
  
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
       
        <View style={styles.container}>
          <Text>Conversation not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSendMessage = () => {
    if (messageText.trim() && conversation) {
      sendMessage(conversation.id, messageText.trim());
      setMessageText("");
      
      // Scroll to bottom after sending message
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleGoBack = () => {
    router.back();
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
  backButton: {
    padding: 8,
    marginLeft: -4,
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
  header: {
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.light.text,
  },
});
