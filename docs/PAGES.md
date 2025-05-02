# RadOrderPad UI Pages Documentation

*Created: May 2, 2025 at 02:18 UTC*

This document provides detailed information about each page/screen in the RadOrderPad UI mockup, including their purpose, key components, and features.

## Table of Contents

1. [Authentication Pages](#authentication-pages)
2. [Order Creation and Management](#order-creation-and-management)
3. [Queue Management](#queue-management)
4. [User and Account Management](#user-and-account-management)
5. [Analytics and Dashboard](#analytics-and-dashboard)

---

## Authentication Pages

### Login (`/auth/Login.tsx`)

**Purpose**: Allow users to authenticate into the system.

**Key Components**:
- Email input field with validation
- Password input field with show/hide toggle
- "Remember me" checkbox
- "Forgot password" link
- Login button
- Link to request access for new users

**Features**:
- Visual feedback for form validation
- Password visibility toggle
- Error messaging for failed login attempts (UI only)

### Registration (`/auth/Register.tsx`)

**Purpose**: Allow new organizations and trial users to register.

**Key Components**:
- Tabbed interface for organization vs. trial registration
- Organization name, type, and contact information
- Admin user details (name, email, password)
- Specialty selection for trial users
- Terms acceptance checkbox

**Features**:
- Different registration flows for organizations and trial users
- Password strength validation
- Terms of service agreement checkbox

### Forgot Password (`/auth/ForgotPassword.tsx`)

**Purpose**: Initiate password recovery process.

**Key Components**:
- Email input field
- Submit button
- Back to login link
- Confirmation success state

**Features**:
- Email validation
- Two-step flow (request form and confirmation)
- Visual feedback of successful submission

### Reset Password (`/auth/ResetPassword.tsx`)

**Purpose**: Allow users to create a new password after receiving a reset link.

**Key Components**:
- New password input
- Confirm password input
- Password requirements help text
- Reset button

**Features**:
- Password match validation
- Password strength requirements
- Success confirmation state after reset

### Accept Invitation (`/auth/AcceptInvitation.tsx`)

**Purpose**: Facilitate new user onboarding after receiving an invitation.

**Key Components**:
- Organization and role display
- Account information display (email)
- Password creation fields
- Terms acceptance checkbox

**Features**:
- Display of invitation details (organization, role, inviter)
- Password creation with confirmation
- Welcome confirmation after successful setup

---

## Order Creation and Management

### New Order (`/NewOrder.tsx`)

**Purpose**: Create new imaging orders through dictation.

**Key Components**:
- Patient information card
- Dictation form with modality selection
- Tabs for dictation or search of previous orders
- Validation results display
- Order summary and confirmation

**Features**:
- Multi-step order creation process (dictation → validation → confirmation)
- Modality selection with appropriate credit usage
- Patient information display
- Voice dictation simulation

### Dictation Form (`/components/order/DictationForm.tsx`)

**Purpose**: Allow users to input clinical information for order validation.

**Key Components**:
- Modality dropdown selection
- Dictation text area
- Voice dictation button (simulated)
- Submit and cancel buttons

**Features**:
- Form validation for required fields
- Voice dictation simulation with recording state
- Clinical information guidance text

### Validation View (`/components/order/ValidationView.tsx`)

**Purpose**: Display validation results and clinical coding suggestions.

**Key Components**:
- Validation status indicator (valid/incomplete/invalid)
- Feedback display area
- Compliance score
- Suggested ICD-10 and CPT codes with confidence levels
- Original dictation display
- Edit/sign buttons

**Features**:
- Confidence level indicators for suggested codes
- Visual compliance score
- Dictated clinical information display
- Action buttons for editing or signing order

### Admin Order Finalization (`/AdminOrderFinalization.tsx`)

**Purpose**: Allow admin staff to complete order details before sending to radiology.

**Key Components**:
- Order summary information
- Tabbed interface for patient demographics, insurance, and additional details
- Required actions checklist
- Send to radiology button
- Credit usage confirmation dialog

**Features**:
- Form validation for required fields
- Multi-step completion process
- Insurance information entry
- File upload for insurance cards (simulated)
- Priority selection with fee explanations

---

## Queue Management

### Admin Queue (`/AdminQueue.tsx`)

**Purpose**: Display and manage orders that need administrative completion.

**Key Components**:
- Orders table with filtering and searching
- Status badges
- Tabs for different status filters
- Action buttons for order completion

**Features**:
- Order filtering by status
- Search functionality
- Action buttons contextual to order status
- Visual status indicators

### Radiology Queue (`/RadiologyQueue.tsx`)

**Purpose**: Allow radiology staff to view and schedule incoming orders.

**Key Components**:
- Orders table with filtering and searching
- Modality tabs and filters
- Referring physician information
- Schedule action buttons

**Features**:
- Modality-based filtering and tabs
- Search functionality
- Referring physician details with avatar
- Schedule buttons for pending orders

### Order List (`/OrderList.tsx`)

**Purpose**: Provide a comprehensive view of all orders with various filters.

**Key Components**:
- Orders table with advanced filtering
- Status badges and indicators
- Action buttons contextual to order status
- New order button

**Features**:
- Status-based filtering
- Search functionality
- Contextual action buttons based on order status
- Visual status indicators

---

## User and Account Management

### My Profile (`/MyProfile.tsx`)

**Purpose**: Allow users to view and edit their profile information.

**Key Components**:
- Profile information display and edit form
- Professional details section
- Connected accounts section
- Notification preferences

**Features**:
- Edit mode toggle for profile information
- Professional credentials management
- Integration with external systems (Epic, Cerner, etc.)
- Notification settings management

### Security (`/Security.tsx`)

**Purpose**: Manage account security settings and monitoring.

**Key Components**:
- Password management section
- Two-factor authentication setup
- Login activity monitoring
- Security recommendations
- Connected devices management

**Features**:
- Password update with validation
- 2FA enable/disable with QR code simulation
- Recovery codes generation and display
- Login activity table with location and device information
- Security notifications preferences

### Billing & Credits (`/BillingCredits.tsx`)

**Purpose**: Manage credit balances, purchases, and transaction history.

**Key Components**:
- Credit balance cards
- Credit package purchase options
- Auto-reload settings
- Transaction history table
- Payment method management

**Features**:
- Different credit types (standard/advanced)
- Bulk purchase options with pricing tiers
- Auto-reload configuration
- Transaction filtering and export
- Payment method management

---

## Analytics and Dashboard

### Dashboard (`/Dashboard.tsx`)

**Purpose**: Provide an overview of key metrics and recent activity.

**Key Components**:
- Key statistics cards
- Recent orders table
- Quick action buttons
- Analytics charts and graphs

**Features**:
- Tabbed interface for overview and analytics
- Bar chart for order activity
- Pie chart for modality distribution
- Order trend statistics
- Quick action shortcuts

---

## Planned (Not Yet Implemented)

1. **Organization Profile**: Manage organization details, branding, and settings
2. **Locations Management**: Add and manage practice/facility locations
3. **Users Management**: Invite, manage, and assign permissions to users
4. **Connections Management**: Connect with referring practices or radiology groups
5. **Trial Validation Sandbox**: Simplified interface for trial users to test validation