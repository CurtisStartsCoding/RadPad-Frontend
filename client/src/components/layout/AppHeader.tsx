import React, { useState } from "react";
import { Home, LogOut, Settings, FileText, Building2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  onNavigate?: (path: string) => void;
  className?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({ 
  title = "RadOrderPad", 
  subtitle,
  onNavigate,
  className
}) => {
  const handleNavigation = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    }
  };
  
  return (
    <header className={cn("bg-white border-b border-gray-100 flex items-center justify-between py-2.5 px-4", className)}>
      {/* Logo / Title */}
      <div>
        <h1 className="text-blue-900 font-medium text-base">{title}</h1>
        {subtitle && <p className="text-sm text-gray-600 mt-0.5">{subtitle}</p>}
      </div>
      
      {/* Controls */}
      <div className="flex items-center space-x-3">
        {/* User Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="focus:outline-none rounded-full bg-blue-800 text-white font-medium h-8 w-8 flex items-center justify-center">
              U
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-gray-500 px-4 py-2 text-xs">MENU</DropdownMenuLabel>
            <DropdownMenuItem className="py-2 cursor-pointer" onClick={() => handleNavigation("/home")}>
              <Home className="mr-2 h-4 w-4" />
              <span>Home</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="py-2 cursor-pointer" onClick={() => handleNavigation("/admin")}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Admin Panel</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="py-2 cursor-pointer" onClick={() => handleNavigation("/orders")}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Orders</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="py-2 cursor-pointer" onClick={() => handleNavigation("/organization")}>
              <Building2 className="mr-2 h-4 w-4" />
              <span>Organization</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="py-2 cursor-pointer" onClick={() => handleNavigation("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="py-2 cursor-pointer text-red-600" onClick={() => handleNavigation("/logout")}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Hamburger Menu Icon */}
        <button className="focus:outline-none" aria-label="Menu">
          <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>
    </header>
  );
};

export default AppHeader;