Okay, let's break down the necessary pages/screens for the RadOrderPad UI based on the API documentation and workflows. While 27 might be a specific count from a previous plan, the key is covering all functionalities logically. We'll aim for clarity and group related actions where it makes sense.

Following the page list, I'll provide a detailed style guide inspired by a clean, minimalist, functional aesthetic often associated with Jony Ive's design principles at Apple.

## RadOrderPad UI Page/Screen Breakdown

Here's a breakdown of the logical screens needed, grouped by user area/workflow:

**I. Public / Authentication Screens (Approx. 5 Pages)**

1.  **Login Page**
    *   **Purpose:** Allow registered users (all types, including trial) to log in.
    *   **Key Elements:** Email input, Password input, "Forgot Password?" link, Login button, Link to Registration (optional), CAPTCHA (implied).
    *   **Roles:** Public.
2.  **Organization Registration Page**
    *   **Purpose:** Allow new organizations to register themselves and an initial admin user.
    *   **Key Elements:** Form with fields for Organization details (Name, Type, NPI, Address, Contact etc.) and initial Admin User details (Name, Email, Password, Role etc.), CAPTCHA, Submit button.
    *   **Roles:** Public.
3.  **Trial User Registration Page**
    *   **Purpose:** Allow physicians to register for the trial sandbox.
    *   **Key Elements:** Simplified form (Email, Password, First Name, Last Name, Specialty), Submit button.
    *   **Roles:** Public.
4.  **Forgot/Reset Password Flow**
    *   **Page 1: Request Reset:** Email input, Submit button.
    *   **Page 2: Reset Password:** (Accessed via email link) New Password input, Confirm Password input, Submit button.
    *   **Roles:** Public.
5.  **Accept Invitation Page**
    *   **Purpose:** Allow invited users to complete their registration.
    *   **Key Elements:** (Accessed via email link) Displays inviter/org info, Password input, Confirm Password input, Accept Terms checkbox, Complete Registration button.
    *   **Roles:** Public (requires valid token).

**II. Core Order Workflow Screens (Referring Physician/Staff) (Approx. 3-4 Logical Screens)**

6.  **Dashboard / Order List (Referring)**
    *   **Purpose:** View recent orders, potentially key stats, navigate to create new orders or view history.
    *   **Key Elements:** List/Table of recent orders (Patient Name, Date, Status, Modality), "New Order" button, Filters (Status, Date Range), Search bar, Pagination.
    *   **Roles:** Physician, Admin Staff, Admin Referring.
7.  **New Order / Validation Interface (`OrderInterface.tsx`)**
    *   **Purpose:** The main workflow for creating, validating, and signing an order. This is a multi-step interface within one logical screen.
    *   **Key Elements:**
        *   **Patient Info:** Display selected patient / "Unknown Patient" card, "Edit/Add Patient" button (triggers Patient ID Dictation modal).
        *   **Step 1 (Dictation):** Textarea for dictation, Voice input button, Modality selection (required), "Process Order" button, Validation feedback display area, Override button (appears after attempts).
        *   **Step 2 (Validation View):** Display validation results (Feedback, Compliance Score, Suggested ICD-10/CPT codes), Display original dictation/modality, "Edit Dictation" (Back) button, "Sign Order" button.
        *   **Step 3 (Signature):** Display summary, Signature capture canvas, Typed name confirmation input, "Back" button, "Submit Order" / "Sign & Queue for Admin" button.
    *   **Modals:** Patient Identification Dictation modal, Override Justification modal.
    *   **Roles:** Physician.
8.  **Order Detail View (Referring)**
    *   **Purpose:** Allow physicians/staff to view the details of a specific submitted or historical order.
    *   **Key Elements:** Read-only display of all order details (Patient, Clinical Info, Codes, Status, History, Documents).
    *   **Roles:** Physician, Admin Staff, Admin Referring.
9.  **Trial Validation Sandbox (`TrialValidationInterface.tsx`)**
    *   **Purpose:** Dedicated interface for trial users to test validation.
    *   **Key Elements:** Modality selection, Dictation input (text/voice), "Validate Dictation" button, Validation results display (Feedback, Codes), "Validate Another" button, Remaining validations counter. (No patient info card, no signature, no override).
    *   **Roles:** Trial Physician.

**III. Admin Workflow Screens (Referring Staff/Admin) (Approx. 2 Pages)**

