import { authClient } from "@/lib/auth-client";
import type { ChatRoom, Message } from "@/lib/chat-client";
import { getChatHistory, getChatRooms, sendMessage } from "@/lib/chat-client";
import { database } from "@/lib/firebase";
import { off, onValue, ref } from "firebase/database";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

export interface UseChatProps {
	otherUserId?: string;
	userType?: "partner" | "handyman";
}

export interface UseChatReturn {
	messages: Message[];
	isLoading: boolean;
	isSending: boolean;
	sendChatMessage: (message: string) => Promise<void>;
	chatRooms: ChatRoom[];
	loadChatHistory: () => Promise<void>;
	loadChatRooms: () => Promise<void>;
}

/**
 * Generate consistent Firebase chat room ID
 */
export const generateChatRoomId = (
	userId1: string,
	userId2: string,
): string => {
	// Sort IDs to ensure consistent room ID regardless of order
	const sortedIds = [userId1, userId2].sort();
	return `chat_${sortedIds[0]}_${sortedIds[1]}`.replace(/[^a-zA-Z0-9_]/g, "_");
};

/**
 * Custom hook for managing chat functionality
 */
export function useChat({ otherUserId, userType }: UseChatProps = {}) {
	const { data: session } = authClient.useSession();
	const [messages, setMessages] = useState<Message[]>([]);
	const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isSending, setIsSending] = useState(false);
	const [firebaseRoomId, setFirebaseRoomId] = useState<string | null>(null);
    
	/**
	 * Load chat history with a specific user
	 */
	const loadChatHistory = useCallback(async () => {
		if (!otherUserId || !userType || !session?.user.id) return;

		setIsLoading(true);
		try {
			const chatHistory = await getChatHistory(otherUserId, userType);
			setFirebaseRoomId(chatHistory.roomId);
			setMessages(chatHistory.messages || []);
		} catch (error) {
			console.error("Failed to fetch chat history:", error);
			setMessages([]);
		} finally {
			setIsLoading(false);
		}
	}, [otherUserId, userType, session?.user.id]);

	/**
	 * Load all chat rooms for the current user
	 */
	const loadChatRooms = useCallback(async () => {
		if (!session?.user.id) return;

		try {
			const rooms = await getChatRooms();
			setChatRooms(rooms);
		} catch (error) {
			console.error("Failed to fetch chat rooms:", error);
			setChatRooms([]);
		}
	}, [session?.user.id]);

	/**
	 * Send a message
	 */
	const sendChatMessage = useCallback(
		async (messageText: string) => {
			if (!messageText.trim() || !otherUserId || !userType || !session?.user) {
				return;
			}

			setIsSending(true);
			
			// Create a temporary message for immediate display
			const tempMessage: Message = {
				id: `temp_${Date.now()}`,
				message: messageText,
				createdAt: new Date().toISOString(),
				senderId: session.user.id,
				chatRoomId: firebaseRoomId || "",
			};

			// Add message to local state immediately for instant display
			setMessages(prev => [...prev, tempMessage]);

			try {
				// Prepare message data based on user type
				const messageData = {
					message: messageText,
					...(userType === "handyman"
						? { handymanId: otherUserId }
						: { partnerId: otherUserId }),
				};

				// Send to backend for persistence
				await sendMessage(messageData);

				// No success alert - messages appear in real-time
			} catch (error) {
				console.error("Failed to send message:", error);
				// Remove the temporary message if sending failed
				setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
				Alert.alert("Failed to send message. Please try again.");
				throw error;
			} finally {
				setIsSending(false);
			}
		},
		[otherUserId, userType, session?.user, firebaseRoomId],
	);

	/**
	 * Setup Firebase real-time listener
	 */
	useEffect(() => {
		if (!firebaseRoomId) {
			console.log("No firebaseRoomId, clearing messages");
			setMessages([]);
			return;
		}

		console.log("Setting up Firebase listener for room:", firebaseRoomId);
		const messagesRef = ref(database, `chats/${firebaseRoomId}/messages`);
		
		const unsubscribe = onValue(messagesRef, (snapshot) => {
			console.log("Firebase snapshot received:", snapshot.exists());
			if (snapshot.exists()) {
				const firebaseMessages = snapshot.val();
				console.log("Firebase messages:", firebaseMessages);
				
				const messageList = Object.entries(firebaseMessages)
					.map(([id, msg]: [string, unknown]) => ({
						id,
						...(msg as Omit<Message, "id">),
					}))
					.sort(
						(a, b) =>
							new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
					);

				console.log("Processed message list:", messageList);
				setMessages(messageList);
			} else {
				console.log("No messages in Firebase, clearing local messages");
				setMessages([]);
			}
		}, (error) => {
			console.error("Firebase listener error:", error);
		});

		return () => {
			console.log("Cleaning up Firebase listener");
			off(messagesRef);
			unsubscribe();
		};
	}, [firebaseRoomId]);

	/**
	 * Load initial data when hook is used with specific parameters
	 */
	useEffect(() => {
		if (otherUserId && userType) {
			loadChatHistory();
		}
	}, [loadChatHistory, otherUserId, userType]);

	return {
		messages,
		isLoading,
		isSending,
		sendChatMessage,
		chatRooms,
		loadChatHistory,
		loadChatRooms,
	};
}