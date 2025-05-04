import React, { useState } from "react";
import { Home, LogOut, Settings, FileText, Building2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppPage } from "@/App";

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
  
  const handleNavigation = (page: AppPage) => {
    if (onNavigate) {
      onNavigate(page);
    }
    setShowMenu(false);
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
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-sm">Dr. Jane Smith</p>
                <p className="text-xs text-gray-500">drjane@example.com</p>
              </div>
            </div>
            
            {/* Navigation */}
            <div className="px-4 py-2 border-b border-gray-100">
              <h3 className="text-xs text-gray-500 font-medium mb-2">MENU</h3>
              <nav className="space-y-1">
                <button 
                  className="flex items-center w-full px-3 py-2.5 text-gray-800 hover:bg-gray-100 rounded-md"
                  onClick={() => handleNavigation(AppPage.Dashboard)}
                >
                  <Home className="h-4 w-4 mr-3 text-gray-500" />
                  <span>Home</span>
                </button>
                
                <button 
                  className="flex items-center w-full px-3 py-2.5 text-gray-800 hover:bg-gray-100 rounded-md"
                  onClick={() => handleNavigation(AppPage.AdminQueue)}
                >
                  <FileText className="h-4 w-4 mr-3 text-gray-500" />
                  <span>Admin Panel</span>
                </button>
                
                <button 
                  className="flex items-center w-full px-3 py-2.5 text-gray-800 hover:bg-gray-100 rounded-md"
                  onClick={() => handleNavigation(AppPage.OrderList)}
                >
                  <FileText className="h-4 w-4 mr-3 text-gray-500" />
                  <span>Orders</span>
                </button>
                
                <button 
                  className="flex items-center w-full px-3 py-2.5 text-gray-800 hover:bg-gray-100 rounded-md"
                  onClick={() => handleNavigation(AppPage.OrgProfile)}
                >
                  <Building2 className="h-4 w-4 mr-3 text-gray-500" />
                  <span>Organization</span>
                </button>
                
                <button 
                  className="flex items-center w-full px-3 py-2.5 text-gray-800 hover:bg-gray-100 rounded-md"
                  onClick={() => handleNavigation(AppPage.Security)}
                >
                  <Settings className="h-4 w-4 mr-3 text-gray-500" />
                  <span>Settings</span>
                </button>
              </nav>
            </div>
            
            {/* Logout */}
            <div className="p-2 mt-auto border-t border-gray-100">
              <button 
                className="flex items-center w-full px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-md"
                onClick={() => handleNavigation(AppPage.Login)}
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