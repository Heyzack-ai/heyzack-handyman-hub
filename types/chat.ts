export type MessageType = "text" | "image" | "file";

export type Message = {
  id: string;
  content: string;
  type: MessageType;
  timestamp: string;
  senderId: string;
  senderName: string;
  isFromMe: boolean;
};

export type Conversation = {
  id: string;
  title: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  avatar?: string;
  isGroup: boolean;
  jobId?: string;
};