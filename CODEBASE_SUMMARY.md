# Smart Home Connect Ops - Codebase Summary

## Overview
A React-based Partner Portal for Smart Home Connect operations, built with TypeScript, Tailwind CSS, and shadcn/ui components. The application manages leads, customers, installations, handymen (installers), inventory/orders, and includes real-time chat functionality.

---

## 📱 Screens & Pages

### 1. **Authentication Screens** (Public)

| Screen | Route | Type | Description |
|--------|-------|------|-------------|
| **Sign In** | `/sign-in` | Auth | Email/password login using better-auth |
| **Sign Up** | `/sign-up` | Auth | Partner registration (currently redirects to onboarding) |
| **Forgot Password** | `/forgot-password` | Auth | Password reset request with email |
| **Reset Password** | `/reset-password` | Auth | Set new password with token validation |
| **Onboarding Wizard** | `/enquire` | Public | Multi-step partner application form |

#### Actions:
- **Sign In**: Authenticate, store bearer token, detect first-login for password reset
- **Sign Up**: Create partner account (name, email, password validation)
- **Forgot Password**: Send reset email via `/api/auth/forget-password`
- **Reset Password**: Validate token, update password via `/api/auth/reset-password`
- **Onboarding**: Submit partner application (Reseller, Installer, or Renovation types)

---

### 2. **Dashboard** 

| Screen | Route | Type | Description |
|--------|-------|------|-------------|
| **Dashboard** | `/` | Overview | Main dashboard with KPIs and quick actions |

#### Actions:
- View KPI cards (Total Customers, Active Installations, Completed Installations, Available Handymen, Monthly Revenue, Customer Satisfaction, Available Credit)
- View recent customers list
- View upcoming installations
- Apply partner credit to Shopify checkout
- First-time login password reset prompt
- Navigate to customer details

#### Components Used:
- `NotificationDrawer`, `AddLeadDialog`, `ScheduleInstallationModal`, `RequestStockDialog`
- `Card`, `CardContent`, `CardHeader`, `CardTitle`, `Badge`, `Button`, `Input`
- `Dialog` (for credit application and password reset)

---

### 3. **Leads Management**

| Screen | Route | Type | Description |
|--------|-------|------|-------------|
| **Leads List** | `/leads` | List/Kanban | Manage sales leads with status tracking |
| **Lead Details** | `/leads/:id` | Detail | Individual lead view with tabs |

#### Actions:
- **List View**: Search, filter by status, toggle List/Kanban view
- **Kanban View**: Drag-and-drop status updates across columns (Contacted → Quote Requested → Quote Sent → Quote Approved → Installation Scheduled → Completed/Paused/Rejected)
- **Lead Operations**: View, Edit, Delete leads
- **Lead Details Tabs**:
  - **Details**: Contact information, lead information
  - **Quotes**: View/manage quotes (currently placeholder)
  - **Timeline**: Activity history
  - **Notes**: Add, edit, delete notes
  - **Documents**: Upload, download, delete files (PDF, PNG, JPG up to 20MB)

#### Components Used:
- `AddLeadDialog`, `LeadTimeline`, `QuoteViewer`
- `Card`, `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`, `Badge`, `Button`
- `Input`, `Textarea`, `Select`, `Dialog`
- `Pagination` components

---

### 4. **Customers Management**

| Screen | Route | Type | Description |
|--------|-------|------|-------------|
| **Customers List** | `/customers` | List/Kanban | Customer database management |
| **Customer Details** | `/customers/:id` | Detail | Individual customer view |

#### Actions:
- **List View**: Search customers, toggle List/Kanban view
- **Kanban View**: Drag-and-drop status (active/inactive)
- **Customer Operations**: View customer details, Edit customer, Delete customer
- **Customer Details Tabs**:
  - **Details**: Contact information, customer metadata
  - **Installations**: View customer's installation history with completion photos
  - **Timeline**: Customer activity history
  - **Contact**: Call and email actions
- **Photo Viewer**: Modal for viewing installation completion photos with prev/next navigation

#### Components Used:
- `AddCustomerDialog`, `CustomerTimeline`
- `Card`, `Tabs`, `Badge`, `Button`, `Input`, `Dialog`, `Avatar`
- `Pagination` components

