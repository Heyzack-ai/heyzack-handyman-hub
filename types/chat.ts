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
