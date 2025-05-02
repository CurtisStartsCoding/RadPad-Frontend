# RadOrderPad UI Mockup Documentation

## Project Overview

RadOrderPad is a non-functional UI mockup for an imaging order platform designed for the healthcare sector. The platform allows referring physicians to dictate imaging orders, which are then completed with additional information by office administrative staff before being sent to radiology groups for scheduling and execution.

This mockup features a comprehensive set of screens that demonstrate the various user flows and interfaces across different user roles, including physicians, administrative staff, and radiology personnel.

## Key Features

- **Role-based Navigation System**: Different user types (Physician, Admin Staff, Radiology Admin, etc.) see different navigation options relevant to their responsibilities
- **Responsive UI Design**: Fully responsive interface built with React, Tailwind CSS, and shadcn/ui components
- **Order Workflow Visualization**: Complete order lifecycle from dictation to completion
- **Authentication and Security**: Authentication screens, security settings, and profile management
- **Administrative Interfaces**: Administrative queues for both referring physician staff and radiology groups

## Directory Structure

```
📁 client/src/
  │
  ├── 📁 components/     # Reusable UI components
  │   ├── 📁 order/      # Order-specific components
  │   │   ├── DictationForm.tsx     # Component for dictating new orders
  │   │   ├── PatientInfoCard.tsx   # Displays patient information
  │   │   └── ValidationView.tsx    # Displays validation results
  │   └── 📁 ui/         # UI components from shadcn
  │
  ├── 📁 lib/            # Utilities, hooks, and mock data
  │   ├── mock-data.ts   # Mock data for demonstration
  │   ├── queryClient.ts # React Query configuration
  │   ├── roles.ts       # Role definitions and access control
  │   └── utils.ts       # Utility functions
  │
  ├── 📁 pages/          # Application pages/screens
  │   ├── 📁 auth/       # Authentication-related pages
  │   │   ├── AcceptInvitation.tsx  # For accepting user invitations
  │   │   ├── ForgotPassword.tsx    # Password recovery request
  │   │   ├── Login.tsx             # User login
  │   │   ├── Register.tsx          # User and organization registration
  │   │   └── ResetPassword.tsx     # Reset password form
  │   │
  │   ├── AdminOrderFinalization.tsx # Order completion by admin staff
  │   ├── AdminQueue.tsx            # Queue for administrative staff
  │   ├── BillingCredits.tsx        # Credit management and billing
  │   ├── Dashboard.tsx             # Main dashboard with stats and recent activity
  │   ├── MyProfile.tsx             # User profile management
  │   ├── NewOrder.tsx              # Create new imaging orders
  │   ├── OrderList.tsx             # List of all orders
  │   ├── RadiologyQueue.tsx        # Queue for radiology staff
  │   └── Security.tsx              # Security settings and account protection
  │
  ├── App.tsx           # Main application component with routing
  ├── index.css         # Global styles
  └── main.tsx          # Application entry point
```

## Implemented Pages and Flows

### Authentication Screens

1. **Login Page** (`/auth/Login.tsx`)
   - User login form with email and password
   - "Remember me" option and "Forgot password" link
   - Visual branding with the RadOrderPad logo

2. **Registration Page** (`/auth/Register.tsx`)
   - Tabbed interface for organization or trial user registration
   - Organization registration with details and initial admin user setup
   - Trial user registration with simplified form

3. **Forgot Password** (`/auth/ForgotPassword.tsx`)
   - Request password reset with email
   - Confirmation screen after submission

4. **Reset Password** (`/auth/ResetPassword.tsx`)
   - Set new password with confirmation
   - Password strength validation
   - Success confirmation

5. **Accept Invitation** (`/auth/AcceptInvitation.tsx`)
   - Complete registration after receiving an invitation email
   - Shows organization and role details
   - Password creation and terms acceptance

### Core Order Workflow

1. **New Order** (`/NewOrder.tsx`)
   - Patient information display
   - Dictation form with modality selection
   - Validation results with suggested codes
   - Order confirmation and submission

2. **Order Validation** (`/components/order/ValidationView.tsx`)
   - Display validation results from AI processing
   - Shows compliance scores and feedback
   - Suggested diagnostic codes with confidence levels
   - Option to sign or edit order

3. **Dictation** (`/components/order/DictationForm.tsx`)
   - Text area for dictation input
   - Simulated voice recording functionality
   - Modality selection dropdown
   - Form validation

4. **Admin Order Finalization** (`/AdminOrderFinalization.tsx`)
   - Complete patient demographics
   - Add insurance information
   - Additional details and notes
   - Credit usage confirmation before submission

### Queue Screens

1. **Admin Queue** (`/AdminQueue.tsx`)
   - List of orders pending administrative completion
   - Filtering and search capabilities
   - Action buttons for order completion
   - Status indicators

2. **Radiology Queue** (`/RadiologyQueue.tsx`)
   - List of orders pending scheduling by radiology staff
   - Filtering by modality
   - Referring physician information
   - Scheduling actions

3. **Order List** (`/OrderList.tsx`)
   - Complete list of all orders
   - Status filtering and search
   - Different action buttons based on order status
   - Visual status indicators

### Dashboard and Account Management

1. **Dashboard** (`/Dashboard.tsx`)
   - Overview of key statistics
   - Recent orders table
   - Quick action buttons
   - Analytics tab with charts and metrics

2. **Billing & Credits** (`/BillingCredits.tsx`)
   - Credit balance display
   - Credit package purchase options
   - Transaction history
   - Auto-reload settings
   - Payment method management

3. **My Profile** (`/MyProfile.tsx`)
   - User information display and editing
   - Professional details and credentials
   - Connected accounts and integrations
   - Notification preferences

4. **Security** (`/Security.tsx`)
   - Password management
   - Two-factor authentication setup
   - Login activity monitoring
   - Security recommendations
   - Connected devices management

## User Roles

The application supports several user roles with different access levels:

1. **Physician** - Can create orders, view order history, and manage their profile
2. **Administrative Staff** - Can complete order details, manage patients, and handle administrative tasks
3. **Administrative Referring** - Organization admin for referring physicians' practices
4. **Scheduler** - Radiology staff responsible for scheduling studies
5. **Administrative Radiology** - Organization admin for radiology groups
6. **Radiologist** - Can view and report on studies
7. **Trial Physician** - Limited access for trial users
8. **Super Admin** - Full system access (not implemented in current mockup)

## Technology Stack

- **React** - Frontend library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Reusable component library
- **Lucide React** - Icon library
- **Recharts** - Charting library for analytics visualizations

## Mock Data

The application uses mock data (defined in `lib/mock-data.ts`) to simulate real-world usage without requiring a backend. This includes:

- Patient records
- Order information
- User data
- Transaction history
- Activity logs

## Design System

The UI follows a clean, minimalist design approach with:

- Consistent spacing and layout
- Color-coded status indicators
- Card-based UI components
- Clear typography hierarchy
- Responsive design for all screen sizes

## Future Development

Potential next steps for the mockup include:

- Organization Profile page
- Locations Management
- Users Management
- Connections Management
- Trial Validation Sandbox

## Note

This is a non-functional UI mockup intended to demonstrate the user interface and experience of the RadOrderPad platform. It does not include actual backend functionality or data persistence.