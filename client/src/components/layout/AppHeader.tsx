import { useState } from "react";
import { Home, LogOut, Settings, FileText, Building2, User, CreditCard, Users, Stethoscope, ListChecks, Map, Link, CheckCircle2, MapPin, UserPlus } from "lucide-react";
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
  
  const effectiveRole = (getUserRoleFromStorage() as UserRole) || UserRole.TrialPhysician;
  
  const isTrialUser = user?.role
    ? checkIsTrialUser(user.role)
    : checkIsTrialUser(effectiveRole);
  
  
  // Function to get the URL for a given page
  const getPageUrl = (page: AppPage): string => {
    switch (page) {
      case AppPage.Profile:
        return "/profile";
      case AppPage.Dashboard:
        return "/";
      case AppPage.NewOrder:
        // Use the navigation utility to determine the correct path
        return getNewOrderPath(effectiveRole);
      case AppPage.Security:
        return "/security";
      case AppPage.OrderList:
        return "/orders";
      case AppPage.AdminQueue:
        return "/admin-queue";
      case AppPage.RadiologyQueue:
        return "/radiology-queue";
      case AppPage.OrgProfile:
        return "/org-profile";
      case AppPage.Locations:
        return "/locations";
      case AppPage.Users:
        return "/users";
      case AppPage.Connections:
        return "/connections";
      case AppPage.Billing:
        return "/billing";
      case AppPage.OrgSignUp:
        return "/org-signup";
      case AppPage.OrgVerification:
        return "/org-verification";
      case AppPage.OrgSetup:
        return "/org-setup";
      case AppPage.OrgLocations:
        return "/org-locations";
      case AppPage.OrgUsers:
        return "/org-users";
      default:
        return `/${page.toLowerCase().replace('_', '-')}`;
    }
  };
  
  const handleNavigation = (page: AppPage) => {
    const targetUrl = getPageUrl(page);
    
    if (onNavigate) {
      onNavigate(page);
    }
    
    // First close menu, then navigate using React router
    setShowMenu(false);
    setLocation(targetUrl);
  };
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      handleNavigation(AppPage.Login);
    }
  };

  const getUserDisplayName = () => {
    try {
      const storedUserData = localStorage.getItem('rad_order_pad_user_data');
      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        
        if (userData.first_name || userData.last_name) {
          const firstName = userData.first_name || '';
          const lastName = userData.last_name || '';
          return `${firstName} ${lastName}`.trim();
        }
        
        if (userData.firstName || userData.lastName) {
          const firstName = userData.firstName || '';
          const lastName = userData.lastName || '';
          return `${firstName} ${lastName}`.trim();
        }
        
        if (userData.name && typeof userData.name === 'string') {
          return userData.name;
        }
      }
    } catch (e) {
      console.error("Error parsing stored user data:", e);
    }
    
    if (user && user.name) {
      return user.name;
    }
    
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
  
  const getUserEmail = () => {
    try {
      const storedUserData = localStorage.getItem('rad_order_pad_user_data');
      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        
        if (userData.email) {
          return userData.email;
        }
      }
    } catch (e) {
      console.error("Error parsing stored user data for email:", e);
    }
    
    if (user && user.email) {
      return user.email;
    }
    
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
  const getMenuItems = () => {
    const menuItemsConfig = [
      { key: "home", page: AppPage.Dashboard, icon: <Home className="h-4 w-4 mr-3 text-gray-500" />, label: "Dashboard" },
      { key: "new-order", page: AppPage.NewOrder, icon: <Stethoscope className="h-4 w-4 mr-3 text-gray-500" />, label: "New Order" },
      { key: "orders", page: AppPage.OrderList, icon: <ListChecks className="h-4 w-4 mr-3 text-gray-500" />, label: "Orders" },
      { key: "admin-queue", page: AppPage.AdminQueue, icon: <FileText className="h-4 w-4 mr-3 text-gray-500" />, label: "Admin Queue" },
      { key: "radiology-queue", page: AppPage.RadiologyQueue, icon: <FileText className="h-4 w-4 mr-3 text-gray-500" />, label: "Radiology Queue" },
      
      { key: "org-profile", page: AppPage.OrgProfile, icon: <Building2 className="h-4 w-4 mr-3 text-gray-500" />, label: "Organization" },
      { key: "locations", page: AppPage.Locations, icon: <Map className="h-4 w-4 mr-3 text-gray-500" />, label: "Locations" },
      { key: "users", page: AppPage.Users, icon: <Users className="h-4 w-4 mr-3 text-gray-500" />, label: "Users" },
      { key: "connections", page: AppPage.Connections, icon: <Link className="h-4 w-4 mr-3 text-gray-500" />, label: "Connections" },
      { key: "billing", page: AppPage.Billing, icon: <CreditCard className="h-4 w-4 mr-3 text-gray-500" />, label: "Billing & Credits" },
      
      { key: "profile", page: AppPage.Profile, icon: <User className="h-4 w-4 mr-3 text-gray-500" />, label: "My Profile", alwaysShow: true },
      { key: "security", page: AppPage.Security, icon: <Settings className="h-4 w-4 mr-3 text-gray-500" />, label: "Security", alwaysShow: true },

      // Onboarding section for AdminRadiology role
      {
        key: "org-signup",
        page: AppPage.OrgSignUp,
        icon: <Building2 className="h-4 w-4 mr-3 text-gray-500" />,
        label: "Organization Sign Up",
        condition: effectiveRole === UserRole.AdminRadiology
      },
      {
        key: "org-verification",
        page: AppPage.OrgVerification,
        icon: <CheckCircle2 className="h-4 w-4 mr-3 text-gray-500" />,
        label: "Email Verification",
        condition: effectiveRole === UserRole.AdminRadiology
      },
      {
        key: "org-setup",
        page: AppPage.OrgSetup,
        icon: <Settings className="h-4 w-4 mr-3 text-gray-500" />,
        label: "Initial Setup",
        condition: effectiveRole === UserRole.AdminRadiology
      },
      {
        key: "org-locations",
        page: AppPage.OrgLocations,
        icon: <MapPin className="h-4 w-4 mr-3 text-gray-500" />,
        label: "Locations Setup",
        condition: effectiveRole === UserRole.AdminRadiology
      },
      {
        key: "org-users",
        page: AppPage.OrgUsers,
        icon: <UserPlus className="h-4 w-4 mr-3 text-gray-500" />,
        label: "Users Setup",
        condition: effectiveRole === UserRole.AdminRadiology
      },
      
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
    
    return menuItemsConfig
      .filter(item => {
        if (item.alwaysShow) return true;
        
        if (item.condition !== undefined) return item.condition;
        
        return hasAccess(effectiveRole, item.page.toLowerCase().replace('_', '-'));
      })
      .map(item => (
        <a
          key={item.key}
          href={getPageUrl(item.page)}
          className="flex items-center w-full px-3 py-2.5 text-gray-800 hover:bg-gray-100 rounded-md no-underline"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent event from bubbling up to the overlay
            handleNavigation(item.page);
          }}
        >
          {item.icon}
          <span>{item.label}</span>
        </a>
      ));
  };
  
  return (
    <header className={cn("bg-white border-b border-gray-100 flex items-center justify-between py-2.5 px-4", className)}>
      <div>
        <h1 className="text-blue-900 font-bold text-2xl">RadOrderPad</h1>
      </div>
      
      <button
        className="focus:outline-none" 
        aria-label="Menu"
        onClick={() => setShowMenu(!showMenu)}
      >
        <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
      </button>
      
      {showMenu && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={(e) => {
              // Only close the menu if the click is directly on the overlay
              if (e.target === e.currentTarget) {
                setShowMenu(false);
              }
            }}
            aria-hidden="true"
          />
          
          <div className="relative flex flex-col w-60 max-w-sm bg-white shadow-lg overflow-auto">
            <div className="px-4 py-4 border-b border-gray-100 flex items-center space-x-3">
              <div className="rounded-full bg-blue-800 text-white h-10 w-10 flex items-center justify-center">
                {(() => {
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
            
            <div className="px-4 py-2 border-b border-gray-100">
              <h3 className="text-xs text-gray-500 font-medium mb-2">MENU</h3>
              <nav className="space-y-1">
                {getMenuItems()}
              </nav>
            </div>
            
            <div className="p-2 mt-auto border-t border-gray-100">
              <a
                href="/auth"
                className="flex items-center w-full px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-md no-underline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLogout();
                }}
              >
                <LogOut className="h-4 w-4 mr-3" />
                <span>Log out</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default AppHeader;