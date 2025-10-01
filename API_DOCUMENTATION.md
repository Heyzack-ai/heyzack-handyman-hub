# HeyZack Handyman Hub - API Documentation

## Overview
This document outlines all the APIs currently implemented in the HeyZack Handyman Hub application. These APIs were previously integrated with an ERP system and need to be migrated to a Node.js backend.

## Base Configuration
- **Base URL**: `process.env.EXPO_PUBLIC_API_URL`
- **Pending URL**: `process.env.EXPO_PUBLIC_PENDING_URL`
- **Authentication**: Bearer Token (stored in SecureStore as 'auth_token')
- **Content-Type**: `application/json`

---

## 1. Authentication APIs

### 1.1 Authentication Handler
- **File**: `app/api/auth/[...auth]+api.ts`
- **Endpoint**: `/api/auth/*`
- **Methods**: GET, POST
- **Description**: Handles authentication using Better Auth
- **Usage**: Exported from `@/lib/auth` for authentication flow

**Request Structure:**
```typescript
// Authentication requests are handled by Better Auth
// Common endpoints include:
// POST /api/auth/sign-in
// POST /api/auth/sign-up
// POST /api/auth/sign-out
// GET /api/auth/session
```

**Response Structure:**
```typescript
// Session response
{
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      emailVerified: boolean;
      createdAt: Date;
      updatedAt: Date;
      image?: string | null;
      erpId?: string;
    };
    session: {
      id: string;
      userId: string;
      expiresAt: Date;
      token: string;
    };
  };
}
```

---

## 2. Job Management APIs

### 2.1 Get Jobs
- **File**: `app/api/jobs/getJobs.ts`
- **Hook**: `useGetJobs()`
- **Endpoint**: `/handyman/jobs`
- **Method**: GET
- **Description**: Fetches jobs for the authenticated handyman
- **Usage**: Used in job listing screens

**Request Structure:**
```typescript
// Headers
{
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

**Response Structure:**
```typescript
{
  data: Job[];
}

