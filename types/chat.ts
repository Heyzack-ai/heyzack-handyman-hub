export interface Message {
  id: string;
  content: string;
  type: "text" | "image" | "file";
  timestamp: string;
  isFromMe: boolean;
  status: "sending" | "sent" | "delivered" | "read" | "failed";
  senderName?: string;
  senderId?: string;
}

export interface Conversation {
  id: string;
  title: string;
  avatar: string;
  isGroup: boolean;
  unreadCount: number;
  lastMessage?: Message;
  messages: Message[];
}

// For partner chat list
export interface ChatConversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isOnline?: boolean;
}