10. **Admin Order Queue**
    *   **Purpose:** View orders signed by physicians awaiting admin finalization (`pending_admin` status).
    *   **Key Elements:** List/Table of orders (Patient Name, Physician, Date Signed, Modality), Filters (Physician, Date Range), Search bar, Pagination, Button/Link to view order details.
    *   **Roles:** Admin Staff, Admin Referring.
11. **Admin Order Finalization View**
    *   **Purpose:** Review order details, add/edit patient demographics, add/edit insurance, add supplemental info, send to radiology.
    *   **Key Elements:** Display of all order details (from physician step), Editable Patient Demographics section, Editable Insurance Information section, Textarea/Upload for Supplemental EMR info, "Send to Radiology" button (triggers credit check), Button to add notes/flags (optional).
    *   **Roles:** Admin Staff, Admin Referring.

**IV. Radiology Workflow Screens (Radiology Roles) (Approx. 2 Pages)**

12. **Radiology Order Queue**
    *   **Purpose:** View incoming orders from referring practices (`pending_radiology`, `scheduled`, `completed` statuses).
    *   **Key Elements:** List/Table of orders (Patient Name, Referring Org/Physician, Date Received, Modality, Priority, Status), Filters (Referring Org, Status, Priority, Modality, Date Range), Search bar, Pagination, Button/Link to view order details.
    *   **Roles:** Scheduler, Admin Radiology, Radiologist.
13. **Radiology Order Detail View**
    *   **Purpose:** View complete order details, update status, request additional information.
    *   **Key Elements:** Display of all order details (Patient, Insurance, Clinical Info, Codes, Documents, History), "Update Status" action (e.g., dropdown/modal to change to Scheduled/Completed), "Request Information" action (modal to specify needed info and send back to referring org), (Future: Add Results section for Radiologist).
    *   **Roles:** Scheduler, Admin Radiology, Radiologist (Radiologist might have read-only + results).

**V. Organization Management Screens (Admin Referring/Radiology) (Approx. 5 Pages)**

14. **Organization Profile Page**
    *   **Purpose:** View and edit the organization's own profile details.
    *   **Key Elements:** Display of Org Info (Name, Type, NPI, Address, Contact), Edit button(s) leading to forms/modals for updating sections (Basic Info, Address, Billing Info, Specialties, Logo).
    *   **Roles:** Admin Referring, Admin Radiology.
15. **Location Management Page**
    *   **Purpose:** View, add, edit, and deactivate organization locations.
    *   **Key Elements:** List/Table of locations (Name, Address, Status), "Add Location" button, Actions per location (Edit, Deactivate/Activate, Set as Primary), Form/Modal for adding/editing location details (Name, Address, Contact, Hours, Services).
    *   **Roles:** Admin Referring, Admin Radiology.
16. **User Management Page**
    *   **Purpose:** View, invite, edit, and deactivate users within the organization. Assign users to locations.
    *   **Key Elements:** List/Table of users (Name, Email, Role, Status, Locations), "Invite User" button, Actions per user (Edit Profile, Change Status, Reset Password - maybe, Manage Location Assignments), Invite User form/modal, Edit User form/modal, Location Assignment interface (e.g., multi-select or dedicated modal).
    *   **Roles:** Admin Referring, Admin Radiology.
17. **Connection Management Page**
    *   **Purpose:** Manage connections with partner organizations.
    *   **Key Elements:** Tabs/Sections for Pending Incoming Requests, Pending Outgoing Requests, Established Connections, Terminated Connections. List/Table for each section showing partner org details and status. Actions: "Request New Connection" button (leads to search/request flow), Approve/Reject buttons for incoming requests, Terminate button for established connections.
    *   **Roles:** Admin Referring, Admin Radiology.
18. **Billing & Credits Page**
    *   **Purpose:** View credit balance, purchase credits, view transaction history, manage subscription (if applicable).
    *   **Key Elements:** Display current credit balance, List of available credit packages/subscription tiers, "Purchase Credits"/"Manage Subscription" button (links to Stripe Checkout/Portal), Table of credit usage/transaction history, Auto-reload settings (optional).
    *   **Roles:** Admin Referring, Admin Radiology (maybe view-only for Radiology).

**VI. User Settings Screens (All Authenticated Roles) (Approx. 2 Pages)**

19. **My Profile Page**
    *   **Purpose:** Allow users to view and edit their own profile information.
    *   **Key Elements:** Display of user's info (Name, Email, Role, Org, Specialty, Phone), Edit button(s) leading to forms/modals for updating editable fields (Name, Phone, Specialty), Profile Picture upload/remove.
    *   **Roles:** All authenticated users.
