export type JobStatus = 
  | "pending"
  | "scheduled" 
  | "stock_collected" 
  | "en_route" 
  | "started" 
  | "completed"
  | "declined";

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
  coordinates?: {
    latitude: number;
    longitude: number;
  };
};

export type Job = {
  id: string;
  title: string;
  description: string;
  scheduledDate: string;
  scheduledTime: string;
  status: JobStatus;
  type: JobType;
  customer: Customer;
  products: Product[];
  notes?: string[];
  installationPhotos?: string[];
  contractSent: boolean;
};