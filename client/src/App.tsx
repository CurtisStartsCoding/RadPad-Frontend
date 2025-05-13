import { useState, useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserRole } from "@/lib/roles";
import { AuthProvider, useAuth } from "@/lib/useAuth";
import { logApiConfiguration, REMOTE_API_URL } from "@/lib/config";

import AppHeader from "@/components/layout/AppHeader";
import Dashboard from "@/pages/Dashboard";
import NewOrder from "@/pages/NewOrder";
import OrderList from "@/pages/OrderList";
import AdminQueue from "@/pages/AdminQueue";
import AdminOrderFinalization from "@/pages/AdminOrderFinalization";
import RadiologyQueue from "@/pages/RadiologyQueue";
import OrganizationProfile from "@/pages/OrganizationProfile";
import Locations from "@/pages/Locations";
import Users from "@/pages/Users";
import Connections from "@/pages/Connections";
import BillingCredits from "@/pages/BillingCredits";
import BillingTest from "@/pages/BillingTest";
import MyProfile from "@/pages/MyProfile";
import Security from "@/pages/Security";
import AuthPage from "@/pages/auth-page";
import TrialAuthPage from "@/pages/trial-auth";
import TrialPage from "@/pages/trial";
import TrialValidation from "@/pages/TrialValidation";
import NotFound from "@/pages/not-found";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
// Removed import for Login component that was deleted

// Onboarding imports
import OrgSignUp from "@/pages/OrgSignUp";
import OrgVerification from "@/pages/OrgVerification";
import OrgSetup from "@/pages/OrgSetup";
import OrgLocations from "@/pages/OrgLocations";
import OrgUsers from "@/pages/OrgUsers";

// Super Admin imports
import SuperAdminDashboard from "@/pages/SuperAdminDashboard";
import SuperAdminOrganizations from "@/pages/SuperAdminOrganizations";
import SuperAdminUsers from "@/pages/SuperAdminUsers";
import SuperAdminLogs from "@/pages/SuperAdminLogs";

// Test pages

// Enum for all available pages
export enum AppPage {
  Dashboard = "dashboard",
  NewOrder = "new-order",
  OrderList = "orders",
  AdminQueue = "admin-queue",
  AdminOrderFinalization = "admin-order-finalization",
  RadiologyQueue = "radiology-queue",
  OrgProfile = "org-profile",
  Locations = "locations",
  Users = "users",
  Connections = "connections",
  Billing = "billing",
  BillingTest = "billing-test",
  Profile = "profile",
  Security = "security",
  // Auth pages
  Login = "login",
  TrialAuth = "trial-auth",
  // Onboarding pages
  OrgSignUp = "org-signup",
  OrgVerification = "org-verification",
  OrgSetup = "org-setup",
  OrgLocations = "org-locations",
  OrgUsers = "org-users",
  // Super Admin pages
  SuperAdminDashboard = "superadmin-dashboard",
  SuperAdminOrganizations = "superadmin-organizations",
  SuperAdminUsers = "superadmin-users",
  SuperAdminLogs = "superadmin-logs",
  SuperAdminBilling = "superadmin-billing",
  // Test pages
}

// Helper function to get page title based on the current page
const getPageTitle = (page: AppPage): string => {
  switch (page) {
    case AppPage.Dashboard:
      return "Dashboard";
    case AppPage.NewOrder:
      return "New Radiology Order";
    case AppPage.OrderList:
      return "Orders";
    case AppPage.AdminQueue:
      return "Admin Order Queue";
    case AppPage.AdminOrderFinalization:
      return "Order Finalization";
    case AppPage.RadiologyQueue:
      return "Radiology Queue";
    case AppPage.OrgProfile:
      return "Organization Profile";
    case AppPage.Locations:
      return "Locations";
    case AppPage.Users:
      return "Users";
    case AppPage.Connections:
      return "Connections";
    case AppPage.Billing:
      return "Billing & Credits";
    case AppPage.Profile:
      return "My Profile";
    case AppPage.Security:
      return "Security";
    // Super Admin pages
    case AppPage.SuperAdminDashboard:
      return "Super Admin Dashboard";
    case AppPage.SuperAdminOrganizations:
      return "Organizations";
    case AppPage.SuperAdminUsers:
      return "Users";
    case AppPage.SuperAdminLogs:
      return "System Logs";
    case AppPage.SuperAdminBilling:
      return "Billing Management";
    // Test pages
    default:
      return "RadOrderPad";
  }
};

// Helper function to get page subtitle based on the current page
const getPageSubtitle = (page: AppPage): string | undefined => {
  switch (page) {
    case AppPage.NewOrder:
      return "Step 1 of 3: Dictation";
    case AppPage.AdminOrderFinalization:
      return "Review and finalize order details";
    default:
      return undefined;
  }
};

