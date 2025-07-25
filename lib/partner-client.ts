import axios from "axios";
import * as SecureStore from "expo-secure-store";

export interface Partner {
	/** name is ID in ERP */
	name: string;
	partner_name: string;
	email: string;
	phone: string;
}


const serverClient = axios.create({
	baseURL: `${process.env.EXPO_PUBLIC_API_URL}`,
	headers: {
		"Content-Type": "application/json",
	},
});

// Add request interceptor to add auth token
serverClient.interceptors.request.use(async (config) => {
	const token = await SecureStore.getItemAsync("auth_token");	
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

export const sendInviteLink = async (partnerId: string): Promise<void> => {
	await serverClient.post("/user/send-invite-link", {
		partner_id: partnerId,
	});
};

export async function getPartners(partner_id: string): Promise<Partner[]> {
	const params = {
		fields: JSON.stringify([
			"name",
			"partner_name",
			"email",
			"phone",
		]),	
		filters: JSON.stringify([["partner", "=", partner_id]]),
	};

	const response = await serverClient.get<{
		data: Partner[];
	}>("/erp/resource/Installation Partner", { params });

	return response.data.data;
}

export async function getAssignedPartners(partner_id: string): Promise<Partner[]> {
	const params = {
		fields: JSON.stringify([
			"name",
			"partner_name",
			"email",
			"phone",
		]),	
		filters: JSON.stringify([["partner", "=", partner_id]]),
	};

	const response = await serverClient.get<{
		data: Partner[];
	}>("/erp/resource/Installation Partner", { params });

	return response.data.data;
}

export const getUnassignedPartners = async (): Promise<Partner[]> => {
	const response = await serverClient.get<{
		data: Partner[];
	}>("/erp/resource/Installation Partner", {
		params: {
			filters: JSON.stringify([["partner", "=", "None"]]),
			fields: JSON.stringify([
				"name",
				"partner_name",
				"email",
				"phone",
			]),
		},
	});

	return response.data.data;
};

export const getPartner = async (id: string): Promise<Partner> => {
	const response = await serverClient.get<{
		data: Partner;
	}>(`/erp/resource/Installation Partner/${id}`);

	return {
		...response.data.data,
	};
};

export const createPartner = async (
	data: Partner,
): Promise<Partner> => {
	const response = await serverClient.post("/erp/resource/Installation Partner", data);
	return response.data.data;
};

export const updatePartner = async (
	id: string,
	data: Partial<Partner>,
): Promise<Partner> => {
	const response = await serverClient.put<{
		data: Partner;
	}>(`/erp/resource/Installation Partner/${id}`, data);

	return {
		...response.data.data,
	};
};

export const deletePartner = async (id: string): Promise<void> => {
	await serverClient.delete(`/erp/resource/Installation Partner/${id}`);
};

export default serverClient;