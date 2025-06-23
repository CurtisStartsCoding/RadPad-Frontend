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
  
  // Log user role for debugging
  console.log("User object:", user);
  console.log("User role from user object:", user?.role);
  console.log("User role from storage:", getUserRoleFromStorage());
  
  const currentRole = (user?.role as UserRole) || UserRole.Physician;
  console.log("Current role used in the app:", currentRole);
  
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
    } else if (location === "/security") {
      setCurrentPage(AppPage.Security);
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
        // Try to get role from token if user object is not available
        let userRole = null;
        if (user) {
          userRole = user.role;
        } else {
          userRole = getUserRoleFromStorage();
        }

        // Only set default pages and redirect if coming from auth page
        // This prevents overriding explicit navigation to other pages
        if (location === "/auth") {
          console.log("Handling redirection after login, user role:", userRole);
          
          if (userRole === UserRole.TrialPhysician) {
            console.log("Redirecting trial user to trial-validation");
            setCurrentPage(AppPage.NewOrder);
            setLocation("/trial-validation");
          } else if (userRole === 'physician') {
            console.log("Redirecting physician to new-order");
            setCurrentPage(AppPage.NewOrder);
            setLocation("/new-order");
          } else if (userRole && ['admin_staff', 'admin_referring'].includes(userRole)) {
            console.log("Redirecting admin to admin-queue");
            setCurrentPage(AppPage.AdminQueue);
            setLocation("/admin-queue");
          } else if (userRole && ['radiologist', 'admin_radiology', 'scheduler'].includes(userRole)) {
            console.log("Redirecting radiology staff to radiology-queue");
            setCurrentPage(AppPage.RadiologyQueue);
            setLocation("/radiology-queue");
          } else if (userRole === UserRole.SuperAdmin || userRole === 'super_admin') {
            console.log("Redirecting super_admin to superadmin-dashboard");
            setCurrentPage(AppPage.SuperAdminDashboard);
            setLocation("/superadmin-dashboard");
          } else {
            console.log("No specific redirection rule found, defaulting to dashboard");
            setCurrentPage(AppPage.Dashboard);
            setLocation("/");
          }
        } else if (location.startsWith("/org-") && userRole && ['radiologist', 'admin_radiology', 'scheduler'].includes(userRole)) {
          // Check if we're on an onboarding page first
          if (location.startsWith("/org-")) {
            // On onboarding page - set current page to match the URL
            const pageMapping = {
              "/org-signup": AppPage.OrgSignUp,
              "/org-verification": AppPage.OrgVerification,
              "/org-setup": AppPage.OrgSetup,
              "/org-locations": AppPage.OrgLocations,
              "/org-users": AppPage.OrgUsers
            };
            
            // Set current page based on URL if it's a known onboarding page
            const matchedPage = pageMapping[location as keyof typeof pageMapping];
            if (matchedPage) {
              setCurrentPage(matchedPage);
            }
            // Keep current location - no redirect
          } else if (location === "/auth") {
            // Coming from auth page - redirect to radiology queue
            setCurrentPage(AppPage.RadiologyQueue);
            setLocation("/radiology-queue");
          } else {
            // For other pages, just set the current page without redirect
            setCurrentPage(AppPage.RadiologyQueue);
          }
        } else {
          // Check if user is super_admin and redirect to superadmin-dashboard
          if (userRole === UserRole.SuperAdmin || userRole === 'super_admin') {
            console.log("User is super_admin, redirecting to superadmin-dashboard");
            setCurrentPage(AppPage.SuperAdminDashboard);
            if (location === "/auth") {
              setLocation("/superadmin-dashboard");
            }
          } else {
            console.log("User is not super_admin, using default dashboard");
            setCurrentPage(AppPage.Dashboard);
            if (location === "/auth") {
              setLocation("/");
            }
          }
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
          <Route path="/superadmin-dashboard">
            {shouldBeAuthenticated ? (
              <div className="h-screen flex flex-col">
                <div className="w-full flex-1 overflow-auto">
                  <AppHeader
                    title={getPageTitle(AppPage.SuperAdminDashboard)}
                    subtitle={getPageSubtitle(AppPage.SuperAdminDashboard)}
                    onNavigate={handleNavigate}
                  />
                  <main className="h-full pt-16">
                    <SuperAdminDashboard navigateTo={(page) => setCurrentPage(page as AppPage)} />
                  </main>
                </div>
              </div>
            ) : (
              <AuthPage />
            )}
          </Route>
          <Route path="/superadmin-organizations">
            {shouldBeAuthenticated ? (
              <div className="h-screen flex flex-col">
                <div className="w-full flex-1 overflow-auto">
                  <AppHeader
                    title={getPageTitle(AppPage.SuperAdminOrganizations)}
                    subtitle={getPageSubtitle(AppPage.SuperAdminOrganizations)}
                    onNavigate={handleNavigate}
                  />
                  <main className="h-full pt-16">
                    <SuperAdminOrganizations />
                  </main>
                </div>
              </div>
            ) : (
              <AuthPage />
            )}
          </Route>
          <Route path="/superadmin-users">
            {shouldBeAuthenticated ? (
              <div className="h-screen flex flex-col">
                <div className="w-full flex-1 overflow-auto">
                  <AppHeader
                    title={getPageTitle(AppPage.SuperAdminUsers)}
                    subtitle={getPageSubtitle(AppPage.SuperAdminUsers)}
                    onNavigate={handleNavigate}
                  />
                  <main className="h-full pt-16">
                    <SuperAdminUsers />
                  </main>
                </div>
              </div>
            ) : (
              <AuthPage />
            )}
          </Route>
          <Route path="/superadmin-logs">
            {shouldBeAuthenticated ? (
              <div className="h-screen flex flex-col">
                <div className="w-full flex-1 overflow-auto">
                  <AppHeader
                    title={getPageTitle(AppPage.SuperAdminLogs)}
                    subtitle={getPageSubtitle(AppPage.SuperAdminLogs)}
                    onNavigate={handleNavigate}
                  />
                  <main className="h-full pt-16">
                    <SuperAdminLogs />
                  </main>
                </div>
              </div>
            ) : (
              <AuthPage />
            )}
          </Route>
          <Route path="/">
            {shouldBeAuthenticated ? (
              // Check if currentPage is explicitly set to Dashboard
              currentPage === AppPage.Dashboard ? (
                // Show Dashboard when explicitly navigated to, regardless of role
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
              ) : currentRole === UserRole.TrialPhysician ? (
                // Redirect trial users to trial validation page
                <TrialValidation />
              ) : currentRole === UserRole.Radiologist || currentRole === UserRole.AdminRadiology || currentRole === UserRole.Scheduler ? (
                // Show Radiology Queue for radiology staff
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
              ) : currentRole === 'physician' ? (
                // Show New Order page for physicians
                <div className="h-screen flex flex-col">
                  <div className="w-full flex-1 overflow-auto">
                    <AppHeader
                      title={getPageTitle(AppPage.NewOrder)}
                      subtitle={getPageSubtitle(AppPage.NewOrder)}
                      onNavigate={handleNavigate}
                    />
                    <main className="h-full pt-16">
                      <NewOrder userRole={currentRole} />
                    </main>
                  </div>
                </div>
              ) : ['admin_staff', 'admin_referring'].includes(currentRole) ? (
                // Show Admin Queue for admin roles
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
              ) : currentRole === UserRole.SuperAdmin ? (
                // Show Super Admin Dashboard for super_admin users
                <div className="h-screen flex flex-col">
                  <div className="w-full flex-1 overflow-auto">
                    <AppHeader
                      title={getPageTitle(AppPage.SuperAdminDashboard)}
                      subtitle={getPageSubtitle(AppPage.SuperAdminDashboard)}
                      onNavigate={handleNavigate}
                    />
                    <main className="h-full pt-16">
                      <SuperAdminDashboard navigateTo={(page) => setCurrentPage(page as AppPage)} />
                    </main>
                  </div>
                </div>
              ) : (
                // Show Dashboard for all other authenticated users
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
              )
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
