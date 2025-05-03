import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserRole } from "@/lib/roles";

import Sidebar from "@/components/layout/Sidebar";
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
import NotFound from "@/pages/not-found";

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
  // Super Admin pages
  SuperAdminDashboard = "superadmin-dashboard",
  SuperAdminOrganizations = "superadmin-organizations",
  SuperAdminUsers = "superadmin-users",
  SuperAdminLogs = "superadmin-logs",
  SuperAdminBilling = "superadmin-billing"
}

function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>(AppPage.Dashboard);
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.Physician);

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
        return <MyProfile />;
      case AppPage.Security:
        return <Security />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar 
            currentPage={currentPage} 
            onNavigate={(page) => setCurrentPage(page)}
            currentRole={currentRole}
            onRoleChange={setCurrentRole}
          />
          <div className="flex-1 overflow-auto">
            <main className="min-h-screen">
              {renderCurrentPage()}
            </main>
          </div>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