---

### 5. **Installations Management**

| Screen | Route | Type | Description |
|--------|-------|------|-------------|
| **Installations** | `/installations` | List/Calendar | Installation job scheduling and tracking |
| **Installation Details** | `/installations/:id` | Detail | Individual installation view |

#### Actions:
- **View Modes**: Toggle between List view and Calendar view
- **Status Overview Cards**: Total, Scheduled, En Route, In Progress, Approved, Rejected counts
- **Filters**: Search by customer/partner/handyman, filter by status group, date range picker
- **Installation Actions**:
  - View installation details
  - Assign/Reassign handyman
  - Reschedule installation
  - Cancel/Reject installation with reason
  - Delete installation
- **Status Groups**: Scheduled, En Route, In Progress, Approved, Rejected

#### Components Used:
- `InstallationCalendarView`, `HandymanAssignmentModal`, `ScheduleInstallationModal`
- `AlertDialog`, `Dialog`, `Calendar` (date range picker), `Popover`
- `Card`, `Badge`, `Button`, `Input`, `Select`, `Pagination`

---

### 6. **Handymen (Installers) Management**

| Screen | Route | Type | Description |
|--------|-------|------|-------------|
| **Handymen** | `/handyman` | Table/List | Handyman workforce management |

#### Actions:
- **Summary Cards**: Total, Available, Busy, On Leave, Average Rating
- **Filters**: Search by name/skills, filter by status, filter by skill
- **Handyman Operations**:
  - View profile (details, availability calendar, installations)
  - Send message (opens chat)
  - Delete/Delink handyman
- **Registration**: Add new handyman (currently commented)
- **Modals**: 
  - Handyman registration
  - Detailed profile view with tabs
  - Messaging interface
  - Job assignment

#### Components Used:
- `HandymanRegistrationModal`, `HandymanDetailsModal`, `HandymanMessagingModal`, `JobAssignmentModal`, `DeleteHandymanModal`
- `Avatar`, `Badge`, `Button`, `Card`, `Input`, `Select`, `Table`
- `Tooltip`, `Pagination`

---

### 7. **Inventory & Orders**

| Screen | Route | Type | Description |
|--------|-------|------|-------------|
| **Inventory/Orders** | `/inventory` | List | Partner order history from Shopify |
| **Bulk Stock Request** | `/inventory/bulk-request` | E-commerce | Product catalog with cart (mock data) |

#### Actions:
- **Orders View**:
  - View order summary stats (Total, Pending, Approved, Delivered, Cancelled)
  - Search orders by ID or item name
  - Filter by status
  - View order details in modal
  - "Shop Now" button redirects to Shopify with SSO
- **Bulk Stock Request** (Mock):
  - Browse product catalog
  - Add to cart with quantity
  - Apply tier discounts and coupon codes
  - Submit stock request

#### Components Used:
- `Card`, `Badge`, `Button`, `Input`, `Select`, `Dialog`, `Sheet` (cart sidebar)

---

### 8. **Chat**

| Screen | Route | Type | Description |
|--------|-------|------|-------------|
| **Chat** | `/chat` | Real-time Chat | Messaging with admin and handymen |

#### Actions:
- View available connections (admins first, then handymen)
- Search connections by name/email
- Send text messages
- Send images (JPEG, PNG, WebP, GIF up to 10MB)
- View message history
- Unread message indicators
- Mobile-responsive with back navigation

#### Components Used:
- `Card`, `ScrollArea`, `Button`, `Input`, `Avatar`
- `useChat` hook for Firebase real-time messaging

---

### 9. **Reports**

| Screen | Route | Type | Description |
|--------|-------|------|-------------|
| **Reports** | `/reports` | Analytics | Business intelligence dashboard |

#### Actions:
- **Date Range Selection**: Today, Last 7 days, Last 30 days, Last 90 days, Custom range
- **Refresh Data**: Reload reports
- **Export Reports**: Download functionality (placeholder)
- **Report Categories** (Tabs):
  - Installation reports
  - Handyman performance reports
  - Inventory reports
  - Financial reports
  - Customer satisfaction reports

#### Components Used:
- `InstallationReports`, `HandymanPerformanceReports`, `InventoryReports`, `FinancialReports`, `CustomerSatisfactionReports`
- `Tabs`, `Card`, `Button`, `Calendar`, `Popover`

