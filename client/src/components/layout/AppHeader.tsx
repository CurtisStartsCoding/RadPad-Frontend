import React, { useState } from "react";
import { Home, LogOut, Settings, FileText, Building2, User, CreditCard, Users, Stethoscope, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppPage } from "@/App";
import { UserRole, hasAccess } from "@/lib/roles";
import { useAuth } from "@/lib/useAuth";
import { useLocation } from "wouter";
import { getNewOrderPath } from "@/lib/navigation";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  onNavigate?: (page: AppPage) => void;
  className?: string;
  userRole?: UserRole;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title = "RadOrderPad",
  subtitle,
  onNavigate,
  className,
  userRole
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const { logout, user } = useAuth(); // Get all auth data in one call
  const [, setLocation] = useLocation();
  
  // ALWAYS prioritize the user role from auth context over the prop
  // This ensures we're always using the most up-to-date role information
  const effectiveRole = (user?.role || userRole || UserRole.Physician) as UserRole;
  
  // Force trial user check directly from auth context when available
  const isTrialUser = user?.role
    ? (user.role === UserRole.TrialUser || user.role === UserRole.TrialPhysician)
    : (effectiveRole === UserRole.TrialUser || effectiveRole === UserRole.TrialPhysician);
  
  // Add component-level logging to track role changes
  console.group('🔍 AppHeader Role Debug');
  console.log('Component mounted/updated');
  console.log('- User role from context:', user?.role);
  console.log('- User role from props:', userRole);
  console.log('- Effective role used:', effectiveRole);
  console.log('- Is trial user:', isTrialUser);
  console.groupEnd();
  
  const handleNavigation = (page: AppPage) => {
    // First, update the current page state
    if (onNavigate) {
      onNavigate(page);
    }
    
    // Close the menu immediately to avoid UI issues
    setShowMenu(false);
    
    // Debug user role information
    console.log("Navigation debug info:");
    console.log("- User role from context:", user?.role);
    console.log("- User role from props:", userRole);
    console.log("- Effective role:", effectiveRole);
    console.log("- Is trial user?", isTrialUser);
    console.log("- UserRole.TrialUser value:", UserRole.TrialUser);
    
    // Update URL based on the page
    switch (page) {
      case AppPage.Profile:
        setLocation("/profile");
        break;
      case AppPage.Dashboard:
        setLocation("/");
        break;
      case AppPage.NewOrder:
        // Use the navigation utility to determine the correct path
        const newOrderPath = getNewOrderPath(effectiveRole);
        console.log(`Redirecting user to ${newOrderPath}`);
        setLocation(newOrderPath);
        break;
      case AppPage.Security:
        console.log("Navigating to Security page");
        setLocation("/security");
        break;
      // Add other cases as needed for other pages
      default:
        // For other pages, you might want to derive the URL from the page enum
        const pageUrl = `/${page.toLowerCase().replace('_', '-')}`;
        setLocation(pageUrl);
    }
  };
  
  // Handle logout action
  const handleLogout = async () => {
    try {
      await logout();
      console.log("User logged out successfully");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      // Always navigate to login page, even if logout fails
      handleNavigation(AppPage.Login);
    }
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (user && user.name) {
      return user.name;
    }
    
    // Fallback based on role if user name is not available
    switch(userRole) {
      case UserRole.Physician:
        return "Dr. Jane Smith";
      case UserRole.Radiologist:
        return "Dr. Robert Lee";
      case UserRole.AdminRadiology:
        return "Maria Johnson";
      case UserRole.AdminReferring:
        return "David Wilson";
      case UserRole.AdminStaff:
        return "Sarah Brown";
      case UserRole.SuperAdmin:
        return "Admin User";
      default:
        return "John Doe";
    }
  };
  
  // Get user email
  const getUserEmail = () => {
    if (user && user.email) {
      return user.email;
    }
    
    // Fallback based on role if user email is not available
    switch(userRole) {
      case UserRole.Physician:
        return "drjane@example.com";
      case UserRole.Radiologist:
        return "drlee@radiology.com";
      case UserRole.AdminRadiology:
        return "maria@radiology.com";
      case UserRole.AdminReferring:
        return "david@clinic.com";
      case UserRole.AdminStaff:
        return "sarah@clinic.com";
      case UserRole.SuperAdmin:
        return "admin@radorderpad.com";
      default:
        return "user@example.com";
    }
  };
  
  // Generate menu items based on user role access
  const getMenuItems = () => {
    const menuItems = [];
    
    // ALWAYS get the most up-to-date role information directly from auth context
    const currentEffectiveRole = user?.role
      ? (user.role as UserRole)
      : (userRole || UserRole.Physician) as UserRole;
    
    const isTrialUserToUse = user?.role
      ? (user.role === UserRole.TrialUser || user.role === UserRole.TrialPhysician)
      : (currentEffectiveRole === UserRole.TrialUser || currentEffectiveRole === UserRole.TrialPhysician);
    
    console.log('Menu items being generated for role:', currentEffectiveRole);
    console.log('Is trial user?', isTrialUserToUse);
    
    // For trial users, ONLY show New Order, My Profile, Security, and Log out
    // Return early to prevent adding any other menu items
    if (isTrialUserToUse) {
      return [
        // New Order
        <button
          key="new-order"
          className="flex items-center w-full px-3 py-2.5 text-gray-800 hover:bg-gray-100 rounded-md"
          onClick={() => handleNavigation(AppPage.NewOrder)}
        >
          <Stethoscope className="h-4 w-4 mr-3 text-gray-500" />
          <span>New Order</span>
        </button>,

        // My Profile
        <button
          key="profile"
          className="flex items-center w-full px-3 py-2.5 text-gray-800 hover:bg-gray-100 rounded-md"
          onClick={() => handleNavigation(AppPage.Profile)}
        >
          <User className="h-4 w-4 mr-3 text-gray-500" />
          <span>My Profile</span>
        </button>,

        // Security
        <button
          key="security"
          className="flex items-center w-full px-3 py-2.5 text-gray-800 hover:bg-gray-100 rounded-md"
          onClick={() => handleNavigation(AppPage.Security)}
        >
          <Settings className="h-4 w-4 mr-3 text-gray-500" />
          <span>Security</span>
        </button>,

        // Log out
        <button
          key="logout"
          className="flex items-center w-full px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-md"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-3" />
          <span>Log out</span>
        </button>
      ];
    }

    // For non-trial users, show all authorized menu items
    if (hasAccess(currentEffectiveRole, AppPage.Dashboard)) {
      menuItems.push(
        <button
          key="home"
          className="flex items-center w-full px-3 py-2.5 text-gray-800 hover:bg-gray-100 rounded-md"
          onClick={() => handleNavigation(AppPage.Dashboard)}
        >
          <Home className="h-4 w-4 mr-3 text-gray-500" />
          <span>Dashboard</span>
        </button>
      );
    }
    
    // New Order (for physicians only)
    if (hasAccess(currentEffectiveRole, AppPage.NewOrder)) {
      menuItems.push(
        <button
          key="new-order"
          className="flex items-center w-full px-3 py-2.5 text-gray-800 hover:bg-gray-100 rounded-md"
          onClick={() => handleNavigation(AppPage.NewOrder)}
        >
          <Stethoscope className="h-4 w-4 mr-3 text-gray-500" />
          <span>New Order</span>
        </button>
      );
    }
    
    // Orders List - double check access
    if (!isTrialUserToUse && hasAccess(currentEffectiveRole, AppPage.OrderList)) {
      menuItems.push(
        <button
          key="orders"
          className="flex items-center w-full px-3 py-2.5 text-gray-800 hover:bg-gray-100 rounded-md"
          onClick={() => handleNavigation(AppPage.OrderList)}
        >
          <ListChecks className="h-4 w-4 mr-3 text-gray-500" />
          <span>Orders</span>
        </button>
      );
    }
    
    // Admin Queue (for admin staff) - double check access
    if (!isTrialUserToUse && hasAccess(currentEffectiveRole, AppPage.AdminQueue)) {
      menuItems.push(
        <button
          key="admin-queue"
          className="flex items-center w-full px-3 py-2.5 text-gray-800 hover:bg-gray-100 rounded-md"
          onClick={() => handleNavigation(AppPage.AdminQueue)}
        >
          <FileText className="h-4 w-4 mr-3 text-gray-500" />
          <span>Admin Queue</span>
        </button>
      );
    }
    
    // Radiology Queue (for radiology staff) - double check access
    if (!isTrialUserToUse && hasAccess(currentEffectiveRole, AppPage.RadiologyQueue)) {
      menuItems.push(
        <button 
          key="radiology-queue"
          className="flex items-center w-full px-3 py-2.5 text-gray-800 hover:bg-gray-100 rounded-md"
          onClick={() => handleNavigation(AppPage.RadiologyQueue)}
        >
          <FileText className="h-4 w-4 mr-3 text-gray-500" />
          <span>Radiology Queue</span>
        </button>
      );
    }
    
    // Organization Profile - double check access
    if (!isTrialUserToUse && hasAccess(currentEffectiveRole, AppPage.OrgProfile)) {
      menuItems.push(
        <button 
          key="org-profile"
          className="flex items-center w-full px-3 py-2.5 text-gray-800 hover:bg-gray-100 rounded-md"
          onClick={() => handleNavigation(AppPage.OrgProfile)}
        >
          <Building2 className="h-4 w-4 mr-3 text-gray-500" />
          <span>Organization</span>
        </button>
      );
    }
    
    // Users management - double check access
    if (!isTrialUserToUse && hasAccess(currentEffectiveRole, AppPage.Users)) {
      menuItems.push(
        <button 
          key="users"
          className="flex items-center w-full px-3 py-2.5 text-gray-800 hover:bg-gray-100 rounded-md"
          onClick={() => handleNavigation(AppPage.Users)}
        >
          <Users className="h-4 w-4 mr-3 text-gray-500" />
          <span>Users</span>
        </button>
      );
    }
    
    // Billing - double check access
    if (!isTrialUserToUse && hasAccess(currentEffectiveRole, AppPage.Billing)) {
      menuItems.push(
        <button 
          key="billing"
          className="flex items-center w-full px-3 py-2.5 text-gray-800 hover:bg-gray-100 rounded-md"
          onClick={() => handleNavigation(AppPage.Billing)}
        >
          <CreditCard className="h-4 w-4 mr-3 text-gray-500" />
          <span>Billing & Credits</span>
        </button>
      );
    }
    
    // Add profile and security for non-trial users (these are always available)
    menuItems.push(
      <button
        key="profile"
        className="flex items-center w-full px-3 py-2.5 text-gray-800 hover:bg-gray-100 rounded-md"
        onClick={() => handleNavigation(AppPage.Profile)}
      >
        <User className="h-4 w-4 mr-3 text-gray-500" />
        <span>My Profile</span>
      </button>,
      <button
        key="security"
        className="flex items-center w-full px-3 py-2.5 text-gray-800 hover:bg-gray-100 rounded-md"
        onClick={() => handleNavigation(AppPage.Security)}
      >
        <Settings className="h-4 w-4 mr-3 text-gray-500" />
        <span>Security</span>
      </button>
    );
    
    // Super Admin sections - double check access
    if (!isTrialUserToUse && currentEffectiveRole === UserRole.SuperAdmin) {
      menuItems.push(
        <button 
          key="superadmin-dashboard"
          className="flex items-center w-full px-3 py-2.5 text-gray-800 hover:bg-gray-100 rounded-md"
          onClick={() => handleNavigation(AppPage.SuperAdminDashboard)}
        >
          <Home className="h-4 w-4 mr-3 text-gray-500" />
          <span>Admin Dashboard</span>
        </button>
      );
      
      menuItems.push(
        <button 
          key="superadmin-organizations"
          className="flex items-center w-full px-3 py-2.5 text-gray-800 hover:bg-gray-100 rounded-md"
          onClick={() => handleNavigation(AppPage.SuperAdminOrganizations)}
        >
          <Building2 className="h-4 w-4 mr-3 text-gray-500" />
          <span>Organizations</span>
        </button>
      );
      
      menuItems.push(
        <button 
          key="superadmin-users"
          className="flex items-center w-full px-3 py-2.5 text-gray-800 hover:bg-gray-100 rounded-md"
          onClick={() => handleNavigation(AppPage.SuperAdminUsers)}
        >
          <Users className="h-4 w-4 mr-3 text-gray-500" />
          <span>All Users</span>
        </button>
      );
      
      menuItems.push(
        <button 
          key="superadmin-logs"
          className="flex items-center w-full px-3 py-2.5 text-gray-800 hover:bg-gray-100 rounded-md"
          onClick={() => handleNavigation(AppPage.SuperAdminLogs)}
        >
          <FileText className="h-4 w-4 mr-3 text-gray-500" />
          <span>System Logs</span>
        </button>
      );
    }
    
    return menuItems;
  };
  
  return (
    <header className={cn("bg-white border-b border-gray-100 flex items-center justify-between py-2.5 px-4", className)}>
      {/* Logo / Title */}
      <div>
        <h1 className="text-blue-900 font-medium text-base">{title}</h1>
        {subtitle && <p className="text-sm text-gray-600 mt-0.5">{subtitle}</p>}
      </div>
      
      {/* Hamburger Menu Icon */}
      <button 
        className="focus:outline-none" 
        aria-label="Menu"
        onClick={() => setShowMenu(!showMenu)}
      >
        <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
      </button>
      
      {/* Slide-Out Menu */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20" 
            onClick={() => setShowMenu(false)}
            aria-hidden="true"
          />
          
          {/* Menu Panel */}
          <div className="relative flex flex-col w-60 max-w-sm bg-white shadow-lg overflow-auto">
            {/* User Profile Section */}
            <div className="px-4 py-4 border-b border-gray-100 flex items-center space-x-3">
              <div className="rounded-full bg-blue-800 text-white h-10 w-10 flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-sm">{getUserDisplayName()}</p>
                <p className="text-xs text-gray-500">{getUserEmail()}</p>
              </div>
            </div>
            
            {/* Navigation */}
            <div className="px-4 py-2 border-b border-gray-100">
              <h3 className="text-xs text-gray-500 font-medium mb-2">MENU</h3>
              <nav className="space-y-1">
                {getMenuItems()}
              </nav>
            </div>
            
            {/* Logout - only show for non-trial users since trial users have it in their menu */}
            {!isTrialUser && (
              <div className="p-2 mt-auto border-t border-gray-100">
                <button
                  className="flex items-center w-full px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-md"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default AppHeader;