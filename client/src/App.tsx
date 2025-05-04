import { useState, useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserRole } from "@/lib/roles";
import { AuthProvider } from "@/lib/useAuth";
import { logApiConfiguration, REMOTE_API_URL } from "@/lib/config";

import Sidebar from "@/components/layout/Sidebar";
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
import NotFound from "@/pages/not-found";
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
import HeaderTest from "@/pages/HeaderTest";

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
  HeaderTest = "header-test"
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
    case AppPage.HeaderTest:
      return "Radiology Order - Unknown Patient";
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
    case AppPage.HeaderTest:
      return "Step 1 of 3: Dictation";
    default:
      return undefined;
  }
};

function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>(AppPage.Dashboard);
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.Physician);
  const [location] = useLocation();

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
  const isAuthPage = location === "/auth" || location === "/trial-auth";

  // Function to handle navigation from sidebar - simply update the current page
  const handleNavigate = (page: AppPage) => {
    setCurrentPage(page);
  };

  // Render the current page based on the state
  const renderCurrentPage = () => {
    switch (currentPage) {
      case AppPage.Dashboard:
        return <Dashboard />;
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
      case AppPage.HeaderTest:
        return <HeaderTest />;
      default:
        return <Dashboard />;
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
          <Route path="/trial-auth">
            <TrialAuthPage />
          </Route>
          <Route path="/header-test">
            <HeaderTest />
          </Route>
          <Route>
            <div className="flex h-screen overflow-hidden">
              <Sidebar 
                currentPage={currentPage} 
                onNavigate={handleNavigate}
                currentRole={currentRole}
                onRoleChange={setCurrentRole}
              />
              <div className="flex-1 overflow-auto">
                <AppHeader 
                  title={getPageTitle(currentPage)}
                  subtitle={getPageSubtitle(currentPage)}
                  onNavigate={handleNavigate}
                  userRole={currentRole}
                />
                <main className="min-h-screen">
                  {renderCurrentPage()}
                </main>
              </div>
            </div>
          </Route>
          </Switch>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