---

### 10. **Support**

| Screen | Route | Type | Description |
|--------|-------|------|-------------|
| **Support** | `/support` | Help Desk | Customer support and device monitoring |

#### Actions:
- **Overview Stats**: Active tickets, devices online/offline, avg resolution time, satisfaction
- **Recent Alerts**: Device offline/error/maintenance notifications
- **Support Tabs**:
  - Asset Management
  - Support Tickets
  - Device Monitoring
  - Troubleshooting Tools
  - Knowledge Base

#### Components Used:
- `AssetManagement`, `SupportTickets`, `DeviceMonitoring`, `TroubleshootingTools`, `KnowledgeBase`
- `Tabs`, `Card`, `Alert`, `Badge`

---

### 11. **Settings**

| Screen | Route | Type | Description |
|--------|-------|------|-------------|
| **Settings** | `/settings` | Configuration | User and application settings |

#### Actions:
- **General Settings**: Profile management, language selection
- **Notification Settings**: Email/push notification preferences
- **RBAC Settings**: Role-based access control

#### Components Used:
- `GeneralSettings`, `NotificationSettings`, `RBACSettings`
- `Card`, `Form` components

---

### 12. **Utility Pages**

| Screen | Route | Type | Description |
|--------|-------|------|-------------|
| **Not Found** | `*` | Error | 404 page for undefined routes |
| **Index** | `/` | Redirect | Redirects to Dashboard |

---

## 🔧 Component Inventory

### UI Components (shadcn/ui based)

| Component | Usage |
|-----------|-------|
| `accordion` | Expandable content sections |
| `alert` | Warning/error notifications |
| `alert-dialog` | Confirmation dialogs (delete, cancel) |
| `avatar` | User profile images |
| `badge` | Status indicators, counts |
| `breadcrumb` | Navigation hierarchy |
| `button` | Primary/secondary actions |
| `calendar` | Date selection, date ranges |
| `card` | Content containers |
| `carousel` | Image galleries |
| `chart` | Data visualization |
| `checkbox` | Multi-select options |
| `collapsible` | Expandable sections |
| `command` | Command palette/search |
| `context-menu` | Right-click menus |
| `dialog` | Modal windows |
| `drawer` | Slide-out panels |
| `dropdown-menu` | Action menus |
| `form` | Form validation with react-hook-form |
| `hover-card` | Preview popups |
| `input` | Text inputs |
| `input-otp` | One-time password inputs |
| `label` | Form labels |
| `menubar` | Application menu |
| `navigation-menu` | Top navigation |
| `pagination` | List pagination |
| `popover` | Contextual overlays |
| `progress` | Progress indicators |
| `radio-group` | Single-select options |
| `resizable` | Resizable panels |
| `scroll-area` | Custom scrollbars |
| `select` | Dropdown selections |
| `separator` | Visual dividers |
| `sheet` | Slide-out side panels |
| `sidebar` | Navigation sidebar |
| `skeleton` | Loading placeholders |
| `slider` | Range inputs |
| `sonner` | Toast notifications |
| `switch` | Toggle controls |
| `table` | Data tables |
| `tabs` | Tabbed interfaces |
| `textarea` | Multi-line text inputs |
| `tier-badge` | Partner tier display |
| `toast` | Notification toasts |
| `toggle` | Binary switches |
| `toggle-group` | Grouped toggles |
| `tooltip` | Hover information |
| `address-autocomplete` | Address search with Radar SDK |