20. **Security Settings Page**
    *   **Purpose:** Allow users to change their password and manage security settings like 2FA.
    *   **Key Elements:** Change Password form (Current, New, Confirm), 2FA setup/management section (Enable/Disable, View Recovery Codes).
    *   **Roles:** All authenticated users.

**VII. Super Admin Screens (Approx. 6 Pages)**

21. **Super Admin Dashboard**
    *   **Purpose:** Overview of system health, key metrics, recent activity.
    *   **Key Elements:** Stats cards (Total Orgs, Users, Orders, Validations), System Health status indicator, Recent activity feed, Links to management sections.
    *   **Roles:** Super Admin.
22. **SA Organization List Page**
    *   **Purpose:** View and search all organizations in the system.
    *   **Key Elements:** List/Table of all organizations (Name, ID, Type, Status, User Count, Created Date), Filters (Name, Type, Status), Search bar, Pagination, Link to view Org Details.
    *   **Roles:** Super Admin.
23. **SA Organization Detail Page**
    *   **Purpose:** View comprehensive details of a specific organization and perform administrative actions.
    *   **Key Elements:** Display all Org details, List of Users in Org (link to SA User Detail), List of Connections, Billing History, Purgatory History, Actions (Update Status, Adjust Credits, Manage Settings).
    *   **Roles:** Super Admin.
24. **SA User List Page**
    *   **Purpose:** View and search all users across all organizations.
    *   **Key Elements:** List/Table of all users (Name, Email, Role, Org Name, Status), Filters (Email, Org, Role, Status), Search bar, Pagination, Link to view User Details.
    *   **Roles:** Super Admin.
25. **SA User Detail Page**
    *   **Purpose:** View comprehensive details of a specific user and perform administrative actions.
    *   **Key Elements:** Display all User details (including Org info), Activity Log, Login History, Actions (Update Status, Reset Password, Manage Roles/Permissions, Transfer Org).
    *   **Roles:** Super Admin.
26. **SA Prompt & Log Management Page**
    *   **Purpose:** Manage LLM prompt templates, assignments, and view system logs.
    *   **Key Elements:** Tabs/Sections for Prompt Templates (List, Add, Edit, View Versions, Test), Prompt Assignments (List, Add, Edit, Delete), Log Viewer (Tabs/Filters for Validation Logs, Enhanced Validation Logs, Credit Logs, Purgatory Logs).
    *   **Roles:** Super Admin.

**Total:** This list comes out to 26 logical pages/screens. Some are simple, while others (like `OrderInterface` or the SA Detail pages) are complex interfaces. This aligns closely with the user's estimate of 27.

---

## RadOrderPad UI Style Guide (Minimalist & Functional)

**I. Core Principles:**

*   **Simplicity:** Reduce visual clutter. Focus on content and essential actions.
*   **Clarity:** Information hierarchy should be obvious. Legible typography. Clear affordances for interactive elements.
*   **Functionality:** Design should support the workflow efficiently. Prioritize task completion.
*   **Consistency:** Maintain uniform patterns, spacing, typography, and color usage across all screens.
*   **Subtlety:** Use animations and transitions sparingly and purposefully. Avoid overly decorative elements.

**II. Color Palette:**

