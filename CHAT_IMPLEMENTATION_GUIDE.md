# Chat Implementation Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Firebase Setup](#firebase-setup)
3. [Core Components](#core-components)
4. [Implementation Steps](#implementation-steps)
5. [API Integration](#api-integration)
6. [Real-time Messaging with Firebase](#real-time-messaging-with-firebase)
7. [Adding New Chat Features](#adding-new-chat-features)
8. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

The chat system in Heyzack Handyman Hub uses a **hybrid architecture** combining:
- **Backend API** for message persistence and chat room management
- **Firebase Realtime Database** for real-time message delivery
- **React Query** for data fetching and caching
- **Custom React Hooks** for chat state management

### Data Flow

```
User sends message
    ↓
Backend API (POST /chat/send) - Persists message
    ↓
Firebase Realtime Database - Broadcasts to all clients
    ↓
Firebase Listeners - Update UI in real-time
```

---

## Firebase Setup

### 1. Install Firebase Dependencies

The project already includes Firebase. If you need to reinstall:

```bash
npm install firebase
```

### 2. Firebase Configuration

Create or update `lib/firebase.ts`:

```typescript
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
```

### 3. Environment Variables

Add these to your `.env` file:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Firebase Realtime Database Rules

Configure your Firebase Realtime Database rules:

```json
{
  "rules": {
    "chats": {
      "$roomId": {
        ".read": "auth != null",
        ".write": "auth != null",
        "messages": {
          ".read": "auth != null",
          ".write": "auth != null",
          "$messageId": {
            ".validate": "newData.hasChildren(['id', 'message', 'createdAt', 'senderId'])"
          }
        },
        "participants": {
          ".read": "auth != null",
          ".write": "auth != null"
        }
      }
    }
  }
}
```

---

## Core Components

### 1. Chat Client (`lib/chat-client.ts`)

Handles all API calls for chat functionality:

**Key Functions:**
- `getChatHistory()` - Fetch message history
- `sendMessage()` - Send a text message
- `sendImage()` - Send an image message
- `getChatRooms()` - Get all chat rooms with unread counts
- `getUnreadCount()` - Get total unread message count
- `getChatConnections()` - Get available chat connections (partners, handymen, admin)
- `markMessagesAsRead()` - Mark messages as read

**Example Usage:**
```typescript
import { getChatHistory, sendMessage } from "@/lib/chat-client";

// Get chat history
const history = await getChatHistory(partnerId, "partner", 1, 50);

// Send a message
const response = await sendMessage({
  message: "Hello!",
  partnerId: "partner_123"
});
```

### 2. Chat Hook (`hooks/use-chat.ts`)

Custom React hook that manages chat state and Firebase integration:

**Features:**
- Real-time message updates via Firebase
- Message sending with optimistic updates
- Chat history loading
- Firebase room initialization
- Automatic reconnection on errors

**Usage:**
```typescript
import { useChat } from "@/hooks/use-chat";

const {
  messages,
  isLoading,
  isSending,
  sendChatMessage,
  sendImageMessage,
  loadChatHistory,
} = useChat({
  otherUserId: "partner_123",
  userType: "partner", // or "handyman" or "admin"
});
```

### 3. Chat Room ID Generation

The system uses consistent room ID generation:

```typescript
// For partner-handyman chats
generateChatRoomId(userId1, userId2) 
// Returns: "chat_user1_user2" (sorted)

// For admin chats
// Returns: "room_admin_{userId}"
```

---

## Implementation Steps

### Step 1: Set Up Chat List Screen

**File:** `app/(tabs)/chat.tsx`

```typescript
import { useQuery } from "@tanstack/react-query";
import { getChatRooms, getUnreadCount, getChatConnections } from "@/lib/chat-client";

export default function ChatScreen() {
  const { data: session } = authClient.useSession();
  
  // Get chat rooms
  const { data: chatRooms } = useQuery({
    queryKey: ["chat-rooms"],
    queryFn: getChatRooms,
    enabled: !!session?.user.id,
  });
  
  // Get total unread count
  const { data: totalUnreadCount } = useQuery({
    queryKey: ["unread-count"],
    queryFn: getUnreadCount,
    enabled: !!session?.user.id,
  });
  
  // Get chat connections
  const { data: chatConnections } = useQuery({
    queryKey: ["chat-connections"],
    queryFn: getChatConnections,
    enabled: !!session?.user.id,
  });
  
  // Render chat list...
}
```

### Step 2: Implement Individual Chat Screen

**File:** `app/chat/[id].tsx`

```typescript
import { useChat } from "@/hooks/use-chat";

export default function ChatConversationScreen() {
  const { id, partnerId, adminId } = useLocalSearchParams();
  const isAdminChat = !!adminId;
  const recipientId = adminId || partnerId;
  const recipientType = adminId ? "admin" : "partner";
  
  const {
    messages,
    isLoading,
    isSending,
    sendChatMessage,
    sendImageMessage,
    loadChatHistory,
  } = useChat({
    otherUserId: recipientId,
    userType: recipientType,
  });
  
  // Load chat history on mount
  useEffect(() => {
    if (recipientId) {
      loadChatHistory();
    }
  }, [recipientId, loadChatHistory]);
  
  // Render messages and input...
}
```

### Step 3: Add Message Sending

```typescript
const handleSendMessage = async () => {
  if (!messageText.trim()) return;
  
  try {
    await sendChatMessage(messageText);
    setMessageText("");
  } catch (error) {
    console.error("Failed to send message:", error);
  }
};
```

### Step 4: Add Image Sending

```typescript
const handleSendImage = async (imageUri: string) => {
  try {
    await sendImageMessage(imageUri, recipientType);
  } catch (error) {
    console.error("Failed to send image:", error);
  }
};
```

---

## API Integration

### Backend API Endpoints

The chat system requires these backend endpoints:

#### 1. Get Chat History
```
GET /chat/history?partnerId={id}&page=1&limit=50
GET /chat/history?handymanId={id}&page=1&limit=50
GET /chat/history?adminId={id}&page=1&limit=50
```

**Response:**
```json
{
  "data": {
    "messages": [
      {
        "id": "msg_123",
        "message": "Hello!",
        "createdAt": "2024-01-01T12:00:00Z",
        "senderId": "user_123",
        "messageType": "text",
        "imageUrl": null
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "totalPages": 2
    },
    "roomId": "chat_user1_user2"
  }
}
```

#### 2. Send Message
```
POST /chat/send
Content-Type: application/json

{
  "message": "Hello!",
  "partnerId": "partner_123" // or handymanId or adminId
}
```

**Response:**
```json
{
  "data": {
    "id": "msg_123",
    "roomId": "chat_user1_user2",
    "message": "Hello!",
    "createdAt": "2024-01-01T12:00:00Z",
    "senderId": "user_123",
    "messageType": "text"
  }
}
```

#### 3. Get Chat Rooms
```
GET /chat/rooms
```

**Response:**
```json
{
  "data": {
    "rooms": [
      {
        "roomId": "chat_user1_user2",
        "otherUser": {
          "id": "user_2",
          "name": "Partner Name",
          "email": "partner@example.com",
          "type": "partner"
        },
        "lastMessage": {
          "id": "msg_123",
          "message": "Hello!",
          "createdAt": "2024-01-01T12:00:00Z"
        },
        "lastActivity": "2024-01-01T12:00:00Z",
        "unreadCount": 5
      }
    ]
  }
}
```

#### 4. Get Unread Count
```
GET /chat/unread-count
```

**Response:**
```json
{
  "data": {
    "count": 10
  }
}
```

#### 5. Get Chat Connections
```
GET /chat/connections
```

**Response:**
```json
{
  "data": {
    "connections": [
      {
        "id": "partner_123",
        "name": "Partner Name",
        "email": "partner@example.com",
        "type": "partner",
        "image": null,
        "phone": "+1234567890"
      }
    ],
    "role": "handyman"
  }
}
```

---

## Real-time Messaging with Firebase

### How It Works

1. **Initial Load**: Messages are fetched from the backend API
2. **Firebase Sync**: Initial messages are synced to Firebase (if not already present)
3. **Real-time Listener**: Firebase listener watches for new messages
4. **New Messages**: When a new message is added to Firebase, all connected clients receive it instantly

### Firebase Data Structure

```
chats/
  └── {roomId}/
      ├── createdAt: timestamp
      ├── participants/
      │   └── {userId}/
      │       ├── lastSeen: timestamp
      │       └── online: boolean
      └── messages/
          └── {messageId}/
              ├── id: string
              ├── message: string
              ├── createdAt: string
              ├── senderId: string
              ├── messageType?: string
              └── imageUrl?: string
```

### Setting Up Firebase Listener

The `useChat` hook automatically sets up Firebase listeners:

```typescript
// Inside useChat hook
const setupFirebaseListener = useCallback(async () => {
  if (!firebaseRoomId) return;
  
  const messagesRef = ref(database, `chats/${firebaseRoomId}/messages`);
  
  // Fetch initial messages
  const snapshot = await get(messagesRef);
  if (snapshot.exists()) {
    const firebaseMessages = snapshot.val();
    // Process and set messages
  }
  
  // Listen for new messages
  const unsubscribe = onChildAdded(messagesRef, (snapshot) => {
    const newMessage = snapshot.val();
    // Add to messages state
  });
  
  return unsubscribe;
}, [firebaseRoomId]);
```

### Sending Messages to Firebase

```typescript
// After sending to backend API
if (firebaseRoomId) {
  const newMessageRef = push(ref(database, `chats/${firebaseRoomId}/messages`));
  await set(newMessageRef, {
    id: response.id,
    message: messageText,
    createdAt: response.createdAt,
    senderId: response.senderId,
    chatRoomId: firebaseRoomId,
  });
}
```

---

## Adding New Chat Features

### Adding a New User Type

1. **Update Types:**
```typescript
// lib/chat-client.ts
export interface SendMessageRequest {
  message: string;
  partnerId?: string;
  handymanId?: string;
  adminId?: string;
  newUserTypeId?: string; // Add new type
}
```

2. **Update Chat Hook:**
```typescript
// hooks/use-chat.ts
export interface UseChatProps {
  otherUserId?: string;
  userType?: "partner" | "handyman" | "admin" | "newUserType"; // Add new type
}
```

3. **Update Message Sending:**
```typescript
// hooks/use-chat.ts
let messageData: any = { message: messageText };
if (userType === "newUserType") {
  messageData.newUserTypeId = otherUserId;
}
```

### Adding Typing Indicators

1. **Add to Firebase:**
```typescript
// Set typing status
const typingRef = ref(database, `chats/${roomId}/typing/${userId}`);
await set(typingRef, true);

// Listen for typing status
const typingRef = ref(database, `chats/${roomId}/typing`);
onValue(typingRef, (snapshot) => {
  const typingUsers = snapshot.val();
  // Update UI
});
```

2. **Add to Chat Hook:**
```typescript
const [typingUsers, setTypingUsers] = useState<string[]>([]);

const setupTypingListener = useCallback(() => {
  const typingRef = ref(database, `chats/${firebaseRoomId}/typing`);
  return onValue(typingRef, (snapshot) => {
    const users = Object.keys(snapshot.val() || {});
    setTypingUsers(users.filter(id => id !== session?.user.id));
  });
}, [firebaseRoomId, session?.user.id]);
```

### Adding Read Receipts

1. **Mark Messages as Read:**
```typescript
import { markMessagesAsRead } from "@/lib/chat-client";

const handleMarkAsRead = async (roomId: string, messageIds: string[]) => {
  await markMessagesAsRead(roomId, messageIds);
};
```

2. **Track Read Status in Firebase:**
```typescript
// Update read status
const readRef = ref(database, `chats/${roomId}/read/${userId}`);
await set(readRef, serverTimestamp());
```

### Adding File Attachments

1. **Extend Message Interface:**
```typescript
export interface Message {
  // ... existing fields
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}
```

2. **Add File Upload:**
```typescript
const sendFileMessage = async (fileUri: string, fileName: string) => {
  // Upload file to storage
  const fileUrl = await uploadFile(fileUri);
  
  // Send message with file info
  await sendMessage({
    message: fileName,
    fileUrl,
    fileName,
    messageType: "file",
    partnerId: otherUserId
  });
};
```

---

## Troubleshooting

### Messages Not Appearing in Real-time

**Problem:** Messages sent by other users don't appear immediately.

**Solutions:**
1. Check Firebase listener is active:
```typescript
console.log("Listener active:", isListenerActive);
```

2. Verify Firebase room ID matches:
```typescript
console.log("Firebase room ID:", firebaseRoomId);
```

3. Check Firebase rules allow read/write access

4. Verify network connectivity

### Unread Counts Not Updating

**Problem:** Badge shows incorrect or no unread count.

**Solutions:**
1. Check API response structure:
```typescript
console.log("Chat rooms:", chatRooms);
console.log("Unread count:", totalUnreadCount);
```

2. Verify room matching logic:
```typescript
const room = chatRooms?.find(r => 
  r.otherUser.id === partnerId || 
  r.roomId.includes(partnerId)
);
console.log("Matched room:", room);
```

3. Ensure backend returns `unreadCount` in chat rooms

### Firebase Connection Issues

**Problem:** Firebase listeners not connecting.

**Solutions:**
1. Check Firebase configuration:
```typescript
console.log("Firebase config:", firebaseConfig);
```

2. Verify environment variables are set

3. Check Firebase Realtime Database is enabled in Firebase Console

4. Verify authentication token is valid

### Duplicate Messages

**Problem:** Messages appear multiple times.

**Solutions:**
1. Check for duplicate prevention:
```typescript
const messageExists = prev.some(msg => msg.id === newMessage.id);
if (messageExists) return prev;
```

2. Ensure temporary messages are removed after sending

3. Check Firebase listener cleanup on component unmount

---

## Best Practices

### 1. Always Clean Up Listeners

```typescript
useEffect(() => {
  const unsubscribe = setupFirebaseListener();
  return () => {
    if (unsubscribe) unsubscribe();
  };
}, [setupFirebaseListener]);
```

### 2. Handle Offline Scenarios

```typescript
import NetInfo from "@react-native-community/netinfo";

const [isOnline, setIsOnline] = useState(true);

useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(state => {
    setIsOnline(state.isConnected ?? false);
  });
  return unsubscribe;
}, []);
```

### 3. Optimize Message Loading

```typescript
// Load messages in pages
const loadMoreMessages = async () => {
  const nextPage = Math.floor(messages.length / 50) + 1;
  const history = await getChatHistory(partnerId, "partner", nextPage, 50);
  setMessages(prev => [...history.messages, ...prev]);
};
```

### 4. Cache Chat Rooms

```typescript
// Use React Query for automatic caching
const { data: chatRooms } = useQuery({
  queryKey: ["chat-rooms"],
  queryFn: getChatRooms,
  staleTime: 30000, // Cache for 30 seconds
});
```

### 5. Error Handling

```typescript
try {
  await sendChatMessage(message);
} catch (error) {
  // Show user-friendly error
  Alert.alert("Error", "Failed to send message. Please try again.");
  // Log for debugging
  console.error("Send message error:", error);
}
```

---

## Code Examples

### Complete Chat Screen Example

```typescript
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity } from "react-native";
import { useChat } from "@/hooks/use-chat";
import { useLocalSearchParams } from "expo-router";

export default function ChatScreen() {
  const { partnerId, adminId } = useLocalSearchParams();
  const [messageText, setMessageText] = useState("");
  
  const recipientId = adminId || partnerId;
  const recipientType = adminId ? "admin" : "partner";
  
  const {
    messages,
    isLoading,
    isSending,
    sendChatMessage,
    loadChatHistory,
  } = useChat({
    otherUserId: recipientId,
    userType: recipientType,
  });
  
  useEffect(() => {
    if (recipientId) {
      loadChatHistory();
    }
  }, [recipientId, loadChatHistory]);
  
  const handleSend = async () => {
    if (!messageText.trim() || isSending) return;
    
    try {
      await sendChatMessage(messageText);
      setMessageText("");
    } catch (error) {
      console.error("Failed to send:", error);
    }
  };
  
  return (
    <View style={{ flex: 1 }}>
      <ScrollView>
        {messages.map((message) => (
          <View key={message.id}>
            <Text>{message.message}</Text>
            <Text>{new Date(message.createdAt).toLocaleTimeString()}</Text>
          </View>
        ))}
      </ScrollView>
      
      <View style={{ flexDirection: "row" }}>
        <TextInput
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Type a message..."
        />
        <TouchableOpacity onPress={handleSend} disabled={isSending}>
          <Text>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

---

## Summary

This chat implementation provides:
- ✅ Real-time messaging via Firebase
- ✅ Message persistence via Backend API
- ✅ Unread count tracking
- ✅ Support for multiple user types (partner, handyman, admin)
- ✅ Image message support
- ✅ Automatic reconnection on errors
- ✅ Optimistic UI updates

For questions or issues, refer to the troubleshooting section or check the console logs for debugging information.