### Custom Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `Layout` | `components/layout/` | App shell with sidebar |
| `Sidebar` | `components/common/` | Navigation menu |
| `NotificationDrawer` | `components/common/` | Notifications panel |
| `Error`, `Loading` | `components/common/` | Status states |
| `LanguageSwitcher` | `components/common/` | i18n language toggle |
| `AddLeadDialog` | `components/leads/` | Lead creation/editing |
| `LeadModal` | `components/leads/` | Lead detail modal |
| `LeadTimeline` | `components/` | Activity timeline |
| `QuoteViewer` | `components/` | Quote display/management |
| `AddCustomerDialog` | `components/customers/` | Customer creation |
| `CustomerTimeline` | `components/customers/` | Customer activity |
| `HandymanAssignmentModal` | `components/installation/` | Assign installers |
| `ScheduleInstallationModal` | `components/installation/` | Schedule jobs |
| `InstallationCalendarView` | `components/installation/` | Calendar display |
| `InstallationDetailsModal` | `components/installation/` | Job details |
| `RequestStockDialog` | `components/inventory/` | Stock requests |
| `HandymanRegistrationModal` | `components/handyman/` | Add installer |
| `HandymanDetailsModal` | `components/handyman/` | Installer profile |
| `HandymanMessagingModal` | `components/handyman/` | Direct message |
| `JobAssignmentModal` | `components/handyman/` | Assign jobs |
| `DeleteHandymanModal` | `components/handyman/` | Remove installer |
| `TierBenefitsModal` | `components/partner/` | Tier info display |
| `OnboardingWizard` | `components/onboarding/` | Partner application |
| Report components | `components/reports/` | Analytics displays |
| Support components | `components/support/` | Help desk modules |
| Settings components | `components/settings/` | Configuration forms |

---

## 🔌 API Endpoints

### Authentication (better-auth)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/sign-in` | POST | User login |
| `/api/auth/sign-up` | POST | User registration |
| `/api/auth/sign-out` | POST | User logout |
| `/api/auth/forget-password` | POST | Request password reset |
| `/api/auth/reset-password` | POST | Reset password with token |
| `/api/auth/session` | GET | Get current session |

### Leads API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/lead` | GET | Get all leads |
| `/api/v1/lead` | POST | Create new lead |
| `/api/v1/lead/:id` | GET | Get lead by ID |
| `/api/v1/lead/:id` | PATCH | Update lead |
| `/api/v1/lead/deleteLead` | DELETE | Delete lead |
| `/api/v1/lead/sources` | GET | Get lead sources |
| `/api/v1/lead/:id/notes` | GET | Get lead notes |
| `/api/v1/lead/:id/notes` | POST | Add note |
| `/api/v1/lead/:id/notes` | PUT | Update note |
| `/api/v1/lead/:id/notes` | DELETE | Delete note |
| `/api/v1/lead/:id/timeline` | GET | Get timeline |
| `/api/v1/lead/:id/documents` | GET | Get documents |
| `/api/v1/lead/:id/documents` | POST | Upload document metadata |
| `/api/v1/lead/:id/documents/upload-url` | GET | Get S3 presigned URL |
| `/api/v1/lead/:id/documents/download` | GET | Get download URL |
| `/api/v1/lead/:id/documents` | DELETE | Delete document |

### Customers API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/customer` | GET | Get customers (with pagination/search) |
| `/api/v1/customer` | POST | Create customer |
| `/api/v1/customer/:id` | GET | Get customer by ID |
| `/api/v1/customer/:id` | PUT | Update customer |
| `/api/v1/customer/:id` | DELETE | Delete customer |
| `/api/v1/customer/:id/timeline` | GET | Get customer timeline |

### Installations API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/installation` | GET | Get installations (filtered by partner) |
| `/api/v1/installation/create` | POST | Create installation |
| `/api/v1/installation/:id` | GET | Get installation by ID |
| `/api/v1/installation/:id` | PUT | Update installation |
| `/api/v1/installation/:id` | DELETE | Delete installation |
| `/api/v1/installation/:id/status` | PATCH | Update installation status |
| `/api/v1/installation/:id/timeline` | GET | Get installation timeline |
| `/api/v1/installation/:id/notes` | POST | Add installation note |
| `/api/v1/installation/:id/notes/:noteId` | PUT | Edit note |
| `/api/v1/installation/:id/notes/:noteId` | DELETE | Delete note |
| `/api/v1/installation/:id/issues` | POST | Report issue |
| `/api/v1/customer/installations/:id/cancel` | POST | Cancel with email |
| `/api/v1/partner/installations/:id/reject` | POST | Reject installation |
| `/api/v1/installation/customers` | GET | Get customers for installation |

