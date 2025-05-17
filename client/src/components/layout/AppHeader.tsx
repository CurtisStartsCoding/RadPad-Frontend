import React, { useState } from "react";
import { Home, LogOut, Settings, FileText, Building2, User, CreditCard, Users, Stethoscope, ListChecks, Map } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppPage } from "@/App";
import { UserRole, hasAccess } from "@/lib/roles";
import { useAuth } from "@/lib/useAuth";
import { useLocation } from "wouter";
import { getNewOrderPath, getUserRoleFromStorage, isTrialUser as checkIsTrialUser } from "@/lib/navigation";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  onNavigate?: (page: AppPage) => void;
  className?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title = "RadOrderPad",
  subtitle,
  onNavigate,
  className
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const { logout, user } = useAuth(); // Get all auth data in one call
  const [, setLocation] = useLocation();
  
  // Get user role from storage
  const effectiveRole = (getUserRoleFromStorage() as UserRole) || UserRole.TrialPhysician;
  
  // Use the isTrialUser utility function from navigation.ts
  const isTrialUser = user?.role
    ? checkIsTrialUser(user.role)
    : checkIsTrialUser(effectiveRole);
  
  // Add component-level logging to track role changes
  console.group('🔍 AppHeader Role Debug');
  console.log('Component mounted/updated');
  console.log('- User role from context:', user?.role);
  console.log('- Effective role used:', effectiveRole);
  console.log('- Is trial user:', isTrialUser);
  console.groupEnd();
  
  const handleNavigation = (page: AppPage) => {
    // Debug user role information
    console.log("Navigation debug info:");
    console.log("- User role from context:", user?.role);
    console.log("- Effective role:", effectiveRole);
    console.log("- Is trial user?", isTrialUser);
    console.log("- Navigating to page:", page);
    
    // Determine the target URL based on the page
    let targetUrl = "";
    
    switch (page) {
      case AppPage.Profile:
        targetUrl = "/profile";
        break;
      case AppPage.Dashboard:
        targetUrl = "/";
        break;
      case AppPage.NewOrder:
        // Use the navigation utility to determine the correct path
        targetUrl = getNewOrderPath(effectiveRole);
        console.log(`Redirecting user to ${targetUrl}`);
        break;
      case AppPage.Security:
        console.log("Navigating to Security page");
        targetUrl = "/security";
        break;
      case AppPage.OrderList:
        console.log("Navigating to Orders page");
        targetUrl = "/orders";
        break;
      case AppPage.AdminQueue:
        console.log("Navigating to Admin Queue page");
        targetUrl = "/admin-queue";
        break;
      case AppPage.RadiologyQueue:
        console.log("Navigating to Radiology Queue page");
        targetUrl = "/radiology-queue";
        break;
      case AppPage.OrgProfile:
        console.log("Navigating to Organization Profile page");
        targetUrl = "/org-profile";
        break;
      case AppPage.Locations:
        console.log("Navigating to Locations page");
        targetUrl = "/locations";
        break;
      case AppPage.Users:
        console.log("Navigating to Users page");
        targetUrl = "/users";
        break;
      case AppPage.Connections:
        console.log("Navigating to Connections page");
        targetUrl = "/connections";
        break;
      case AppPage.Billing:
        console.log("Navigating to Billing page");
        targetUrl = "/billing";
        break;
      // Add other cases as needed for other pages
      default:
        // For other pages, derive the URL from the page enum
        targetUrl = `/${page.toLowerCase().replace('_', '-')}`;
    }
    
    // Update the current page state first
    if (onNavigate) {
      onNavigate(page);
    }
    
    // Use setTimeout to ensure the menu is closed after the navigation is initiated
    // This helps prevent any UI issues that might interfere with navigation
    setTimeout(() => {
      // Close the menu
      setShowMenu(false);
      
      // Set the location to navigate to the new page
      console.log(`Setting location to: ${targetUrl}`);
      setLocation(targetUrl);
    }, 0);
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
    // First try to get user data from localStorage
    try {
      const storedUserData = localStorage.getItem('rad_order_pad_user_data');
      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        console.log("Header - userData:", userData);
        
        // Check for different possible field names
        // 1. Check snake_case (first_name, last_name)
        if (userData.first_name || userData.last_name) {
          const firstName = userData.first_name || '';
          const lastName = userData.last_name || '';
          return `${firstName} ${lastName}`.trim();
        }
        
        // 2. Check camelCase (firstName, lastName)
        if (userData.firstName || userData.lastName) {
          const firstName = userData.firstName || '';
          const lastName = userData.lastName || '';
          return `${firstName} ${lastName}`.trim();
        }
        
        // 3. Check for name field that might contain full name
        if (userData.name && typeof userData.name === 'string') {
          return userData.name;
        }
      }
    } catch (e) {
      console.error("Error parsing stored user data:", e);
    }
    
    // Then try from auth context
    if (user && user.name) {
      return user.name;
    }
    
    // Fallback based on role if user name is not available
    switch(effectiveRole) {
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
    // First try to get user data from localStorage
    try {
      const storedUserData = localStorage.getItem('rad_order_pad_user_data');
      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        console.log("Header - userData for email:", userData);
        
        // Check if email exists in stored data
        if (userData.email) {
          return userData.email;
        }
      }
    } catch (e) {
      console.error("Error parsing stored user data for email:", e);
    }
    
    // Then try from auth context
    if (user && user.email) {
      return user.email;
    }
    
    // Fallback based on role if user email is not available
    switch(effectiveRole) {
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
    console.log('Menu items being generated for role:', effectiveRole);
    console.log('Is trial user?', isTrialUser);
    
    // Define menu item configuration
    // Each item has: key, page, icon, label, and optional condition
    const menuItemsConfig = [
      // Core Workflow
      { key: "home", page: AppPage.Dashboard, icon: <Home className="h-4 w-4 mr-3 text-gray-500" />, label: "Dashboard" },
      { key: "new-order", page: AppPage.NewOrder, icon: <Stethoscope className="h-4 w-4 mr-3 text-gray-500" />, label: "New Order" },
      { key: "orders", page: AppPage.OrderList, icon: <ListChecks className="h-4 w-4 mr-3 text-gray-500" />, label: "Orders" },
      { key: "admin-queue", page: AppPage.AdminQueue, icon: <FileText className="h-4 w-4 mr-3 text-gray-500" />, label: "Admin Queue" },
      { key: "radiology-queue", page: AppPage.RadiologyQueue, icon: <FileText className="h-4 w-4 mr-3 text-gray-500" />, label: "Radiology Queue" },
      
      // Organization Management
      { key: "org-profile", page: AppPage.OrgProfile, icon: <Building2 className="h-4 w-4 mr-3 text-gray-500" />, label: "Organization" },
      { key: "locations", page: AppPage.Locations, icon: <Map className="h-4 w-4 mr-3 text-gray-500" />, label: "Locations" },
      { key: "users", page: AppPage.Users, icon: <Users className="h-4 w-4 mr-3 text-gray-500" />, label: "Users" },
      { key: "billing", page: AppPage.Billing, icon: <CreditCard className="h-4 w-4 mr-3 text-gray-500" />, label: "Billing & Credits" },
      
      // User Settings (always available)
      { key: "profile", page: AppPage.Profile, icon: <User className="h-4 w-4 mr-3 text-gray-500" />, label: "My Profile", alwaysShow: true },
      { key: "security", page: AppPage.Security, icon: <Settings className="h-4 w-4 mr-3 text-gray-500" />, label: "Security", alwaysShow: true },
      
      // Super Admin sections
      {
        key: "superadmin-dashboard",
        page: AppPage.SuperAdminDashboard,
        icon: <Home className="h-4 w-4 mr-3 text-gray-500" />,
        label: "Admin Dashboard",
        condition: effectiveRole === UserRole.SuperAdmin
      },
      {
        key: "superadmin-organizations",
        page: AppPage.SuperAdminOrganizations,
        icon: <Building2 className="h-4 w-4 mr-3 text-gray-500" />,
        label: "Organizations",
        condition: effectiveRole === UserRole.SuperAdmin
      },
      {
        key: "superadmin-users",
        page: AppPage.SuperAdminUsers,
        icon: <Users className="h-4 w-4 mr-3 text-gray-500" />,
        label: "All Users",
        condition: effectiveRole === UserRole.SuperAdmin
      },
      {
        key: "superadmin-logs",
        page: AppPage.SuperAdminLogs,
        icon: <FileText className="h-4 w-4 mr-3 text-gray-500" />,
        label: "System Logs",
        condition: effectiveRole === UserRole.SuperAdmin
      }
    ];
    
    // Create menu items based on user access
    return menuItemsConfig
      .filter(item => {
        // Always show items marked as alwaysShow
        if (item.alwaysShow) return true;
        
        // For items with explicit conditions, use those
        if (item.condition !== undefined) return item.condition;
        
        // Otherwise, check access based on role
        // The hasAccess function already handles the trial user special case
        return hasAccess(effectiveRole, item.page.toLowerCase().replace('_', '-'));
      })
      .map(item => (
        <button
          key={item.key}
          className="flex items-center w-full px-3 py-2.5 text-gray-800 hover:bg-gray-100 rounded-md"
          onClick={() => handleNavigation(item.page)}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ));
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
                {(() => {
                  // Get initials from user name
                  try {
                    const storedUserData = localStorage.getItem('rad_order_pad_user_data');
                    if (storedUserData) {
                      const userData = JSON.parse(storedUserData);
                      
                      // Check for different possible field names
                      // 1. Check snake_case (first_name, last_name)
                      if (userData.first_name || userData.last_name) {
                        const firstName = userData.first_name || '';
                        const lastName = userData.last_name || '';
                        const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
                        if (initials) return initials;
                      }
                      
                      // 2. Check camelCase (firstName, lastName)
                      if (userData.firstName || userData.lastName) {
                        const firstName = userData.firstName || '';
                        const lastName = userData.lastName || '';
                        const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
                        if (initials) return initials;
                      }
                      
                      // 3. Check for name field that might contain full name
                      if (userData.name && typeof userData.name === 'string') {
                        const nameParts = userData.name.split(' ');
                        if (nameParts.length >= 2) {
                          const initials = `${nameParts[0][0] || ''}${nameParts[1][0] || ''}`.toUpperCase();
                          if (initials) return initials;
                        } else if (nameParts.length === 1 && nameParts[0]) {
                          return nameParts[0].substring(0, 1).toUpperCase();
                        }
                      }
                      
                      // 4. If email is mj@test.com, use MJ as initials
                      if (userData.email === 'mj@test.com') {
                        return 'MJ';
                      }
                    }
                  } catch (e) {
                    console.error("Error getting initials:", e);
                  }
                  return <User className="h-5 w-5" />;
                })()}
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
            
            {/* Logout - show for all users at the bottom of the screen */}
            <div className="p-2 mt-auto border-t border-gray-100">
              <button
                className="flex items-center w-full px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-md"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-3" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default AppHeader;