import { AppPage } from "@/App";
import { 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  CheckSquare, 
  List, 
  Building2, 
  MapPin, 
  Users, 
  Link, 
  CreditCard, 
  User, 
  Lock, 
  AlertCircle 
} from "lucide-react";

interface SidebarProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  // Check if a link is active based on the current page
  const isActive = (page: AppPage) => currentPage === page;

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0">
      {/* Logo Area */}
      <div className="h-16 px-4 border-b border-slate-200 flex items-center">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-8 w-8 text-primary" />
          <span className="text-lg font-semibold text-primary">RadOrderPad</span>
        </div>
      </div>
      
      {/* Navigation Links */}
      <div className="flex-1 overflow-auto py-2 px-1">
        <div className="mb-2 px-3 text-xs font-medium uppercase text-slate-500">Core Workflow</div>
        
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); onNavigate(AppPage.Dashboard); }}
          className={`sidebar-link ${isActive(AppPage.Dashboard) ? 'active' : ''}`}
        >
          <LayoutDashboard />
          Dashboard
        </a>
        
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); onNavigate(AppPage.NewOrder); }}
          className={`sidebar-link ${isActive(AppPage.NewOrder) ? 'active' : ''}`}
        >
          <PlusCircle />
          New Order
        </a>
        
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); onNavigate(AppPage.OrderList); }}
          className={`sidebar-link ${isActive(AppPage.OrderList) ? 'active' : ''}`}
        >
          <FileText />
          Order List
        </a>
        
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); onNavigate(AppPage.AdminQueue); }}
          className={`sidebar-link ${isActive(AppPage.AdminQueue) ? 'active' : ''}`}
        >
          <CheckSquare />
          Admin Queue
        </a>
        
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); onNavigate(AppPage.RadiologyQueue); }}
          className={`sidebar-link ${isActive(AppPage.RadiologyQueue) ? 'active' : ''}`}
        >
          <List />
          Radiology Queue
        </a>
        
        <div className="mt-4 mb-2 px-3 text-xs font-medium uppercase text-slate-500">Organization</div>
        
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); onNavigate(AppPage.OrgProfile); }}
          className={`sidebar-link ${isActive(AppPage.OrgProfile) ? 'active' : ''}`}
        >
          <Building2 />
          Organization Profile
        </a>
        
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); onNavigate(AppPage.Locations); }}
          className={`sidebar-link ${isActive(AppPage.Locations) ? 'active' : ''}`}
        >
          <MapPin />
          Locations
        </a>
        
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); onNavigate(AppPage.Users); }}
          className={`sidebar-link ${isActive(AppPage.Users) ? 'active' : ''}`}
        >
          <Users />
          Users
        </a>
        
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); onNavigate(AppPage.Connections); }}
          className={`sidebar-link ${isActive(AppPage.Connections) ? 'active' : ''}`}
        >
          <Link />
          Connections
        </a>
        
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); onNavigate(AppPage.Billing); }}
          className={`sidebar-link ${isActive(AppPage.Billing) ? 'active' : ''}`}
        >
          <CreditCard />
          Billing & Credits
        </a>
        
        <div className="mt-4 mb-2 px-3 text-xs font-medium uppercase text-slate-500">Account</div>
        
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); onNavigate(AppPage.Profile); }}
          className={`sidebar-link ${isActive(AppPage.Profile) ? 'active' : ''}`}
        >
          <User />
          My Profile
        </a>
        
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); onNavigate(AppPage.Security); }}
          className={`sidebar-link ${isActive(AppPage.Security) ? 'active' : ''}`}
        >
          <Lock />
          Security
        </a>
      </div>
      
      {/* User Profile Section */}
      <div className="mt-auto border-t border-slate-200 p-4">
        <div className="flex items-center">
          <div className="bg-primary-lighter text-primary font-medium rounded-full h-8 w-8 flex items-center justify-center">
            JD
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">Dr. John Doe</p>
            <p className="text-xs text-slate-500">Referring Physician</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
