# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **Auth Flow Flash**: Fixed signin screen briefly showing when user is already logged in
  - Added loading screen during auth check to eliminate navigation flash
  - Prevented navigation logic from running until auth check is complete
  - Added proper loading state management in auth context
- Fixed job status update API endpoint returning 404 errors
- Changed from using query parameters to direct resource ID in URL path
- Updated endpoint from `/erp/resource/Installation?filter=...` to `/erp/resource/Installation/${jobId}`
- Fixed 403 Forbidden error by changing to handyman-specific endpoint `/handyman/jobs/${jobId}/status`
- Fixed collect stock screen showing "Loading Job Details..." by adding missing jobId parameter in navigation
- Fixed completion photos not loading due to incorrect URL construction
- Fixed completion photo upload functionality with proper API integration
- Fixed ImagePicker deprecation warnings by removing deprecated MediaTypeOptions
- Fixed ImagePicker not opening by adding proper plugin configuration in app.json
- Fixed multi-image upload replacing previous images by progressively updating completion_photos array
- Fixed error messages to be more specific about job operations instead of partner operations
- Improved error handling and response data structure validation
- Fixed "Loading Job Details..." message showing indefinitely in collect stock screen by:
  - Adding missing `item_name` parameter to navigation from job details
  - Removing strict `item_name` requirement from loading condition
  - Added debugging logs to track parameter flow
- Fixed multiple products support in job details and collect stock screens:
  - Created ProductItem components that fetch individual product data
  - Removed dependency on single productData for all products
  - Each product now fetches its own details from the API using product.item ID
- Fixed React key prop warning by using unique `product.name` field as key instead of non-unique fields
- Fixed collect stock screen loading issue by passing actual API products data instead of mock data
- Fixed installation guides button by updating field name from `manualUrl` to `installation_guide` and adding it to Product type
- Fixed photo picker not opening by correcting jobId parameter passing from job details to collect stock screen
- Fixed ERPNext API error (417 Expectation Failed) by properly updating Installation Item instead of Installation resource
- Removed unused `completion_photos` parameter from product collection API to match actual implementation
- Fixed permission error (403 Forbidden) by getting existing Installation data first, then updating specific product in the array
- **Stock API 404 Errors**: Fixed stock fetching API to use proper filtering instead of direct record lookup
  - Changed from `/erp/resource/Heyzack Stock/${productId}` to `/erp/resource/Heyzack Stock?filter=[["item", "=", "${productId}"]]`
  - Added fallback to return default stock data (quantity: 0) when stock records don't exist
  - Prevents 404 errors when stock records are missing for products

### Changed
- Enhanced collect stock screen to handle cases where item_name is not available
- Improved parameter passing from job details to collect stock screen
- Updated product display to show individual product names instead of generic data
- **Stock API Error Handling**: Improved error handling in stock API to gracefully handle missing stock records
  - Returns default stock data instead of throwing errors
  - Ensures UI continues to work even when stock data is unavailable

### Added
- Initial project setup.
- README.md file.
- CHANGELOG.md file.
- Modified bank data handling to process single bank entry instead of multiple entries
- Dynamic product rendering in collect stock screen using actual product data from API
- Product specifications and tools required display in collect stock interface
- JSON parsing of products parameter to display real product information
- Enhanced product cards with description, specifications, and tools required sections
- Enhanced photo upload functionality with both camera and gallery options
- Selection dialog for choosing between camera capture and gallery pick
- Separate permission handling for camera and media library access
- Multi-image selection from gallery with sequential upload processing
- Individual image upload with proper Installation resource updates
- Progress tracking for multiple image uploads with success/error counts
- Integrated product collection API (`useUpdateProductCollect`) in collect stock screen:
  - Uploads product collection photos to ERPNext
  - Updates product status to "collected" in the Installation resource
  - Updates local state to reflect collection status
  - Added proper error handling and success feedback
- Added missing fields to Product type (`item`, `quantity`, `status`) to match API response structure
- Added comprehensive debugging logs for photo picker functionality to troubleshoot upload issues
- Added platform detection to handle web platform limitations for camera functionality
- **Shimmer Loading Effects**: Added comprehensive shimmer loading states across the app
  - Created base `Shimmer` component with animated loading effect
  - Added `ShimmerCard` component for card-like loading states
  - Created `ShimmerSkeleton` component for full page loading layouts
  - Implemented shimmer loading on home screen during data fetch
  - Added shimmer loading on jobs screen during data fetch
  - Improved user experience with smooth loading transitions
- **Partner Chat Integration**: Added comprehensive chat functionality with partner management
  - Integrated `useChat` hook with real-time Firebase messaging
  - Added assigned partner list functionality using `getAssignedPartners` API
  - Created partner selection modal for starting new conversations with unassigned partners
  - Updated chat screen to display real chat rooms for assigned partners
  - Enhanced chat room screen with real-time message sending and receiving
  - Added loading states and empty states for better UX
  - Integrated partner data fetching with `useGetPartnerById` hook
  - Added proper flow: first get assigned partners, then fetch their chat data
  - Implemented proper navigation between chat list and individual chat rooms
  - Added real-time message synchronization with Firebase database
  - Enhanced chat UI with proper message bubbles and typing indicators
  - **Chat Shimmer Loading**: Created realistic chat loading experience
    - Added `ChatShimmer` component with animated chat bubble placeholders
    - Replaced spinner loader with realistic chat message shimmer effects
    - Shows avatar, name, and message bubble placeholders during loading
    - Provides better UX by showing what the actual content will look like
  - **Chat List Shimmer**: Added shimmer loading for chat list screen
    - Created `ChatListShimmer` component with animated placeholders for chat items
    - Replaced ActivityIndicator with realistic chat list shimmer effects
    - Shows avatar, name, message, and badge placeholders during loading
    - Matches the actual chat list layout for seamless loading experience

## [Latest] - 2025-01-20

### Fixed
- Fixed `useGetJobById` API call throwing "Installation undefined not found" error when job ID is undefined
- Added `enabled: !!id` condition to prevent API calls with undefined job IDs
- Added guard clause in `queryFn` to handle missing job ID gracefully
- Updated job-details.tsx to pass empty string instead of undefined when jobData.name is not available
- Fixed completion photos rendering in job details page
- Updated FlatList to properly access `item.image` property from completion_photos objects
- Added horizontal scrolling for completion photos with proper styling
- Added debugging console.log to track completion photos data structure
- Fixed requested jobs rendering in jobs screen to properly display job details from nested data structure
- Updated JobCard mapping to extract title, description, scheduled_date, customer_name, and customer_address from installation object

### Technical Details
- Modified `app/api/jobs/getJobs.ts` to include proper null checks for job ID
- Updated `app/jobs/job-details.tsx` to handle undefined jobData.name gracefully
- Fixed FlatList renderItem to access `item.image` instead of treating item as string
- Added horizontal scrolling, keyExtractor, and proper styling for photo gallery
- Updated `app/(tabs)/jobs.tsx` to properly map requested jobs data structure to JobCard component
- Added proper type definitions and fallback values for missing data
- Prevents unnecessary API calls and improves error handling for job details page

### Changed
- **Multiple Customer Support**: Enhanced customer data handling to support multiple customers
  - Created `useCustomersData` hook to efficiently fetch customer data for multiple jobs
  - Prevents duplicate API calls for the same customer
  - Properly maps customer data to individual jobs

---

*This CHANGELOG was initially generated by Cascade AI.*
