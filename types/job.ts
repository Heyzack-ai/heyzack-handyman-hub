export type JobStatus = 
  | "pending"
  | "scheduled" 
  | "stock_collected" 
  | "en_route" 
  | "started" 
  | "completed"
  | "declined"
  | "sent"
  | "not_sent";

export type JobType = "booked_installation" | "job_request";

export type Product = {
  id: string;
  name: string;
  image: string;
  description: string;
  isCollected: boolean;
  isInstalled: boolean;
  manualUrl?: string;
  specifications?: string[];
  toolsRequired?: string[];
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  customer_name: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
};

export interface Job {
  id: string;
  title: string;
  description: string;
  status: JobStatus;
  scheduled_date: string;
  scheduledTime: string;
  duration: string;
  customer: Customer;
  products: Product[];
  notes?: string[];
  installationPhotos?: string[];
  contractSent?: boolean;
  rating?: number;
  type: JobType;
  paymentRequested?: boolean;
  paymentReceived?: boolean;
  paymentDate?: string;
  amount?: string;
  completedDate?: string;
}
