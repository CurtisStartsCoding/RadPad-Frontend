import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Sidebar from "@/components/layout/Sidebar";
import Dashboard from "@/pages/Dashboard";
import NewOrder from "@/pages/NewOrder";
import OrderList from "@/pages/OrderList";
import AdminQueue from "@/pages/AdminQueue";
import RadiologyQueue from "@/pages/RadiologyQueue";
import OrganizationProfile from "@/pages/OrganizationProfile";
import Locations from "@/pages/Locations";
import Users from "@/pages/Users";
import Connections from "@/pages/Connections";
import BillingCredits from "@/pages/BillingCredits";
import MyProfile from "@/pages/MyProfile";
import Security from "@/pages/Security";

// Enum for all available pages
export enum AppPage {
  Dashboard = "dashboard",
  NewOrder = "new-order",
  OrderList = "orders",
  AdminQueue = "admin-queue",
  RadiologyQueue = "radiology-queue",
  OrgProfile = "org-profile",
  Locations = "locations",
  Users = "users",
  Connections = "connections",
  Billing = "billing",
  Profile = "profile",
  Security = "security"
}

function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>(AppPage.Dashboard);

  // Render the current page based on the state
  const renderCurrentPage = () => {
    switch (currentPage) {
      case AppPage.Dashboard:
        return <Dashboard />;
      case AppPage.NewOrder:
        return <NewOrder />;
      case AppPage.OrderList:
        return <OrderList />;
      case AppPage.AdminQueue:
        return <AdminQueue />;
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
        return <BillingCredits />;
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
