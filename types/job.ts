export type JobStatus = 
  | "pending"
  | "scheduled" 
  | "stock_collected"   
  | "en_route" 
  | "started" 
  | "completed"
  | "declined"
  | "sent"
  |"job_request"
  |"accepted"
  | "not_sent"
  | "contract_sent"
  | "draft"
  | "contract_signed"
  | "job_started"
  | "job_completed"
  | "job_approved"
  | "customer_approved"
  | "assigned";



export type JobType = "booked_installation" | "job_request";

export type Product = {
  sku: any;
  inventorycode: string;
  id: string;
  name: string;
  item: string;
  item_name: string;
  image: string;
  description: string;
  isCollected: boolean;
  isInstalled: boolean;
  manualUrl?: string;
  installation_guide?: string;
  specifications?: string[];
  toolsRequired?: string[];
  quantity?: number;
  status?: string;
};

export type Stock = {
  item: string;
  quantity: number;
};

export type Customer = {
  id: string;
  name?: string;
  phone: string;
  email: string;
  address: string;
  customer_name: string;
  tuyaEmail?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
};

export interface Job {
  installation: any;
  installationPhotos: string[];
  id: string;
  name?: string;
  title: string;
  description: string;
  status: JobStatus;
  scheduled_date: string;
  scheduledTime: string;
  duration: string;
  customer: Customer;
  products: Product[];
  notes?: string[];
  completion_photos?: CompletionPhoto[];
  contractsent?: boolean;
  rating?: number;
  type: JobType;
  paymentRequested?: boolean;
  paymentReceived?: boolean;
  paymentDate?: string;
  amount?: string;
  completedDate?: string;
  partner?: string;
}

export interface CompletionPhoto {
  id: string;
  name: string;
  image: string;
  installation: string;
}
