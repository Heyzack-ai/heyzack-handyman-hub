import serverClient from "./partner-client";

export interface Message {
	id: string;
	createdAt: string;
	chatRoomId: string;
	senderId: string;
	message: string;
	messageType?: string;
	imageUrl?: string;
}

export interface ChatHistory {
	messages: Message[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
	roomId: string;
}

export interface ChatParticipant {
	id: string;
	name: string;
	email: string;
	lastSeen?: number;
}

export interface SendMessageRequest {
	message: string;
	partnerId?: string;
	handymanId?: string;
}

export interface SendMessageResponse {
	id: string;
	roomId: string;
	message: string;
	createdAt: string;
	senderId: string;
	messageType?: string;
	imageUrl?: string;
}

export interface ChatRoom {
	roomId: string;
	otherUser: {
		id: string;
		name: string;
		email: string;
		type: "partner" | "handyman";
	};
	lastMessage?: Message;
	lastActivity: string;
	unreadCount: number;
}

export interface FirebaseTokenResponse {
	token: string;
	userId: string;
}

/**
 * Fetch chat history with a specific user
 */
export const getChatHistory = async (
	otherUserId: string,
	userType: "partner" | "handyman",
	page = 1,
	limit = 50,
): Promise<ChatHistory> => {
	const queryParam = userType === "partner" ? "partnerId" : "handymanId";
	console.log("queryParam", otherUserId);
	const response = await serverClient.get<{ data: ChatHistory }>(
		"/chat/history",
		{
			params: {
				[queryParam]: otherUserId,
				page,
				limit,
			},
		},
	);
	return response.data.data;
};

/**
 * Send a message to a user
 */
export const sendMessage = async (
	messageData: SendMessageRequest,
): Promise<SendMessageResponse> => {
	const response = await serverClient.post<{ data: SendMessageResponse }>(
		"/chat/send",
		messageData,
	);
	return response.data.data;
};

/**
 * Get all chat rooms for the current user
 */
export const getChatRooms = async (): Promise<ChatRoom[]> => {
	const response = await serverClient.get<{ data: { rooms: ChatRoom[] } }>(
		"/chat/rooms",
	);
	return response.data.data.rooms;
};

/**
 * Get Firebase token for real-time database authentication
 */
export const getFirebaseToken = async (): Promise<FirebaseTokenResponse> => {
	const response = await serverClient.get<{ data: FirebaseTokenResponse }>(
		"/chat/firebase-token",
	);
	return response.data.data;
};

/**
 * Mark messages as read in a chat room
 */
export const markMessagesAsRead = async (
	roomId: string,
	messageIds: string[],
): Promise<void> => {
	await serverClient.post(`/chat/read/${roomId}`, {
		messageIds,
	});
};

/**
 * Get unread message count for all chat rooms
 */
export const getUnreadCount = async (): Promise<number> => {
	const response = await serverClient.get<{ data: { count: number } }>(
		"/chat/unread-count",
	);
	return response.data.data.count;
};

// export const sendImage = async (
// 	imageFile: File | any,
// 	partnerId: string,
// ): Promise<SendMessageResponse> => {
// 	const formData = new FormData();
	
// 	// Handle both web File objects and React Native file-like objects
// 	if (imageFile.uri) {
// 		// React Native file object
// 		formData.append('image', imageFile as any);
// 	} else {
// 		// Web File object
// 		formData.append('image', imageFile);
// 	}
	
// 	formData.append('partnerId', partnerId);

// 	console.log("formData", formData?.get('image'));

// 	const response = await serverClient.post< SendMessageResponse >(
// 		"/chat/upload-image",
// 		formData,
// 		{
// 			headers: {
// 				'Content-Type': undefined, // Let axios set the proper multipart/form-data with boundary
// 			},
// 		},
// 	);

// 	return response.data;
// };
export const sendImage = async (
	imageFile: File | any,
	partnerId: string,
): Promise<SendMessageResponse> => {
	const formData = new FormData();
	
	// Handle both web File objects and React Native file-like objects
	if (imageFile.uri) {
		// React Native file object
		formData.append('image', {
			uri: imageFile.uri,
			type: imageFile.type || 'image/jpeg',
			name: imageFile.name || 'image.jpg',
		} as any);
	} else {
		// Web File object
		formData.append('image', imageFile);
	}
	
	formData.append('partnerId', partnerId);

	console.log("formData", formData?.get('image'));

	try {
		const response = await serverClient.post<{
			message: string;
			data: SendMessageResponse;
		}>(
			"/chat/upload-image",
			formData,
			{
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			},
		);

		console.log("Server response:", response.data);

		// Return the data with the missing 'message' property
		return {
			...response.data.data,
			message: '', // Add empty message property for image messages
		};
	} catch (error) {
		console.error("Error uploading image:", error);
		throw error;
	}
};
/**
 * Delete a message from a chat room
 */
export const deleteMessage = async (
	roomId: string,
	messageId: string,
): Promise<void> => {
	await serverClient.delete(`/chat/message/${roomId}/${messageId}`);
};

/**
 * Update user's last seen timestamp for a chat room
 */
export const updateLastSeen = async (roomId: string): Promise<void> => {
	await serverClient.post(`/chat/last-seen/${roomId}`);
};