interface Job {
  installationPhotos: string[];
  id: string;
  name: string;
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
```

### 2.2 Get Pending Jobs
- **File**: `app/api/jobs/getPendingJobs.ts`
- **Hook**: `useGetPendingJobs()`
- **Endpoint**: `/handyman/jobs/pending`
- **Method**: GET
- **Description**: Fetches pending jobs for the handyman
- **Usage**: Used for pending job notifications

**Request Structure:**
```typescript
// Headers
{
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

**Response Structure:**
```typescript
{
  data: Job[]; // Jobs with status "pending"
}
```

### 2.3 Get Job by ID
- **File**: `app/api/jobs/getJobById.ts`
- **Hook**: `useGetJobById(jobId)`
- **Endpoint**: `/handyman/jobs/{jobId}`
- **Method**: GET
- **Description**: Fetches specific job details by ID
- **Usage**: Used in job detail screens

**Request Structure:**
```typescript
// URL Parameters
jobId: string

// Headers
{
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

**Response Structure:**
```typescript
{
  data: Job;
}
```

### 2.4 Accept Job
- **File**: `app/api/jobs/acceptJob.ts`
- **Hook**: `useAcceptJob()`
- **Endpoint**: `/handyman/jobs/{jobId}/response`
- **Method**: POST
- **Description**: Accept or reject a job
- **Usage**: Used in job acceptance flow

**Request Structure:**
```typescript
// URL Parameters
jobId: string

// Request Body
{
  status: "accepted" | "declined";
}

// Headers
{
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

**Response Structure:**
```typescript
{
  success: boolean;
  message: string;
  data?: any;
}
```

### 2.5 Update Job Status
- **File**: `app/api/jobs/updateStatus.ts`
- **Hook**: `useUpdateJobStatus()`
- **Endpoint**: `/erp/resource/Installation/{jobId}`
- **Method**: PUT
- **Description**: Updates job status in ERP system
- **Usage**: Used throughout job workflow

**Request Structure:**
```typescript
// URL Parameters
jobId: string

// Request Body
{
  status: JobStatus;
}

// Headers
{
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
}

type JobStatus = 
  | "pending"
  | "scheduled" 
  | "stock collected" 
  | "en_route" 
  | "started" 
  | "completed"
  | "declined"
  | "sent"
  | "not_sent"
  | "Contract Sent";
```

**Response Structure:**
```typescript
{
  data: {
    name: string;
    status: JobStatus;
    modified: string;
  };
}
```

### 2.6 Completion Photos
- **File**: `app/api/jobs/getCompletionPhoto.ts`
- **Hook**: `useUpdateCompletionPhoto()`
- **Endpoint**: `/erp/upload` + `/erp/resource/Installation/{jobId}`
- **Method**: POST + PUT
- **Description**: Upload completion photos and update job
- **Usage**: Used in job completion flow

**Request Structure:**
```typescript
// Step 1: Upload file
// POST /erp/upload
FormData {
  file: {
    uri: string;
    name: string;
    type: "image/jpeg" | "image/png" | "application/pdf";
  };
  is_private: "1";
}

// Step 2: Update Installation record
// PUT /erp/resource/Installation/{jobId}
{
  completion_photos: CompletionPhoto[];
}

// Headers for both requests
{
  Authorization: `Bearer ${token}`,
  'Content-Type': 'multipart/form-data' | 'application/json'
}
```

**Response Structure:**
```typescript
// Upload response
{
  data: {
    message: {
      file_url: string;
      file_name: string;
    };
  };
}

// Update response
{
  data: {
    name: string;
    completion_photos: CompletionPhoto[];
    modified: string;
  };
}

interface CompletionPhoto {
  id: string;
  name: string;
  image: string;
  installation: string;
}
```

---

## 3. Customer APIs

### 3.1 Get Customer
- **File**: `app/api/customer/getCustomer.ts`
- **Hook**: `useGetCustomer(customerId)`
- **Endpoint**: `/erp/resource/Customer/{customerId}`
- **Method**: GET
- **Description**: Fetches customer details from ERP system
- **Usage**: Used in job details and customer information screens

**Request Structure:**
```typescript
// URL Parameters
customerId: string

// Query Parameters
{
  filter: string; // JSON stringified filter array
  fields: string; // JSON stringified fields array
}

// Headers
{
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

**Response Structure:**
```typescript
{
  data: Customer[];
}

interface Customer {
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
}
```

---

## 4. Product APIs

### 4.1 Get Product
- **File**: `app/api/product/getProduct.ts`
- **Hook**: `useGetProduct(productId)`
- **Endpoint**: `/erp/resource/Item/{productId}`
- **Method**: GET
- **Description**: Fetches product details from ERP system
- **Usage**: Used in product information screens

**Request Structure:**
```typescript
// URL Parameters
productId: string

// Headers
{
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

**Response Structure:**
```typescript
{
  data: Product;
}

interface Product {
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
}
```

### 4.2 Get Stock
- **File**: `app/api/product/getStock.ts`
- **Hook**: `useGetStock(productId)`
- **Endpoint**: `/erp/resource/Bin`
- **Method**: GET
- **Description**: Fetches product stock information
- **Usage**: Used in stock collection workflow

**Request Structure:**
```typescript
// Query Parameters
{
  filter: string; // `[["item_code", "=", "${productId}"]]`
  fields: string; // `["item_code", "actual_qty", "warehouse"]`
}

// Headers
{
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

**Response Structure:**
```typescript
{
  data: Stock[];
}

interface Stock {
  item: string;
  quantity: number;
}

// Default response if no stock found
{
  item: string;
  quantity: 0;
}
```

### 4.3 Update Product Collection
- **File**: `app/api/product/getProduct.ts`
- **Hook**: `useUpdateProductCollect()`
- **Endpoint**: `/erp/upload` + `/erp/resource/Item/{productId}`
- **Method**: POST + PUT
- **Description**: Upload product collection photos and update status
- **Usage**: Used in stock collection workflow

**Request Structure:**
```typescript
// Step 1: Upload file
// POST /erp/upload
FormData {
  file: {
    uri: string;
    name: string;
    type: "image/jpeg" | "image/png" | "application/pdf";
  };
  is_private: "1";
}

// Step 2: Update Item record
// PUT /erp/resource/Item/{productId}
{
  collection_photos?: string[];
  status?: string;
}

// Headers for both requests
{
  Authorization: `Bearer ${token}`,
  'Content-Type': 'multipart/form-data' | 'application/json'
}
```

**Response Structure:**
```typescript
// Upload response
{
  data: {
    message: {
      file_url: string;
      file_name: string;
    };
  };
}

// Update response
{
  data: {
    name: string;
    collection_photos?: string[];
    status?: string;
    modified: string;
  };
}
```

---

## 5. User Management APIs

### 5.1 Get User
- **File**: `app/api/user/getUser.ts`
- **Hooks**: `useGetUser()`, `useGetUserMinimal()`, `useGetUserRealtime()`, `useUpdateUser()`
- **Endpoint**: `/erp/resource/Handyman/{erpId}`
- **Methods**: GET, PUT
- **Description**: Fetch and update handyman user data
- **Usage**: Used throughout the app for user information

**Request Structure:**
```typescript
// GET Request
// Headers
{
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
}

// PUT Request (Update User)
// Request Body
{
  handyman_name?: string;
  contact_number?: string;
  email?: string;
  current_location?: string;
  service_area?: number;
  skills?: string;
  // ... other handyman fields
}
```

**Response Structure:**
```typescript
{
  data: Handyman;
}

interface Handyman {
  availability: Availability[];
  availability_status: string;
  bank_details: BankDetail[];
  contact_number: string;
  creation: string;
  current_location: string;
  docstatus: number;
  doctype: string;
  email: string;
  handyman_name: string;
  idx: number;
  modified: string;
  modified_by: string;
  name: string;
  owner: string;
  service_area: number;
  skills: string;
  kyc_document: string;
  profile_image: string;
  is_verified: number;
  rating: number;
  jobs_completed: number;
  partner: string;
}
```

### 5.2 Add Service Area
- **File**: `app/api/user/addArea.ts`
- **Hooks**: `useAddArea()`, `useGetArea()`
- **Endpoint**: `/erp/resource/Handyman/{erpId}`
- **Methods**: PUT, GET
- **Description**: Update and fetch handyman service area and location
- **Usage**: Used in profile and location settings

**Request Structure:**
```typescript
// PUT Request
// Request Body
{
  service_area: number;
  current_location: string;
}

// Headers
{
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

**Response Structure:**
```typescript
{
  data: {
    name: string;
    service_area: number;
    current_location: string;
    modified: string;
  };
}
```

### 5.3 Bank Management
- **File**: `app/api/user/addBank.ts`
- **Hooks**: `useAddBank()`, `useDeleteBank()`, `useGetBank()`, `useSetDefaultBank()`
- **Endpoint**: `/erp/resource/Handyman/{erpId}`
- **Method**: PUT
- **Description**: Manage handyman bank details
- **Usage**: Used in payment and banking settings

**Request Structure:**
```typescript
// Add Bank
{
  bank_details: BankDetail[];
}

// Delete Bank
{
  bank_details: BankDetail[]; // Array without the deleted bank
}

// Set Default Bank
{
  bank_details: BankDetail[]; // Array with updated is_default values
}

interface BankDetail {
  account_holder_name: string;
  bank_name: string;
  bic_code: string;
  iban_number: string;
  is_default: string;
  type: string;
}

// Headers
{
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

**Response Structure:**
```typescript
{
  data: {
    name: string;
    bank_details: BankDetail[];
    modified: string;
  };
}
```

### 5.4 Skills Management
- **File**: `app/api/user/addskills.ts`
- **Hooks**: `useAddSkills()`, `useGetSkills()`
- **Endpoint**: `/erp/resource/Handyman/{erpId}`
- **Methods**: PUT, GET
- **Description**: Manage handyman skills
- **Usage**: Used in profile and skills settings

**Request Structure:**
```typescript
// Add Skills
{
  skills: string; // JSON stringified skills object
}

// Skills format
{
  skills: Array<{
    name: string;
  }>;
}

// Headers
{
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

**Response Structure:**
```typescript
{
  data: {
    name: string;
    skills: string;
    modified: string;
  };
}
```

### 5.5 Partner Management
- **File**: `app/api/user/getPartner.ts`
- **Hooks**: `useGetPartner()`, `useGetPartnerById()`, `useGetUnassignedPartners()`
- **Endpoint**: `/erp/resource/Installation Partner`
- **Method**: GET
- **Description**: Fetch partner information
- **Usage**: Used in partner management screens

**Request Structure:**
```typescript
// Query Parameters
{
  filter: string; // `[["partner_code", "=", "${partnerCode}"]]` or `[["name", "=", "${name}"]]`
  fields: string; // `["name", "partner_name", "partner_code", "contact_person", "email", "phone", "address"]`
}

// Headers
{
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

**Response Structure:**
```typescript
{
  data: Partner[];
}

interface Partner {
  name: string;
  partner_name?: string;
  partner_code?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
}
```

### 5.6 Link Partner
- **File**: `app/api/user/linkPartner.ts`
- **Hook**: `useLinkPartner()`
- **Endpoint**: `/user/link-handyman-to-partner`
- **Method**: POST
- **Description**: Link handyman to a partner
- **Usage**: Used in partner linking workflow

**Request Structure:**
```typescript
// Request Body
{
  partner_code: string;
}

// Headers
{
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

**Response Structure:**
```typescript
{
  success: boolean;
  message: string;
  data?: any;
}
```

### 5.7 Document Upload
- **File**: `app/api/user/addDocument.ts`
- **Hook**: `useUploadKycDocument()`
- **Endpoint**: `/erp/upload` + `/erp/resource/Handyman/{erpId}`
- **Method**: POST + PUT
- **Description**: Upload KYC documents
- **Usage**: Used in document verification workflow

**Request Structure:**
```typescript
// Step 1: Upload file
// POST /erp/upload
FormData {
  file: {
    uri: string;
    name: string;
    type: "image/jpeg" | "image/png" | "application/pdf";
  };
  is_private: "1";
}

// Step 2: Update Handyman record
// PUT /erp/resource/Handyman/{erpId}
{
  kyc_document: string; // file URL from upload response
}

// Headers
{
  Authorization: `Bearer ${token}`,
  'Content-Type': 'multipart/form-data' | 'application/json'
}
```

**Response Structure:**
```typescript
// Upload response
{
  data: {
    message: {
      file_url: string;
      file_name: string;
    };
  };
}

// Update response
{
  data: {
    name: string;
    kyc_document: string;
    modified: string;
  };
}
```

### 5.8 Profile Image Upload
- **File**: `app/api/user/addProfileImage.ts`
- **Hook**: `useUploadProfileImage()`
- **Endpoint**: `/erp/upload` + `/erp/resource/Handyman/{erpId}`
- **Method**: POST + PUT
- **Description**: Upload profile images
- **Usage**: Used in profile management

**Request Structure:**
```typescript
// Step 1: Upload file
// POST /erp/upload
FormData {
  file: {
    uri: string;
    name: string;
    type: "image/jpeg" | "image/png";
  };
  is_private: "0"; // Public for profile images
}

// Step 2: Update Handyman record
// PUT /erp/resource/Handyman/{erpId}
{
  profile_image: string; // file URL from upload response
}

// Headers
{
  Authorization: `Bearer ${token}`,
  'Content-Type': 'multipart/form-data' | 'application/json'
}
```

**Response Structure:**
```typescript
// Upload response
{
  data: {
    message: {
      file_url: string;
      file_name: string;
    };
  };
}

// Update response
{
  data: {
    name: string;
    profile_image: string;
    modified: string;
  };
}
```

### 5.9 Availability Management
- **File**: `app/api/user/addAvailability.ts`
- **Hooks**: `useAddAvailability()`, `useGetAvailability()`
- **Endpoint**: `/erp/resource/Handyman/{erpId}`
- **Methods**: PUT, GET
- **Description**: Manage handyman availability schedule
- **Usage**: Used in availability settings

**Request Structure:**
```typescript
// PUT Request
// Request Body
{
  availability: Array<{
    day: string;
    start_time: string;
    end_time: string;
    is_active: boolean;
  }>;
}

// Input format (WeekSchedule)
interface WeekSchedule {
  [key: string]: DaySchedule;
}

interface DaySchedule {
  enabled: boolean;
  startTime: string; // "HH:MM" format
  endTime: string;   // "HH:MM" format
}

// Headers
{
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

**Response Structure:**
```typescript
{
  data: {
    name: string;
    availability: Availability[];
    modified: string;
  };
}

interface Availability {
  creation: string;
  day: string;
  docstatus: number;
  doctype: string;
  end_time: string;
  idx: number;
  is_active: number;
  modified: string;
  modified_by: string;
  name: string;
  owner: string;
  parent: string;
  parentfield: string;
  parenttype: string;
  start_time: string;
}
```

---

## 6. Common Patterns

### 6.1 Authentication Flow
All APIs follow this pattern:
1. Get token from SecureStore: `await SecureStore.getItemAsync('auth_token')`
2. Get user session: `await authClient.getSession()`
3. Extract erpId from user data
4. Make authenticated request with Bearer token

### 6.2 Error Handling
- Consistent error throwing with descriptive messages
- Console logging for debugging
- Fallback values for non-critical failures (e.g., stock quantities)

### 6.3 File Upload Pattern
1. Create FormData with file details
2. Upload to `${BASE_URL}/erp/upload`
3. Extract file_url from response
4. Update relevant resource with file URL

### 6.4 Query Configuration
- Uses React Query for caching and state management
- Stale time: 5 minutes for most queries
- Enabled conditions based on required parameters
- Real-time variants with shorter stale times

---

## 7. TypeScript Interfaces and Data Models

### 7.1 Core Interfaces

```typescript
// User/Handyman Interface
interface Handyman {
  availability: Availability[];
  availability_status: string;
  bank_details: BankDetail[];
  contact_number: string;
  creation: string;
  current_location: string;
  docstatus: number;
  doctype: string;
  email: string;
  handyman_name: string;
  idx: number;
  modified: string;
  modified_by: string;
  name: string;
  owner: string;
  service_area: number;
  skills: string;
  kyc_document: string;
  profile_image: string;
  is_verified: number;
  rating: number;
  jobs_completed: number;
  partner: string;
}

// Job Interface
interface Job {
  installationPhotos: string[];
  id: string;
  name: string;
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

// Customer Interface
interface Customer {
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
}

// Product Interface
interface Product {
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
}

// Stock Interface
interface Stock {
  item: string;
  quantity: number;
}

// Partner Interface
interface Partner {
  name: string;
  partner_name?: string;
  partner_code?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
}
```

### 7.2 Supporting Interfaces

```typescript
// Bank Detail Interface
interface BankDetail {
  account_holder_name: string;
  bank_name: string;
  bic_code: string;
  iban_number: string;
  is_default: string;
  type: string;
}

// Availability Interface
interface Availability {
  creation: string;
  day: string;
  docstatus: number;
  doctype: string;
  end_time: string;
  idx: number;
  is_active: number;
  modified: string;
  modified_by: string;
  name: string;
  owner: string;
  parent: string;
  parentfield: string;
  parenttype: string;
  start_time: string;
}

// Week Schedule Interface
interface WeekSchedule {
  [key: string]: DaySchedule;
}

interface DaySchedule {
  enabled: boolean;
  startTime: string; // "HH:MM" format
  endTime: string;   // "HH:MM" format
}

// Completion Photo Interface
interface CompletionPhoto {
  id: string;
  name: string;
  image: string;
  installation: string;
}

// Job Status Types
type JobStatus = 
  | "pending"
  | "scheduled" 
  | "stock collected" 
  | "en_route" 
  | "started" 
  | "completed"
  | "declined"
  | "sent"
  | "not_sent"
  | "Contract Sent";

type JobType = string; // Define specific job types as needed
```

### 7.3 API Response Interfaces

```typescript
// Generic API Response
interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

// File Upload Response
interface FileUploadResponse {
  data: {
    message: {
      file_url: string;
      file_name: string;
    };
  };
}

// Job Status Update Response
interface JobStatusUpdateResponse {
  data: {
    name: string;
    status: JobStatus;
    modified: string;
  };
}

// Link Partner Response
interface LinkPartnerResponse {
  success: boolean;
  message: string;
  data?: any;
}
```

### 7.4 Request Interfaces

```typescript
// Job Accept Request
interface JobAcceptRequest {
  status: "accepted" | "declined";
}

// Job Status Update Request
interface JobStatusUpdateRequest {
  status: JobStatus;
}

// User Update Request
interface UserUpdateRequest {
  handyman_name?: string;
  contact_number?: string;
  email?: string;
  current_location?: string;
  service_area?: number;
  skills?: string;
}

// Area Update Request
interface AreaUpdateRequest {
  service_area: number;
  current_location: string;
}

// Bank Management Request
interface BankManagementRequest {
  bank_details: BankDetail[];
}

// Skills Update Request
interface SkillsUpdateRequest {
  skills: string; // JSON stringified skills object
}

// Availability Update Request
interface AvailabilityUpdateRequest {
  availability: Array<{
    day: string;
    start_time: string;
    end_time: string;
    is_active: boolean;
  }>;
}

// Link Partner Request
interface LinkPartnerRequest {
  partner_code: string;
}
```

---

## 8. Migration Considerations for Node.js

### 8.1 Required Environment Variables
- `EXPO_PUBLIC_API_URL`: Main API base URL
- `EXPO_PUBLIC_PENDING_URL`: Pending jobs URL

### 8.2 Authentication
- Implement Bearer token validation
- Session management with Better Auth integration
- User context with erpId mapping

### 8.3 File Upload Handling
- Multipart form data support
- File storage and URL generation
- Private file access control

### 8.4 Database Schema Requirements
Based on the API usage, the following entities are needed:
- Handyman (users)
- Jobs/Installations
- Customers
- Products/Items
- Stock
- Partners
- Bank Details
- Skills
- Service Areas
- Completion Photos
- Documents

### 8.5 API Endpoints to Implement
1. **Authentication**: `/auth/*`
2. **Jobs**: `/jobs`, `/jobs/:id`, `/handyman/jobs/:id/response`
3. **Resources**: `/erp/resource/*` (Handyman, Installation, Customer, etc.)
4. **File Upload**: `/erp/upload`
5. **User Management**: Various user-related endpoints

### 8.6 Recommended Node.js Implementation Structure

```javascript
// Authentication
POST /api/auth/sign-in
POST /api/auth/sign-up
POST /api/auth/sign-out
GET /api/auth/session

// Jobs
GET /api/jobs
GET /api/jobs/pending
GET /api/jobs/:id
POST /api/jobs/:id/response
PUT /api/jobs/:id/status
POST /api/jobs/:id/completion-photos

// Users
GET /api/users/:id
PUT /api/users/:id
PUT /api/users/:id/area
PUT /api/users/:id/bank
PUT /api/users/:id/skills
PUT /api/users/:id/availability
POST /api/users/:id/documents
POST /api/users/:id/profile-image

// Customers
GET /api/customers/:id

// Products
GET /api/products/:id
GET /api/products/:id/stock
PUT /api/products/:id/collect

// Partners
GET /api/partners
GET /api/partners/:id
POST /api/partners/link

// File Upload
POST /api/upload
```

This documentation provides a complete overview of the current API structure and can serve as a blueprint for the Node.js migration.