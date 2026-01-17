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
	adminId?: string;
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
		type: "partner" | "handyman" | "admin";
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
	userType: "partner" | "handyman" | "admin",
	page = 1,
	limit = 50,
): Promise<ChatHistory> => {
	let queryParam: string;
	if (userType === "partner") {
		queryParam = "partnerId";
	} else if (userType === "admin") {
		queryParam = "adminId";
	} else {
		queryParam = "handymanId";
	}
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
	const response = await serverClient.get<{ data: { rooms: ChatRoom[] } } | { data: ChatRoom[] }>(
		"/chat/rooms",
	);
	console.log("Chat Rooms API Response:", JSON.stringify(response.data, null, 2));
	
	// Handle different response structures
	let rooms: ChatRoom[] = [];
	if (response.data) {
		if (Array.isArray(response.data)) {
			rooms = response.data;
		} else if ((response.data as any).rooms && Array.isArray((response.data as any).rooms)) {
			rooms = (response.data as any).rooms;
		} else if ((response.data as any).data?.rooms && Array.isArray((response.data as any).data.rooms)) {
			rooms = (response.data as any).data.rooms;
		}
	}
	
	console.log("Parsed Chat Rooms:", rooms.length, "rooms");
	rooms.forEach((room, index) => {
		console.log(`Room ${index + 1}:`, {
			roomId: room.roomId,
			otherUserId: room.otherUser?.id,
			otherUserName: room.otherUser?.name,
			unreadCount: room.unreadCount,
		});
	});
	return rooms;
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
	const response = await serverClient.get<{ data: { count: number } } | { data: number } | { count: number }>(
		"/chat/unread-count",
	);
	console.log("Unread Count API Response:", JSON.stringify(response.data, null, 2));
	
	// Handle different response structures
	let count = 0;
	if (response.data) {
		if (typeof response.data === 'number') {
			count = response.data;
		} else if ((response.data as any).count !== undefined) {
			count = (response.data as any).count;
		} else if ((response.data as any).data) {
			if (typeof (response.data as any).data === 'number') {
				count = (response.data as any).data;
			} else if ((response.data as any).data?.count !== undefined) {
				count = (response.data as any).data.count;
			}
		}
	}
	
	console.log("Parsed Unread Count:", count);
	return count;
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
	recipientId: string,
	recipientType: "partner" | "admin" = "partner",
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
	
	// Append the appropriate ID parameter based on recipient type
	if (recipientType === "admin") {
		formData.append('adminId', recipientId);
	} else {
		formData.append('partnerId', recipientId);
	}

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

/**
 * Get chat connections (partners, handymen, admin)
 */
export interface ChatConnection {
	id: string;
	name: string;
	email: string;
	image?: string | null;
	phone?: string | null;
	availability_status?: string;
	rating?: string;
}

export interface ChatConnectionsResponse {
	connections: ChatConnection[];
	role: "handyman" | "partner" | "admin";
}

export const getChatConnections = async (): Promise<ChatConnectionsResponse> => {
	const response = await serverClient.get<{ data: ChatConnectionsResponse }>(
		"/chat/connections",
	);
	return response.data.data;
};