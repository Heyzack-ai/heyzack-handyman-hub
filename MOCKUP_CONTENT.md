# Mockup Content Guide

This document provides the exact content for each screen based on the design mockup.

## 1. Dashboard Screen (Home)

### Header
- **Title**: "Hello, Technician"
- **Subtitle**: "Here's your schedule for today"
- **Notification Icon**: Bell icon (top right)

### Job Summary Cards
- **Card 1**: 
  - Title: "Completed Jobs"
  - Value: "8" (or dynamic count)
- **Card 2**: 
  - Title: "Pending Jobs"
  - Value: "3" (or dynamic count)
- **Card 3**: 
  - Title: "Earnings"
  - Value: "0" (or dynamic earnings amount)

### Schedule Section
- **Section Title**: "Schedule"
- **Calendar**: January 2025 calendar view
- Shows dates 1, 2, 3, 4, etc.

---

## 2. Jobs List Screen

### Header
- **Title**: "Jobs"

### Search Bar
- **Placeholder**: "Search jobs, customers, or addresses"

### Scheduled Jobs Section
- **Section Title**: "Scheduled"
- **Count Badge**: "11" (or dynamic count)

### Job Card Example
- **Job Title**: "Installation for Order MOCK-001"
- **Status Badge**: "Scheduled" (green tag)
- **Description**: "No description available"
- **Customer Name**: "Test Lead"
- **Location**: "New York, NY"
- **Date Icon**: Calendar icon with "30/11/2025"
- **Time Icon**: Clock icon with "12:00 AM"

---

## 3. Job Progress Screen

### Header
- **Back Arrow**: Navigation back button
- **Title**: "Premium Smart Home Package"

### Job Progress Section
- **Section Title**: "Job Progress"
- **Current Status**: "Current Status: Job Completed"
- **Progress Bar**: 89% filled (red/orange color)
- **Progress Percentage**: "89%"

### Progress Flow Text
- "Job Request → Accepted → Stock Collected → En Route → Contract Sent → Contract Signed → Job Started → Job Marked as Done → Job Ended"

### Schedule Details Card
- **Card Title**: "Schedule Details"
- **Date**: "Date: 16/1/2025"
- **Time**: "Time: 2:30 PM"
- **Type**: "Type: Premium Smart Home Package"
- **Status**: "Status: Job Completed" (green tag)

---

## 4. Chat Screen

### Header
- **Back Arrow**: Navigation back button
- **Title**: "Pavun" (chat partner name)

### Messages
- **Incoming Message 1**:
  - Type: Image
  - Content: Landscape image with water
  - Timestamp: "5:08 PM"
  
- **Outgoing Message 1**:
  - Type: Text
  - Content: "Hello"
  - Timestamp: "5:08 PM"
  
- **Outgoing Message 2**:
  - Type: Text
  - Content: "Buy"
  - Timestamp: "5:08 PM"
  
- **Incoming Message 2**:
  - Type: Image
  - Content: Waterfall image in green landscape
  - Timestamp: (not shown in mockup)

### Input Area
- **Placeholder**: "Type a message..."
- **Attach Button**: Paperclip icon
- **Send Button**: Send icon

---

## 5. Profile Screen

### Header
- **Back Arrow**: Navigation back button (if navigated from another screen)

### User Profile Section
- **Profile Picture**: Circular image of person in field
- **Name**: "Raheman Ali"
- **Edit Profile Button**: "Edit Profile" (below name)

### Skills Section
- **Section Title**: "Skills"
- **Add Button**: "+ Add"
- **Skill Tags**:
  - "Electrical work"
  - "Plumbing"
  - "Heat Pump installation"

### Performance Metrics
- **Card 1**: 
  - Value: "0"
  - Label: "Jobs Completed"
- **Card 2**: 
  - Value: "0"
  - Label: "Rating"

### Payments Section
- **Section Title**: "Payments"
- (Partially visible in mockup)

---

## Content Notes

### Dynamic Content
- Job counts, earnings, and ratings should be dynamic based on actual user data
- Dates and times should reflect actual job schedules
- Customer names and locations should come from job data
- Chat partner names should come from partner/user data

### Static Content
- Section titles and labels should match exactly as shown
- Button text should match exactly
- Placeholder text should match exactly

### Localization
- All content should be translatable
- Use translation keys from `translation.json` files
- Maintain consistency across English and French translations