*   **Primary Background:** White (`#FFFFFF`) or very light gray (`#F9FAFB` - Tailwind's gray-50).
*   **Content Background:** White (`#FFFFFF`) for cards, modals.
*   **Primary Accent:** Professional Blue (e.g., `#2563EB` - Tailwind's blue-600 for buttons, links, active states).
*   **Secondary Accent (Success):** Green (e.g., `#10B981` - Tailwind's emerald-500).
*   **Warning Accent:** Amber/Yellow (e.g., `#F59E0B` - Tailwind's amber-500).
*   **Error/Destructive Accent:** Red (e.g., `#EF4444` - Tailwind's red-500).
*   **Text (Primary):** Dark Gray (e.g., `#1F2937` - Tailwind's gray-800).
*   **Text (Secondary):** Medium Gray (e.g., `#6B7280` - Tailwind's gray-500).
*   **Borders/Dividers:** Light Gray (e.g., `#E5E7EB` - Tailwind's gray-200).
*   **Disabled State:** Lighter Gray (e.g., `#D1D5DB` - Tailwind's gray-300 for text/borders, `#F3F4F6` - gray-100 for backgrounds).

**III. Typography:**

*   **Font Family:** Clean, readable sans-serif font. System fonts (SF Pro, Segoe UI, Roboto) or a web font like Inter.
    *   `font-sans` (Tailwind default).
*   **Hierarchy:**
    *   Page Titles (h1): `text-xl` or `text-2xl`, `font-semibold`, `text-gray-900`.
    *   Section Titles (h2, h3): `text-lg` or `text-md`, `font-medium`, `text-gray-900`.
    *   Body Text: `text-sm` or `text-base`, `text-gray-700` or `text-gray-800`.
    *   Labels/Metadata: `text-xs` or `text-sm`, `font-medium`, `text-gray-500` or `text-gray-600`.
*   **Line Height:** Slightly generous for readability (e.g., `leading-relaxed` or `leading-6` / `leading-7`).

**IV. Layout & Spacing:**

*   **Grid:** Use a consistent grid system (e.g., Tailwind's default grid utilities).
*   **Spacing:** Use a consistent spacing scale (Tailwind's default spacing scale based on `rem` is good, e.g., `p-4`, `m-2`, `space-y-4`). Emphasize whitespace.
*   **Containers:** Use `max-w-*` classes (e.g., `max-w-7xl`) with `mx-auto` for centered content on larger screens. Add padding (`px-4 sm:px-6 lg:px-8`).
*   **Responsiveness:** Design mobile-first or ensure layouts adapt gracefully using Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`).

**V. Components:**

*   **Buttons:**
    *   *Primary:* Solid background (Primary Accent), white text, subtle hover/focus states (slightly darker blue), rounded corners (`rounded-md` or `rounded-lg`). `px-4 py-2` or `px-6 py-3`.
    *   *Secondary:* White/light gray background, primary accent text, border (light gray or primary accent), hover state (light accent background). `px-4 py-2`.
    *   *Destructive:* Red background or red text/border.
    *   *Disabled:* Light gray background, lighter gray text, `cursor-not-allowed`.
*   **Inputs & Textareas:**
    *   Simple border (`border-gray-300`), rounded corners (`rounded-md`).
    *   Subtle background (`bg-white` or `bg-gray-50`).
    *   Clear focus state (e.g., `focus:ring-2 focus:ring-blue-500 focus:border-blue-500`).
    *   Error state: Red border (`border-red-500`), optional red focus ring.
    *   Placeholder text: Light gray (`placeholder-gray-400`).
*   **Cards/Containers:**
    *   Background: White (`bg-white`).
    *   Border: Subtle light gray (`border border-gray-200`).
    *   Shadow: Subtle shadow (`shadow-sm` or `shadow`).
    *   Rounding: `rounded-lg`.
    *   Padding: Consistent internal padding (`p-4` or `p-6`).
*   **Tables/Lists:**
    *   Clear separation between rows (e.g., `divide-y divide-gray-200`).
    *   Alternating row colors (optional, very light gray `bg-gray-50`).
    *   Subtle hover states (`hover:bg-gray-50`).
    *   Header row: Slightly bolder font (`font-medium`), gray background (`bg-gray-50`).
*   **Modals/Dialogs:**
    *   Centered overlay (`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center`).
    *   Card styling for the modal content itself (white background, rounded, shadow).
    *   Clear header, content, and footer/action areas.
*   **Indicators:**
    *   *Loading:* Simple spinners (SVG or CSS).
    *   *Progress Steps:* Minimalist dots or numbered circles, using accent colors for active/completed states (like `OrderProgressIndicator.tsx`).
    *   *Status Badges:* Small, rounded pills with appropriate background/text colors (e.g., green for 'Active', red for 'Terminated', amber for 'Pending'). `px-2 py-0.5 rounded-full text-xs font-medium`.
*   **Icons:** Use a clean, consistent icon set (e.g., Lucide-React). Keep size consistent (e.g., `h-4 w-4` or `h-5 w-5`). Use `text-gray-500` or `text-gray-600` for subtle icons, accent colors for emphasis.

**VI. Interaction & Animation:**

*   **Hover/Focus:** Provide clear but subtle visual feedback on interactive elements (buttons, links, inputs).
*   **Transitions:** Use smooth, quick transitions (`transition-colors duration-150 ease-in-out`). Avoid overly complex or slow animations.

This detailed breakdown and style guide should provide a solid foundation for creating mockups and subsequently building the RadOrderPad frontend UI in a consistent and functional manner. Remember to adapt the page list based on the actual user experience you want to create, potentially combining some screens or splitting complex ones further.