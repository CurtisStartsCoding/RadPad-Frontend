import { AppPage } from "@/App";
import { UserRole, roleDisplayNames, hasAccess } from "@/lib/roles";
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
  AlertCircle,
  UserCog,
  ChevronDown,
  Beaker,
  Building,
  Database,
  BarChart,
  CheckCircle2,
  Settings,
  UserPlus
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SidebarProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

// Define navigation items with their icons and access control
const navigationItems = [
  {
    section: "Core Workflow",
    items: [
      { page: AppPage.Dashboard, label: "Dashboard", icon: <LayoutDashboard /> },
      { page: AppPage.NewOrder, label: "New Order", icon: <PlusCircle /> },
      { page: AppPage.OrderList, label: "Order List", icon: <FileText /> },
      { page: AppPage.AdminQueue, label: "Admin Queue", icon: <CheckSquare /> },
      { page: AppPage.RadiologyQueue, label: "Radiology Queue", icon: <List /> }
    ]
  },
  {
    section: "Organization",
    items: [
      { page: AppPage.OrgProfile, label: "Organization Profile", icon: <Building2 /> },
      { page: AppPage.Locations, label: "Locations", icon: <MapPin /> },
      { page: AppPage.Users, label: "Users", icon: <Users /> },
      { page: AppPage.Connections, label: "Connections", icon: <Link /> },
      { page: AppPage.Billing, label: "Billing & Credits", icon: <CreditCard /> }
    ]
  },
  {
    section: "Account",
    items: [
      { page: AppPage.Profile, label: "My Profile", icon: <User /> },
      { page: AppPage.Security, label: "Security", icon: <Lock /> }
    ]
  },
  {
    section: "Auth",
    items: [
      { page: AppPage.Login, label: "Login", icon: <Lock /> },
      { page: AppPage.TrialAuth, label: "Trial", icon: <Beaker /> }
    ]
  },
  {
    section: "Onboarding",
    items: [
      { page: AppPage.OrgSignUp, label: "Organization Sign Up", icon: <Building2 /> },
      { page: AppPage.OrgVerification, label: "Email Verification", icon: <CheckCircle2 /> },
      { page: AppPage.OrgSetup, label: "Initial Setup", icon: <Settings /> },
      { page: AppPage.OrgLocations, label: "Locations Setup", icon: <MapPin /> },
      { page: AppPage.OrgUsers, label: "Users Setup", icon: <UserPlus /> }
    ]
  }
];

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, currentRole, onRoleChange }) => {
  // Check if a link is active based on the current page
  const isActive = (page: AppPage) => currentPage === page;

  const handleRoleChange = (value: string) => {
    onRoleChange(value as UserRole);
    
    // After role change, navigate to a page the new role has access to
    const validPage = Object.values(AppPage).find(page => hasAccess(value as UserRole, page));
    if (validPage) {
      onNavigate(validPage);
    }
  };

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0">
      {/* Logo Area */}
      <div className="h-16 px-4 border-b border-slate-200 flex items-center">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-8 w-8 text-primary" />
          <span className="text-lg font-semibold text-primary">RadOrderPad</span>
        </div>
      </div>
      
      {/* Role Selector */}
      <div className="p-3 border-b border-slate-200">
        <p className="text-xs text-slate-500 mb-1.5">Current Role:</p>
        <Select defaultValue={currentRole} onValueChange={handleRoleChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(UserRole).map((role) => (
              <SelectItem key={role} value={role}>
                {roleDisplayNames[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Navigation Links */}
      <div className="flex-1 overflow-auto py-2 px-1">
        {navigationItems.map((section, sectionIndex) => {
          const visibleItems = section.items.filter(item => 
            hasAccess(currentRole, item.page)
          );
          
          // Only render section if it has visible items
          if (visibleItems.length === 0) return null;
          
          return (
            <div key={sectionIndex}>
              <div className={`${sectionIndex > 0 ? 'mt-4' : ''} mb-2 px-3 text-xs font-medium uppercase text-slate-500`}>
                {section.section}
              </div>
              
              {visibleItems.map((item, itemIndex) => (
                <a 
                  key={itemIndex}
                  href="#" 
                  onClick={(e) => { e.preventDefault(); onNavigate(item.page); }}
                  className={`sidebar-link ${isActive(item.page) ? 'active' : ''}`}
                >
                  {item.icon}
                  {item.label}
                </a>
              ))}
            </div>
          );
        })}
        
        {/* Super Admin section - only visible for Super Admin */}
        {currentRole === UserRole.SuperAdmin && (
          <div>
            <div className="mt-4 mb-2 px-3 text-xs font-medium uppercase text-slate-500">
              Super Admin
            </div>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); onNavigate(AppPage.SuperAdminDashboard); }}
              className={`sidebar-link ${isActive(AppPage.SuperAdminDashboard) ? 'active' : ''}`}
            >
              <BarChart className="h-4 w-4" />
              Dashboard
            </a>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); onNavigate(AppPage.SuperAdminOrganizations); }}
              className={`sidebar-link ${isActive(AppPage.SuperAdminOrganizations) ? 'active' : ''}`}
            >
              <Building className="h-4 w-4" />
              Organizations
            </a>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); onNavigate(AppPage.SuperAdminUsers); }}
              className={`sidebar-link ${isActive(AppPage.SuperAdminUsers) ? 'active' : ''}`}
            >
              <Users className="h-4 w-4" />
              Users
            </a>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); onNavigate(AppPage.SuperAdminLogs); }}
              className={`sidebar-link ${isActive(AppPage.SuperAdminLogs) ? 'active' : ''}`}
            >
              <Database className="h-4 w-4" />
              System Logs
            </a>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); onNavigate(AppPage.SuperAdminBilling); }}
              className={`sidebar-link ${isActive(AppPage.SuperAdminBilling) ? 'active' : ''}`}
            >
              <CreditCard className="h-4 w-4" />
              Billing
            </a>
          </div>
        )}
      </div>
      
      {/* User Profile Section */}
      <div className="mt-auto border-t border-slate-200 p-4">
        <div className="flex items-center">
          <div className="bg-primary-lighter text-primary font-medium rounded-full h-8 w-8 flex items-center justify-center">
            {currentRole === UserRole.SuperAdmin ? 'SA' : 
             (currentRole === UserRole.Physician || currentRole === UserRole.TrialPhysician) ? 'JD' : 
             currentRole === UserRole.Radiologist ? 'RD' : 'AD'}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">
              {(currentRole === UserRole.Physician || currentRole === UserRole.TrialPhysician) ? 'Dr. John Doe' : 
               currentRole === UserRole.Radiologist ? 'Dr. Rebecca Davis' : 
               currentRole === UserRole.SuperAdmin ? 'System Administrator' : 'Alice Johnson'}
            </p>
            <p className="text-xs text-slate-500">{roleDisplayNames[currentRole]}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