### Handymen API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/handyman` | GET | Get handymen |
| `/api/v1/handyman/list` | GET | Get handymen by partner |
| `/api/v1/handyman` | POST | Create handyman |
| `/api/v1/handyman/:id` | GET | Get handyman by ID |
| `/api/v1/handyman/:id` | PUT | Update handyman |
| `/api/v1/handyman/:id` | DELETE | Delete handyman |
| `/api/v1/handyman/:id/jobs` | GET | Get handyman jobs |
| `/api/v1/handyman/:id/availability` | GET | Get availability calendar |
| `/api/v1/handyman/:id/verify` | POST | Verify handyman |
| `/api/v1/handyman/:id/reject` | POST | Reject handyman |
| `/api/v1/handyman/assign-job` | POST | Assign job to handyman |
| `/api/v1/handyman/jobs/:id` | DELETE | Delete job |
| `/api/v1/partner/handymen/:id/delink` | DELETE | Delink handyman from partner |

### Partner API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/partner/tier` | GET | Get partner tier info |
| `/api/v1/partner/tier/configurations` | GET | Get tier configurations |
| `/api/v1/partner/profile` | GET | Get partner profile |
| `/api/v1/partner/profile` | PUT | Update partner profile |
| `/api/v1/partner/customer-satisfaction` | GET | Get satisfaction ratings |
| `/api/v1/partner/shopify/credit/check` | POST | Check available credit |
| `/api/v1/partner/shopify/credit/apply` | POST | Apply credit to checkout |
| `/api/v1/partner/shopify/cart` | GET | Get cart information |
| `/api/v1/partner/shopify/orders` | GET | Get order history |
| `/api/v1/partner/shopify/sso` | GET | Get Shopify SSO URL |

### Chat API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/chat/history` | GET | Get chat history |
| `/api/v1/chat/send` | POST | Send text message |
| `/api/v1/chat/upload-image` | POST | Send image message |
| `/api/v1/chat/connections` | GET | Get available chat connections |
| `/api/v1/chat/firebase-token` | GET | Get Firebase auth token |
| `/api/v1/chat/message/:roomId/:messageId` | DELETE | Delete message |
| `/api/v1/chat/last-seen/:roomId` | POST | Update last seen |
| `/chat/read/:roomId` | POST | Mark messages as read |

### User API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/user/getPartner` | GET | Get partner users |
| `/user/send-invite-link` | POST | Send handyman invite |

---

## 🏗️ Architecture Highlights

### State Management
- **React Query (TanStack Query)**: Server state management with caching
- **React Context**: Language/i18n context
- **Local Storage**: Auth tokens, user preferences

### Authentication
- **better-auth**: Modern authentication library
- **Bearer Token**: JWT stored in localStorage
- **Role-based**: Partner and Admin roles

### Internationalization
- **i18next**: Translation framework
- **Languages**: English (en), French (fr)
- **Translation Files**: `/src/utils/i18next-language/translation/`

### Real-time Features
- **Firebase**: Real-time chat messaging
- **Chat Hook**: `useChat` for message synchronization

### File Handling
- **S3 Presigned URLs**: Direct upload/download to S3
- **Document Types**: PDF, PNG, JPEG (max 20MB)
- **Image Types**: JPEG, PNG, WebP, GIF (max 10MB for chat)

### External Integrations
- **Shopify**: E-commerce integration with SSO
- **Radar SDK**: Address autocomplete
- **Firebase**: Real-time database for chat

---

## 📁 Key Directories

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── common/          # Shared components
│   ├── layout/          # Layout components
│   ├── leads/           # Lead-specific components
│   ├── customers/       # Customer-specific components
│   ├── installation/    # Installation components
│   ├── handyman/        # Handyman components
│   ├── inventory/       # Inventory components
│   ├── partner/         # Partner tier/benefits
│   ├── onboarding/      # Onboarding wizard
│   ├── reports/         # Report components
│   ├── support/         # Support components
│   └── settings/        # Settings components
├── pages/               # Route pages
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and API clients
│   ├── api/             # API configuration
│   ├── *.ts             # Domain-specific clients
│   └── validation/      # Zod schemas
├── contexts/            # React contexts
└── utils/               # Utility functions
```

---

## 🔐 Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_AUTH_URL` | Backend API base URL |
| `VITE_SHOPIFY_STORE_URL` | Shopify storefront URL |
| `VITE_RADAR_API_KEY` | Radar SDK API key |

---

*Generated on 2026-03-09*
