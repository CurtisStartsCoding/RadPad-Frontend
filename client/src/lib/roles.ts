// Available user roles in the application
export enum UserRole {
  Physician = "physician",
  AdminStaff = "admin_staff",
  AdminReferring = "admin_referring",
  Scheduler = "scheduler",
  AdminRadiology = "admin_radiology",
  Radiologist = "radiologist",
  TrialPhysician = "trial_physician",
  SuperAdmin = "super_admin"
}

// User-friendly display names for each role
export const roleDisplayNames: Record<UserRole, string> = {
  [UserRole.Physician]: "Referring Physician",
  [UserRole.AdminStaff]: "Administrative Staff",
  [UserRole.AdminReferring]: "Referring Admin",
  [UserRole.Scheduler]: "Radiology Scheduler",
  [UserRole.AdminRadiology]: "Radiology Admin",
  [UserRole.Radiologist]: "Radiologist",
  [UserRole.TrialPhysician]: "Trial User",
  [UserRole.SuperAdmin]: "Super Admin"
};

// Helper function to determine if a role has access to a specific page
export const hasAccess = (role: UserRole, page: string): boolean => {
  // SPECIAL CASE: Trial users can ONLY access new-order, profile, and security
  // This ensures the hamburger menu only shows these options for trial users
  if (role === UserRole.TrialPhysician) {
    // Only allow trial users to access these specific pages
    return ['new-order', 'profile', 'security', 'trial-auth', 'trial', 'trial-validation'].includes(page);
  }
  
  // For all other roles, use the access map
  // Map from page to roles that can access that page
  const accessMap: Record<string, UserRole[]> = {
    // Core Workflow
    "dashboard": [
      UserRole.Physician,
      UserRole.AdminStaff,
      UserRole.AdminReferring
    ],
    "new-order": [
      UserRole.Physician,
      UserRole.TrialPhysician
    ],
    "orders": [
      UserRole.Physician, 
      UserRole.AdminStaff, 
      UserRole.AdminReferring
    ],
    "order-details": [
      UserRole.Physician, 
      UserRole.AdminStaff, 
      UserRole.AdminReferring,
      UserRole.Scheduler,
      UserRole.AdminRadiology,
      UserRole.Radiologist
    ],
    "patient-history": [
      UserRole.Physician, 
      UserRole.AdminStaff, 
      UserRole.AdminReferring
    ],
    "admin-queue": [
      UserRole.AdminStaff, 
      UserRole.AdminReferring
    ],
    "admin-order-finalization": [
      UserRole.AdminStaff, 
      UserRole.AdminReferring
    ],
    "radiology-queue": [
      UserRole.Scheduler, 
      UserRole.AdminRadiology, 
      UserRole.Radiologist
    ],
    
    // Organization Management
    "org-profile": [
      UserRole.AdminReferring, 
      UserRole.AdminRadiology
    ],
    "locations": [
      UserRole.AdminReferring, 
      UserRole.AdminRadiology
    ],
    "users": [
      UserRole.AdminReferring, 
      UserRole.AdminRadiology
    ],
    "connections": [
      UserRole.AdminReferring, 
      UserRole.AdminRadiology
    ],
    "billing": [
      UserRole.AdminReferring, 
      UserRole.AdminRadiology
    ],
    "billing-test": [
      UserRole.AdminReferring, 
      UserRole.AdminRadiology,
      UserRole.Physician,
      UserRole.Radiologist,
      UserRole.SuperAdmin
    ],
    
    // User Settings (available for all authenticated users)
    "profile": [
      UserRole.Physician,
      UserRole.AdminStaff,
      UserRole.AdminReferring,
      UserRole.Scheduler,
      UserRole.AdminRadiology,
      UserRole.Radiologist,
      UserRole.TrialPhysician,
      UserRole.SuperAdmin
    ],
    "security": [
      UserRole.Physician,
      UserRole.AdminStaff,
      UserRole.AdminReferring,
      UserRole.Scheduler,
      UserRole.AdminRadiology,
      UserRole.Radiologist,
      UserRole.TrialPhysician,
      UserRole.SuperAdmin
    ],
    
    // Auth pages (accessible to all users)
    "login": [
      UserRole.Physician,
      UserRole.AdminStaff,
      UserRole.AdminReferring,
      UserRole.Scheduler,
      UserRole.AdminRadiology,
      UserRole.Radiologist,
      UserRole.TrialPhysician,
      UserRole.SuperAdmin
    ],
    "trial-auth": [
      UserRole.Physician,
      UserRole.AdminStaff,
      UserRole.AdminReferring,
      UserRole.Scheduler,
      UserRole.AdminRadiology,
      UserRole.Radiologist,
      UserRole.TrialPhysician,
      UserRole.SuperAdmin
    ],
    
    // Onboarding pages (primarily for admins)
    "org-signup": [
      UserRole.AdminReferring,
      UserRole.AdminRadiology,
      UserRole.SuperAdmin
    ],
    "org-verification": [
      UserRole.AdminReferring,
      UserRole.AdminRadiology,
      UserRole.SuperAdmin
    ],
    "org-setup": [
      UserRole.AdminReferring,
      UserRole.AdminRadiology,
      UserRole.SuperAdmin
    ],
    "org-locations": [
      UserRole.AdminReferring,
      UserRole.AdminRadiology,
      UserRole.SuperAdmin
    ],
    "org-users": [
      UserRole.AdminReferring,
      UserRole.AdminRadiology,
      UserRole.SuperAdmin
    ],
    
    // Super Admin specific pages
    "superadmin-dashboard": [UserRole.SuperAdmin],
    "superadmin-organizations": [UserRole.SuperAdmin],
    "superadmin-users": [UserRole.SuperAdmin],
    "superadmin-logs": [UserRole.SuperAdmin],
    "superadmin-billing": [UserRole.SuperAdmin]
  };
  
  // Return true if the role is in the list of roles for this page
  return accessMap[page]?.includes(role) || false;
};

// Helper function to check if a user can view order details
export const canViewOrderDetails = (role: UserRole): boolean => {
  // All authenticated users who can access orders can view order details
  return hasAccess(role, "orders") || hasAccess(role, "order-details");
};

// Helper function to check if a user can view patient history
export const canViewPatientHistory = (role: UserRole): boolean => {
  return hasAccess(role, "patient-history");
};

// Helper function to check if a user can view completed orders
export const canViewCompletedOrders = (role: UserRole): boolean => {
  // All referring organization roles can view completed orders
  // Radiology roles can also view completed orders they processed
  return [
    UserRole.Physician,
    UserRole.AdminStaff, 
    UserRole.AdminReferring,
    UserRole.Scheduler,
    UserRole.AdminRadiology,
    UserRole.Radiologist
  ].includes(role);
};

// Helper function to determine what actions are available for an order status
export const getAvailableOrderActions = (
  role: UserRole, 
  orderStatus: string
): {
  canView: boolean;
  canDownload: boolean;
  canPrint: boolean;
  canViewPatient: boolean;
} => {
  const canView = canViewOrderDetails(role);
  const canViewPatient = canViewPatientHistory(role);
  
  // For completed orders, all referring roles can download/print
  const canDownloadPrint = ['completed', 'results_available', 'results_acknowledged'].includes(orderStatus) 
    && [UserRole.Physician, UserRole.AdminStaff, UserRole.AdminReferring].includes(role);
  
  return {
    canView,
    canDownload: canDownloadPrint,
    canPrint: canDownloadPrint,
    canViewPatient
  };
};