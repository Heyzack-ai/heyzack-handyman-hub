import { authClient } from "@/lib/auth-client";
import type { ChatRoom, Message } from "@/lib/chat-client";
import { getChatHistory, getChatRooms, sendMessage, sendImage } from "@/lib/chat-client";
import { database } from "@/lib/firebase";
import { off, onValue, onChildAdded, ref, onDisconnect, serverTimestamp, set, push, get } from "firebase/database";
import { useCallback, useEffect, useState, useRef } from "react";
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
	const [isListenerActive, setIsListenerActive] = useState(false);
	const listenerRef = useRef<(() => void) | null>(null);
	const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const currentRoomIdRef = useRef<string | null>(null);
    
	/**
	 * Sync initial messages to Firebase for real-time updates
	 */
	const syncInitialMessagesToFirebase = useCallback(async (messages: Message[]) => {
		if (!firebaseRoomId || messages.length === 0) return;

		try {
			const messagesRef = ref(database, `chats/${firebaseRoomId}/messages`);
			
			// Check if Firebase already has messages
			const snapshot = await get(messagesRef);
			if (snapshot.exists()) {
				console.log("Firebase already has messages, skipping sync");
				return;
			}
			
			// Create a batch of messages to sync
			const messageUpdates: Record<string, any> = {};
			
			messages.forEach((message) => {
				// Filter out undefined values and create clean message object
				const cleanMessage: any = {
					id: message.id,
					message: message.message,
					createdAt: message.createdAt,
					senderId: message.senderId,
					chatRoomId: firebaseRoomId,
				};

				// Only add optional fields if they exist and are not undefined
				if (message.messageType) {
					cleanMessage.messageType = message.messageType;
				}
				if (message.imageUrl) {
					cleanMessage.imageUrl = message.imageUrl;
				}

				messageUpdates[message.id] = cleanMessage;
			});

			// Update Firebase with all messages
			await set(messagesRef, messageUpdates);
			console.log("Synced", messages.length, "initial messages to Firebase");
		} catch (error) {
			console.error("Failed to sync initial messages to Firebase:", error);
		}
	}, [firebaseRoomId]);
    
	/**
	 * Load chat history with a specific user
	 */
	const loadChatHistory = useCallback(async () => {
		if (!otherUserId || !userType || !session?.user.id) return;

		console.log("Loading chat history for:", otherUserId, userType);

		setIsLoading(true);
		try {
			const chatHistory = await getChatHistory(otherUserId, userType);
			// console.log("Chat history loaded:", chatHistory);
			
			// Only set firebaseRoomId if it's different from current
			if (chatHistory.roomId !== firebaseRoomId) {
				console.log("Setting new firebaseRoomId:", chatHistory.roomId);
			setFirebaseRoomId(chatHistory.roomId);
			}
			
			setMessages(chatHistory.messages || []);
			
			// Sync initial messages to Firebase for real-time updates
			if (chatHistory.messages && chatHistory.messages.length > 0) {
				await syncInitialMessagesToFirebase(chatHistory.messages);
			}
		} catch (error: any) {
			console.error("Failed to fetch chat history:", error?.response?.data || error);
			setMessages([]);
		} finally {
			setIsLoading(false);
		}
	}, [otherUserId, userType, session?.user.id, firebaseRoomId, syncInitialMessagesToFirebase]);

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
	 * Initialize Firebase chat room if it doesn't exist
	 */
	const initializeFirebaseRoom = useCallback(async () => {
		if (!firebaseRoomId || !session?.user.id) return;

		try {
			const roomRef = ref(database, `chats/${firebaseRoomId}`);
			const messagesRef = ref(database, `chats/${firebaseRoomId}/messages`);
			
			// Initialize room metadata
			await set(roomRef, {
				createdAt: serverTimestamp(),
				participants: {
					[session.user.id]: {
						lastSeen: serverTimestamp(),
						online: true
					}
				}
			});

			console.log("Firebase room initialized:", firebaseRoomId);
		} catch (error) {
			console.error("Failed to initialize Firebase room:", error);
		}
	}, [firebaseRoomId, session?.user.id]);

	/**
	 * Setup Firebase real-time listener with enhanced reliability
	 */
	const setupFirebaseListener = useCallback(async () => {
		if (!firebaseRoomId) {
			console.log("No firebaseRoomId, clearing messages");
			setMessages([]);
			setIsListenerActive(false);
			currentRoomIdRef.current = null;
			return;
		}

		// Check if we're already listening to this room
		if (currentRoomIdRef.current === firebaseRoomId && listenerRef.current) {
			console.log("Already listening to room:", firebaseRoomId);
			return;
		}

		// Clean up existing listener
		if (listenerRef.current) {
			console.log("Cleaning up existing Firebase listener");
			listenerRef.current();
			listenerRef.current = null;
		}

		// Clear any existing reconnect timeout
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
			reconnectTimeoutRef.current = null;
		}

		console.log("Setting up Firebase listener for room:", firebaseRoomId);
		currentRoomIdRef.current = firebaseRoomId;
		const messagesRef = ref(database, `chats/${firebaseRoomId}/messages`);
		
		// Debug: Check if the database reference is valid
		console.log("Database reference:", messagesRef);
		console.log("Database path:", `chats/${firebaseRoomId}/messages`);
		
		// Initialize the room first
		initializeFirebaseRoom();
		
		// Set up presence indicator
		const presenceRef = ref(database, `chats/${firebaseRoomId}/presence/${session?.user.id}`);
		onDisconnect(presenceRef).remove();
		
		// Use get() to fetch initial messages from Firebase
		try {
			const snapshot = await get(messagesRef);
			console.log("Initial Firebase snapshot received:", snapshot.exists());
			setIsListenerActive(true);
			
			if (snapshot.exists()) {
				const firebaseMessages = snapshot.val();
				console.log("Firebase messages found:", Object.keys(firebaseMessages).length);
				
				const messageList = Object.entries(firebaseMessages)
					.map(([id, msg]: [string, unknown]) => ({
						id,
						...(msg as Omit<Message, "id">),
					}))
					.sort((a, b) => 
						new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
					);

				console.log("Initial Firebase messages loaded:", messageList.length);
				setMessages(messageList);
			} else {
				console.log("No messages in Firebase initially");
				setMessages([]);
			}
		} catch (error) {
			console.error("Firebase initial fetch error:", error);
			setMessages([]);
		}

		// Then, use onChildAdded to listen for new messages only
		const newMessageUnsubscribe = onChildAdded(messagesRef, (snapshot) => {
			console.log("New message received from Firebase:", snapshot.key);
			
			if (snapshot.exists()) {
				const newMessage = snapshot.val();
				console.log("New message data:", newMessage);
				
				// Add the new message to the existing messages
				setMessages(prev => {
					// Check if message already exists to avoid duplicates
					const messageExists = prev.some(msg => msg.id === newMessage.id);
					if (messageExists) {
						console.log("Message already exists, skipping");
						return prev;
					}
					
					// Add new message and sort by timestamp
					const updatedMessages = [...prev, {
						id: newMessage.id,
						message: newMessage.message,
						createdAt: newMessage.createdAt,
						senderId: newMessage.senderId,
						chatRoomId: newMessage.chatRoomId,
						messageType: newMessage.messageType,
						imageUrl: newMessage.imageUrl,
					}].sort((a, b) => 
						new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
					);
					
					console.log("Updated messages list:", updatedMessages.length);
					return updatedMessages;
				});
			}
		}, (error) => {
			console.error("Firebase new message listener error:", error);
			setIsListenerActive(false);
			
			// Attempt to reconnect after a short delay
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
			}
			reconnectTimeoutRef.current = setTimeout(async () => {
				console.log("Attempting to reconnect Firebase listener...");
				await setupFirebaseListener();
			}, 2000);
		});

		// Store the unsubscribe function
		listenerRef.current = () => {
			console.log("Cleaning up Firebase listener");
			off(messagesRef);
			newMessageUnsubscribe();
			setIsListenerActive(false);
			currentRoomIdRef.current = null;
		};

		return () => {
			newMessageUnsubscribe();
		};
	}, [firebaseRoomId, session?.user.id, initializeFirebaseRoom]);

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
				const response = await sendMessage(messageData);
				console.log("Message sent to backend:", response);

				// Remove temporary message and let Firebase listener add the real message
				setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));

				// Store in Firebase for real-time updates
				if (firebaseRoomId) {
					// Create clean message object without undefined values
					const firebaseMessage: any = {
						id: response.id,
						message: messageText,
						createdAt: response.createdAt,
						senderId: response.senderId,
						chatRoomId: firebaseRoomId,
					};

					// Only add optional fields if they exist
					if (response.messageType) {
						firebaseMessage.messageType = response.messageType;
					}
					if (response.imageUrl) {
						firebaseMessage.imageUrl = response.imageUrl;
					}

					// Use push() to add new message to Firebase
					const newMessageRef = push(ref(database, `chats/${firebaseRoomId}/messages`));
					await set(newMessageRef, firebaseMessage);
					
					console.log("Message stored in Firebase:", response.id);
				}


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
	 * Send an image message
	 */
	const sendImageMessage = useCallback(
		async (imageFile: File | any, partnerId: string) => {
			if (!partnerId || !session?.user) {
				return;
			}

			try {
				// Send image to backend
				const response = await sendImage(imageFile, partnerId);
				console.log("Image sent to backend:", response);

				// Store in Firebase for real-time updates
				if (firebaseRoomId) {
					// Create clean message object without undefined values
					const firebaseMessage: any = {
						id: response.id,
						message: response.message,
						createdAt: response.createdAt,
						senderId: response.senderId,
						chatRoomId: firebaseRoomId,
					};

					// Only add optional fields if they exist
					if (response.messageType) {
						firebaseMessage.messageType = response.messageType;
					}
					if (response.imageUrl) {
						firebaseMessage.imageUrl = response.imageUrl;
					}

					// Use push() to add new message to Firebase
					const newMessageRef = push(ref(database, `chats/${firebaseRoomId}/messages`));
					await set(newMessageRef, firebaseMessage);
					
					console.log("Image stored in Firebase:", response.id);
				}

				// Reload chat history to show the new message
				loadChatHistory();
			} catch (error) {
				console.error("Failed to send image:", error);
				Alert.alert("Error", "Failed to send image. Please try again.");
				throw error;
			}
		},
		[firebaseRoomId, session?.user, loadChatHistory],
	);

	/**
	 * Setup Firebase real-time listener
	 */
	useEffect(() => {
		setupFirebaseListener();

		return () => {
			if (listenerRef.current) {
				listenerRef.current();
			}
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
			}
		};
	}, [setupFirebaseListener]);

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
		sendImageMessage,
		chatRooms,
		loadChatHistory,
		loadChatRooms,
	};
}