// Available user roles in the application
export enum UserRole {
  Physician = "physician",
  AdminStaff = "admin_staff",
  AdminReferring = "admin_referring",
  Scheduler = "scheduler",
  AdminRadiology = "admin_radiology",
  Radiologist = "radiologist",
  TrialPhysician = "trial_physician",
  SuperAdmin = "super_admin",
  TrialUser = "trial-user"
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
  [UserRole.SuperAdmin]: "Super Admin",
  [UserRole.TrialUser]: "Trial User"
};

// Helper function to determine if a role has access to a specific page
export const hasAccess = (role: UserRole, page: string): boolean => {
  // Map from page to roles that can access that page
  const accessMap: Record<string, UserRole[]> = {
    // Core Workflow
    "dashboard": [
      UserRole.Physician,
      UserRole.AdminStaff,
      UserRole.AdminReferring,
      UserRole.TrialUser
    ],
    "new-order": [
      UserRole.Physician,
      UserRole.TrialPhysician,
      UserRole.TrialUser
    ],
    "orders": [
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
      UserRole.SuperAdmin,
      UserRole.TrialUser
    ],
    "security": [
      UserRole.Physician,
      UserRole.AdminStaff,
      UserRole.AdminReferring,
      UserRole.Scheduler,
      UserRole.AdminRadiology,
      UserRole.Radiologist,
      UserRole.TrialPhysician,
      UserRole.SuperAdmin,
      UserRole.TrialUser
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
      UserRole.SuperAdmin,
      UserRole.TrialUser
    ],
    "trial-auth": [
      UserRole.Physician,
      UserRole.AdminStaff,
      UserRole.AdminReferring,
      UserRole.Scheduler,
      UserRole.AdminRadiology,
      UserRole.Radiologist,
      UserRole.TrialPhysician,
      UserRole.SuperAdmin,
      UserRole.TrialUser
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