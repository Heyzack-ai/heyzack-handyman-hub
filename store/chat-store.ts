import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Conversation, Message } from "@/types/chat";
import { conversations as mockConversations, messages as mockMessages } from "@/mocks/chats";

interface ChatState {
  conversations: Conversation[];
  messages: { [conversationId: string]: Message[] };
  currentConversationId: string | null;
  
  // Actions
  setCurrentConversationId: (id: string | null) => void;
  getCurrentConversation: () => Conversation | undefined;
  getConversationMessages: (conversationId: string) => Message[];
  sendMessage: (conversationId: string, content: string, type?: "text" | "image" | "file") => void;
  markConversationAsRead: (conversationId: string) => void;
  getTotalUnreadCount: () => number;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: mockConversations,
      messages: mockMessages,
      currentConversationId: null,
      
      setCurrentConversationId: (id) => set({ currentConversationId: id }),
      
      getCurrentConversation: () => {
        const { conversations, currentConversationId } = get();
        return conversations.find(conv => conv.id === currentConversationId);
      },
      
      getConversationMessages: (conversationId) => {
        const { messages } = get();
        return messages[conversationId] || [];
      },
      
      sendMessage: (conversationId, content, type = "text") => {
        const newMessage: Message = {
          id: `msg-${Date.now()}`,
          content,
          type,
          timestamp: new Date().toISOString(),
          senderId: "user-001",
          senderName: "You",
          isFromMe: true,
          status: "sent",
        };
        
        set(state => ({
          messages: {
            ...state.messages,
            [conversationId]: [...(state.messages[conversationId] || []), newMessage],
          },
          conversations: state.conversations.map(conv =>
            conv.id === conversationId
              ? { ...conv, lastMessage: newMessage }
              : conv
          ),
        }));
      },
      
      markConversationAsRead: (conversationId) => set(state => ({
        conversations: state.conversations.map(conv =>
          conv.id === conversationId
            ? { ...conv, unreadCount: 0 }
            : conv
        ),
      })),
      
      getTotalUnreadCount: () => {
        const { conversations } = get();
        return conversations.reduce((total, conv) => total + conv.unreadCount, 0);
      },
    }),
    {
      name: "chat-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
