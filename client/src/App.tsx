import { useState, useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserRole } from "@/lib/roles";
import { AuthProvider, useAuth } from "@/lib/useAuth";
import { logApiConfiguration, REMOTE_API_URL } from "@/lib/config";
import { getUserRoleFromStorage } from "@/lib/navigation";

import AppHeader from "@/components/layout/AppHeader";
import Dashboard from "@/pages/Dashboard";
import NewOrder from "@/pages/NewOrder";
import OrderList from "@/pages/OrderList";
import OrderDetailsView from "@/pages/OrderDetailsView";
import PatientHistoryView from "@/pages/PatientHistoryView";
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
      return "Rad Order Pad";
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
  const [location, setLocation] = useLocation();
  const { isAuthenticated, user, isLoading } = useAuth();
  
  const currentRole = (user?.role as UserRole) || UserRole.Physician;
  
  // Add a forced loading timeout to prevent getting stuck in loading state
  const [forceLoadingComplete, setForceLoadingComplete] = useState(false);
  
  // Check for token in localStorage directly
  const [hasToken, setHasToken] = useState(false);
  
  // Sync URL with currentPage state
  useEffect(() => {
    // Map URL paths to AppPage enum values
    if (location === "/profile") {
      setCurrentPage(AppPage.Profile);
    } else if (location === "/security") {
      setCurrentPage(AppPage.Security);
    } else if (location === "/new-order") {
      setCurrentPage(AppPage.NewOrder);
    } else if (location === "/admin-queue") {
      setCurrentPage(AppPage.AdminQueue);
    } else if (location === "/radiology-queue") {
      setCurrentPage(AppPage.RadiologyQueue);
    } else if (location === "/trial-validation") {
      setCurrentPage(AppPage.NewOrder);
    } else if (location === "/") {
      // Don't set Dashboard immediately - let role-based redirect handle this
      // setCurrentPage(AppPage.Dashboard);
    }
    // Add other URL mappings as needed
  }, [location]);
  
  // Force loading to complete after a timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        setForceLoadingComplete(true);
      }
    }, 2000); // 2 second timeout
    
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Check for token in localStorage on mount and after login
  useEffect(() => {
    const token = localStorage.getItem('rad_order_pad_access_token');
    setHasToken(!!token);
  }, [location]); // Re-check when location changes (after login)

  const token = localStorage.getItem('rad_order_pad_access_token');
  const shouldBeAuthenticated = isAuthenticated || hasToken || !!token;
  
  // Determine if we should still be in loading state
  const effectiveLoading = isLoading && !forceLoadingComplete;

  // Redirect based on authentication state
  useEffect(() => {
    if (!effectiveLoading) {
      const token = localStorage.getItem('rad_order_pad_access_token');
      const currentlyAuthenticated = isAuthenticated || hasToken || !!token;
      
      if (currentlyAuthenticated) {
        // Only redirect from /auth to root - let root route handle role-based rendering
        if (location === "/auth") {
          setLocation("/");
        }
      } else if (location !== "/auth" &&
                location !== "/forgot-password" &&
                location !== "/reset-password" &&
                location !== "/trial-auth" &&
                location !== "/trial" &&
                location !== "/trial-validation") {
        setLocation("/auth");
      }
    }
  }, [shouldBeAuthenticated, effectiveLoading, location, setLocation, isAuthenticated, hasToken, user]);
  
  useEffect(() => {
    logApiConfiguration();
  }, []);

  // Function to handle navigation from sidebar - simply update the current page
  const handleNavigate = (page: AppPage) => {
    setCurrentPage(page);
  };

  // Render the current page based on the state
  const renderCurrentPage = () => {
    switch (currentPage) {
      case AppPage.Dashboard:
        // Don't render Dashboard if we're on root route and should redirect
        if (location === "/" && shouldBeAuthenticated && user?.role && user.role !== 'super_admin') {
          return <div>Loading...</div>; // Show loading while redirecting
        }
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
        return <MyProfile />;
      case AppPage.Security:
        return <Security />;
      case AppPage.Login:
        return <AuthPage />;
      case AppPage.TrialAuth:
        return <TrialAuthPage />;
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
          <Route path="/patients/:patientMrn">
            {shouldBeAuthenticated ? (
              <div className="h-screen flex flex-col">
                <div className="w-full flex-1 overflow-auto">
                  <AppHeader
                    title="Patient History"
                    onNavigate={handleNavigate}
                  />
                  <main className="h-full pt-16">
                    <PatientHistoryView />
                  </main>
                </div>
              </div>
            ) : (
              <AuthPage />
            )}
          </Route>
          <Route path="/orders/:orderId">
            {shouldBeAuthenticated ? (
              <div className="h-screen flex flex-col">
                <div className="w-full flex-1 overflow-auto">
                  <AppHeader
                    title="Order Details"
                    onNavigate={handleNavigate}
                  />
                  <main className="h-full pt-16">
                    <OrderDetailsView />
                  </main>
                </div>
              </div>
            ) : (
              <AuthPage />
            )}
          </Route>
          <Route path="/orders">
            {shouldBeAuthenticated ? (
              <div className="h-screen flex flex-col">
                <div className="w-full flex-1 overflow-auto">
                  <AppHeader
                    title={getPageTitle(AppPage.OrderList)}
                    subtitle={getPageSubtitle(AppPage.OrderList)}
                    onNavigate={handleNavigate}
                  />
                  <main className="h-full pt-16">
                    <OrderList />
                  </main>
                </div>
              </div>
            ) : (
              <AuthPage />
            )}
          </Route>
          <Route path="/new-order">
            {shouldBeAuthenticated ? (
              <div className="h-screen flex flex-col">
                <div className="w-full flex-1 overflow-auto">
                  <AppHeader
                    title={getPageTitle(AppPage.NewOrder)}
                    subtitle={getPageSubtitle(AppPage.NewOrder)}
                    onNavigate={handleNavigate}
                  />
                  <main className="h-full pt-16">
                    <NewOrder userRole={(user?.role as UserRole) || currentRole} />
                  </main>
                </div>
              </div>
            ) : (
              <AuthPage />
            )}
          </Route>
          <Route path="/admin-queue">
            {shouldBeAuthenticated ? (
              <div className="h-screen flex flex-col">
                <div className="w-full flex-1 overflow-auto">
                  <AppHeader
                    title={getPageTitle(AppPage.AdminQueue)}
                    subtitle={getPageSubtitle(AppPage.AdminQueue)}
                    onNavigate={handleNavigate}
                  />
                  <main className="h-full pt-16">
                    <AdminQueue navigateTo={(page) => setCurrentPage(page)} />
                  </main>
                </div>
              </div>
            ) : (
              <AuthPage />
            )}
          </Route>
          <Route path="/admin-order-finalization">
            {shouldBeAuthenticated ? (
              <div className="h-screen flex flex-col">
                <div className="w-full flex-1 overflow-auto">
                  <AppHeader
                    title={getPageTitle(AppPage.AdminOrderFinalization)}
                    subtitle={getPageSubtitle(AppPage.AdminOrderFinalization)}
                    onNavigate={handleNavigate}
                  />
                  <main className="h-full pt-16">
                    <AdminOrderFinalization navigateTo={(page) => setCurrentPage(page)} />
                  </main>
                </div>
              </div>
            ) : (
              <AuthPage />
            )}
          </Route>
          <Route path="/radiology-queue">
            {shouldBeAuthenticated ? (
              <div className="h-screen flex flex-col">
                <div className="w-full flex-1 overflow-auto">
                  <AppHeader
                    title={getPageTitle(AppPage.RadiologyQueue)}
                    subtitle={getPageSubtitle(AppPage.RadiologyQueue)}
                    onNavigate={handleNavigate}
                  />
                  <main className="h-full pt-16">
                    <RadiologyQueue />
                  </main>
                </div>
              </div>
            ) : (
              <AuthPage />
            )}
          </Route>
          <Route path="/org-profile">
            {shouldBeAuthenticated ? (
              <div className="h-screen flex flex-col">
                <div className="w-full flex-1 overflow-auto">
                  <AppHeader
                    title={getPageTitle(AppPage.OrgProfile)}
                    subtitle={getPageSubtitle(AppPage.OrgProfile)}
                    onNavigate={handleNavigate}
                  />
                  <main className="h-full pt-16">
                    <OrganizationProfile />
                  </main>
                </div>
              </div>
            ) : (
              <AuthPage />
            )}
          </Route>
          <Route path="/locations">
            {shouldBeAuthenticated ? (
              <div className="h-screen flex flex-col">
                <div className="w-full flex-1 overflow-auto">
                  <AppHeader
                    title={getPageTitle(AppPage.Locations)}
                    subtitle={getPageSubtitle(AppPage.Locations)}
                    onNavigate={handleNavigate}
                  />
                  <main className="h-full pt-16">
                    <Locations />
                  </main>
                </div>
              </div>
            ) : (
              <AuthPage />
            )}
          </Route>
          <Route path="/users">
            {shouldBeAuthenticated ? (
              <div className="h-screen flex flex-col">
                <div className="w-full flex-1 overflow-auto">
                  <AppHeader
                    title={getPageTitle(AppPage.Users)}
                    subtitle={getPageSubtitle(AppPage.Users)}
                    onNavigate={handleNavigate}
                  />
                  <main className="h-full pt-16">
                    <Users />
                  </main>
                </div>
              </div>
            ) : (
              <AuthPage />
            )}
          </Route>
          <Route path="/connections">
            {shouldBeAuthenticated ? (
              <div className="h-screen flex flex-col">
                <div className="w-full flex-1 overflow-auto">
                  <AppHeader
                    title={getPageTitle(AppPage.Connections)}
                    subtitle={getPageSubtitle(AppPage.Connections)}
                    onNavigate={handleNavigate}
                  />
                  <main className="h-full pt-16">
                    <Connections />
                  </main>
                </div>
              </div>
            ) : (
              <AuthPage />
            )}
          </Route>
          <Route path="/billing">
            {shouldBeAuthenticated ? (
              <div className="h-screen flex flex-col">
                <div className="w-full flex-1 overflow-auto">
                  <AppHeader
                    title={getPageTitle(AppPage.Billing)}
                    subtitle={getPageSubtitle(AppPage.Billing)}
                    onNavigate={handleNavigate}
                  />
                  <main className="h-full pt-16">
                    <BillingCredits userRole={currentRole} />
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
                  />
                  <main className="h-full pt-16">
                    <MyProfile />
                  </main>
                </div>
              </div>
            ) : (
              <AuthPage />
            )}
          </Route>
          <Route path="/security">
            {shouldBeAuthenticated ? (
              <div className="h-screen flex flex-col">
                <div className="w-full flex-1 overflow-auto">
                  <AppHeader
                    title={getPageTitle(AppPage.Security)}
                    subtitle={getPageSubtitle(AppPage.Security)}
                    onNavigate={handleNavigate}
                  />
                  <main className="h-full pt-16">
                    <Security />
                  </main>
                </div>
              </div>
            ) : (
              <AuthPage />
            )}
          </Route>
          <Route path="/">
            {shouldBeAuthenticated ? (
              (() => {
                // Get role from user object or storage
                let userRole = null;
                if (user) {
                  userRole = user.role;
                } else {
                  userRole = getUserRoleFromStorage();
                }

                // Direct role-based page rendering - no redirects
                if (userRole === UserRole.TrialPhysician) {
                  return <TrialValidation />;
                } else if (userRole === 'physician') {
                  // Show New Order page for physicians
                  return (
                    <div className="h-screen flex flex-col">
                      <div className="w-full flex-1 overflow-auto">
                        <AppHeader
                          title={getPageTitle(AppPage.NewOrder)}
                          subtitle={getPageSubtitle(AppPage.NewOrder)}
                          onNavigate={handleNavigate}
                        />
                        <main className="h-full pt-16">
                          <NewOrder userRole={(user?.role as UserRole) || currentRole} />
                        </main>
                      </div>
                    </div>
                  );
                } else if (userRole && ['admin_staff', 'admin_referring'].includes(userRole)) {
                  // Show Admin Queue for admin staff
                  return (
                    <div className="h-screen flex flex-col">
                      <div className="w-full flex-1 overflow-auto">
                        <AppHeader
                          title={getPageTitle(AppPage.AdminQueue)}
                          subtitle={getPageSubtitle(AppPage.AdminQueue)}
                          onNavigate={handleNavigate}
                        />
                        <main className="h-full pt-16">
                          <AdminQueue navigateTo={(page) => setCurrentPage(page)} />
                        </main>
                      </div>
                    </div>
                  );
                } else if (userRole && ['radiologist', 'admin_radiology', 'scheduler'].includes(userRole)) {
                  // Show Radiology Queue for radiology staff
                  return (
                    <div className="h-screen flex flex-col">
                      <div className="w-full flex-1 overflow-auto">
                        <AppHeader
                          title={getPageTitle(AppPage.RadiologyQueue)}
                          subtitle={getPageSubtitle(AppPage.RadiologyQueue)}
                          onNavigate={handleNavigate}
                        />
                        <main className="h-full pt-16">
                          <RadiologyQueue />
                        </main>
                      </div>
                    </div>
                  );
                } else {
                  // Show Dashboard for all other authenticated users
                  return (
                    <div className="h-screen flex flex-col">
                      <div className="w-full flex-1 overflow-auto">
                        <AppHeader
                          title={getPageTitle(AppPage.Dashboard)}
                          subtitle={getPageSubtitle(AppPage.Dashboard)}
                          onNavigate={handleNavigate}
                        />
                        <main className="h-full pt-16">
                          <Dashboard navigateTo={(page) => setCurrentPage(page)} />
                        </main>
                      </div>
                    </div>
                  );
                }
              })()
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
                  />
                  <main className="h-full pt-16">
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