function App() {
  // Start with Login page instead of Dashboard
  const [currentPage, setCurrentPage] = useState<AppPage>(AppPage.Login);
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.Physician);
  const [location, setLocation] = useLocation();
  const { isAuthenticated, user, isLoading } = useAuth();
  
  // Add a forced loading timeout to prevent getting stuck in loading state
  const [forceLoadingComplete, setForceLoadingComplete] = useState(false);
  
  // Check for token in localStorage directly
  const [hasToken, setHasToken] = useState(false);
  
  // Sync URL with currentPage state
  useEffect(() => {
    // Map URL paths to AppPage enum values
    if (location === "/profile") {
      setCurrentPage(AppPage.Profile);
    } else if (location === "/") {
      setCurrentPage(AppPage.Dashboard);
    }
    // Add other URL mappings as needed
  }, [location]);
  
  // Since we removed the sidebar with role selector, we'll keep this function
  // for potential future use or for programmatic role changes
  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
  };

  // Force loading to complete after a timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.log("Loading timeout reached, forcing loading to complete");
        setForceLoadingComplete(true);
      }
    }, 2000); // 2 second timeout
    
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Check for token in localStorage on mount and after login
  useEffect(() => {
    const token = localStorage.getItem('rad_order_pad_access_token');
    setHasToken(!!token);
    console.log("Token check:", !!token ? "Token exists" : "No token");
  }, [location]); // Re-check when location changes (after login)

  // Determine if user should be authenticated based on token and auth state
  // Check token directly from localStorage for the most up-to-date state
  const token = localStorage.getItem('rad_order_pad_access_token');
  const trialToken = localStorage.getItem('rad_order_pad_trial_access_token');
  const shouldBeAuthenticated = isAuthenticated || hasToken || !!token || !!trialToken;
  
  // Determine if we should still be in loading state
  const effectiveLoading = isLoading && !forceLoadingComplete;

  // Redirect based on authentication state
  useEffect(() => {
    if (!effectiveLoading) {
      // Check token directly from localStorage for the most up-to-date state
      const token = localStorage.getItem('rad_order_pad_access_token');
      const trialToken = localStorage.getItem('rad_order_pad_trial_access_token');
      const currentlyAuthenticated = isAuthenticated || hasToken || !!token || !!trialToken;
      
      if (currentlyAuthenticated) {
        // User is authenticated, check role to determine which page to show
        const radiologyRoles = ['radiologist', 'admin_radiology', 'scheduler'];
        
        // Try to get role from token if user object is not available
        let userRole = null;
        if (user) {
          userRole = user.role;
        } else {
          // First check for trial user data
          const trialUserData = localStorage.getItem('rad_order_pad_trial_user');
          if (trialUserData) {
            try {
              const trialUser = JSON.parse(trialUserData);
              userRole = trialUser.role;
              console.log(`Using role from trial user data: ${userRole}`);
            } catch (e) {
              console.error("Error parsing trial user data:", e);
            }
          }
          
          // If no trial user data, try to extract role from regular token
          if (!userRole) {
            try {
              const token = localStorage.getItem('rad_order_pad_access_token');
              if (token) {
                const tokenParts = token.split('.');
                if (tokenParts.length === 3) {
                  const payload = JSON.parse(atob(tokenParts[1]));
                  if (payload && payload.role) {
                    userRole = payload.role;
                    console.log(`Extracted role from token: ${userRole}`);
                  }
                }
              }
            } catch (e) {
              console.error("Error extracting role from token:", e);
            }
          }
          
          // If still no role but we have a trial token, use 'trial_user' as the default role
          if (!userRole && trialToken) {
            userRole = 'trial_user';
            console.log('Using default trial-user role');
          }
        }
        
        if (userRole && radiologyRoles.includes(userRole)) {
          // User has a radiology role, show Radiology Queue
          console.log(`User has role ${userRole}, showing Radiology Queue`);
          setCurrentPage(AppPage.RadiologyQueue);
          if (location === "/auth") {
            setLocation("/radiology-queue");
          }
        } else {
          // User has a non-radiology role or role couldn't be determined, show Dashboard
          console.log("User is authenticated, showing dashboard");
          setCurrentPage(AppPage.Dashboard);
          if (location === "/auth") {
            setLocation("/");
          }
        }
      } else if (location !== "/auth" &&
                location !== "/forgot-password" &&
                location !== "/reset-password" &&
                location !== "/trial-auth" &&
                location !== "/trial" &&
                location !== "/trial-validation") {
        // User is not authenticated and not on auth, password reset, or trial pages, redirect to login
        console.log("User is not authenticated, redirecting to login");
        setLocation("/auth");
      }
    }
  }, [shouldBeAuthenticated, effectiveLoading, location, setLocation, isAuthenticated, hasToken]);

  // Log API configuration on app startup
  useEffect(() => {
    // Log API configuration to verify we're using the remote API
    logApiConfiguration();
    
    // Additional verification log
    console.group('🔍 API Verification');
    console.log('✅ This application is configured to use the remote API');
    console.log(`🌐 Remote API URL: ${REMOTE_API_URL}`);
    console.log('❌ Mock endpoints are NOT being used');
    console.log('📝 All API requests and responses will be logged in the console');
    console.groupEnd();
  }, []);

  // Check if the current location is an auth page
  const isAuthPage = location === "/auth" || location === "/trial-auth" || location === "/trial" || location === "/trial-validation";

  // Function to handle navigation from sidebar - simply update the current page
  const handleNavigate = (page: AppPage) => {
    setCurrentPage(page);
  };

  // Render the current page based on the state
  const renderCurrentPage = () => {
    switch (currentPage) {
      case AppPage.Dashboard:
        return <Dashboard navigateTo={(page) => setCurrentPage(page)} />;
      case AppPage.NewOrder:
        return <NewOrder userRole={currentRole} />;
      case AppPage.OrderList:
        return <OrderList />;
      case AppPage.AdminQueue:
        return <AdminQueue navigateTo={(page) => setCurrentPage(page)} />;
      case AppPage.AdminOrderFinalization:
        return <AdminOrderFinalization navigateTo={(page) => setCurrentPage(page)} />;
      case AppPage.RadiologyQueue:
        return <RadiologyQueue />;
      case AppPage.OrgProfile:
        return <OrganizationProfile />;
      case AppPage.Locations:
        return <Locations />;
      case AppPage.Users:
        return <Users />;
      case AppPage.Connections:
        return <Connections />;
      case AppPage.Billing:
        return <BillingCredits userRole={currentRole} />;
      case AppPage.BillingTest:
        return <BillingTest />;
      case AppPage.Profile:
        return <MyProfile userRole={currentRole} />;
      case AppPage.Security:
        return <Security />;
      // Auth pages
      case AppPage.Login:
        return <AuthPage />;
      case AppPage.TrialAuth:
        return <TrialAuthPage />;
      // Onboarding pages
      case AppPage.OrgSignUp:
        return <OrgSignUp />;
      case AppPage.OrgVerification:
        return <OrgVerification />;
      case AppPage.OrgSetup:
        return <OrgSetup />;
      case AppPage.OrgLocations:
        return <OrgLocations />;
      case AppPage.OrgUsers:
        return <OrgUsers />;
      // Super Admin pages
      case AppPage.SuperAdminDashboard:
        return <SuperAdminDashboard navigateTo={(page) => setCurrentPage(page as AppPage)} />;
      case AppPage.SuperAdminOrganizations:
        return <SuperAdminOrganizations />;
      case AppPage.SuperAdminUsers:
        return <SuperAdminUsers />;
      case AppPage.SuperAdminLogs:
        return <SuperAdminLogs />;
      case AppPage.SuperAdminBilling:
        return <BillingCredits userRole={UserRole.SuperAdmin} />;
      // Test pages
      default:
        return <Dashboard navigateTo={(page) => setCurrentPage(page)} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Switch>
          <Route path="/auth">
            <AuthPage />
          </Route>
          <Route path="/forgot-password">
            <ForgotPassword />
          </Route>
          <Route path="/reset-password">
            <ResetPassword />
          </Route>
          <Route path="/trial">
            <TrialPage />
          </Route>
          <Route path="/trial-auth">
            <TrialAuthPage />
          </Route>
          <Route path="/trial-validation">
            <TrialValidation />
          </Route>
          <Route path="/new-order">
            {shouldBeAuthenticated ? (
              <div className="h-screen flex flex-col">
                <div className="w-full flex-1 overflow-auto">
                  <AppHeader
                    title={getPageTitle(AppPage.NewOrder)}
                    subtitle={getPageSubtitle(AppPage.NewOrder)}
                    onNavigate={handleNavigate}
                    userRole={currentRole}
                  />
                  <main className="h-full">
                    <NewOrder userRole={currentRole} />
                  </main>
                </div>
              </div>
            ) : (
              <AuthPage />
            )}
          </Route>
          <Route path="/profile">
            {shouldBeAuthenticated ? (
              <div className="h-screen flex flex-col">
                <div className="w-full flex-1 overflow-auto">
                  <AppHeader
                    title={getPageTitle(AppPage.Profile)}
                    subtitle={getPageSubtitle(AppPage.Profile)}
                    onNavigate={handleNavigate}
                    userRole={currentRole}
                  />
                  <main className="h-full">
                    <MyProfile userRole={currentRole} />
                  </main>
                </div>
              </div>
            ) : (
              <AuthPage />
            )}
          </Route>
          <Route>
            {effectiveLoading ? (
              // Show loading spinner while checking auth state
              <div className="h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : shouldBeAuthenticated ? (
              // User is authenticated, show the main app
              <div className="h-screen flex flex-col">
                <div className="w-full flex-1 overflow-auto">
                  <AppHeader
                    title={getPageTitle(currentPage)}
                    subtitle={getPageSubtitle(currentPage)}
                    onNavigate={handleNavigate}
                    userRole={currentRole}
                  />
                  <main className="h-full">
                    {renderCurrentPage()}
                  </main>
                </div>
              </div>
            ) : (
              // User is not authenticated, show login page
              <AuthPage />
            )}
          </Route>
          </Switch>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
