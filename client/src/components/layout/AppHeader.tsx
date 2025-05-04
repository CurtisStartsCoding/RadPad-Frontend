import React, { useState } from "react";
import { AlertCircle, Menu, X, Home, User, LogOut, Settings, File, Building2 } from "lucide-react";
import { 
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  title?: string;
  onNavigate?: (path: string) => void;
  className?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({ 
  title = "RadOrderPad", 
  onNavigate,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleNavigation = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    }
    setIsOpen(false);
  };
  
  return (
    <header className={cn("bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4", className)}>
      {/* Logo / Title */}
      <div className="flex items-center space-x-2">
        <AlertCircle className="h-6 w-6 text-blue-800" />
        <span className="text-lg font-semibold text-blue-800">{title}</span>
      </div>
      
      {/* User Avatar and Mobile Menu */}
      <div className="flex items-center">
        {/* User Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <div className="bg-blue-800 text-white font-medium rounded-full h-8 w-8 flex items-center justify-center">
              U
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => handleNavigation("/home")}>
              <Home className="mr-2 h-4 w-4" />
              <span>Home</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigation("/admin")}>
              <File className="mr-2 h-4 w-4" />
              <span>Admin Panel</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigation("/orders")}>
              <File className="mr-2 h-4 w-4" />
              <span>Orders</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigation("/organization")}>
              <Building2 className="mr-2 h-4 w-4" />
              <span>Organization</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigation("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigation("/logout")}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Hamburger Menu (Mobile) */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="ml-4 focus:outline-none" aria-label="Menu">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] sm:w-[350px]">
            <div className="flex flex-col h-full">
              <div className="py-6">
                <h2 className="text-lg font-semibold mb-6">Menu</h2>
                <nav className="space-y-4">
                  <a 
                    href="#" 
                    className="flex items-center py-2 px-3 rounded-lg hover:bg-slate-100"
                    onClick={(e) => { e.preventDefault(); handleNavigation("/home"); }}
                  >
                    <Home className="h-5 w-5 mr-3 text-slate-600" />
                    <span className="text-slate-900">Home</span>
                  </a>
                  <a 
                    href="#" 
                    className="flex items-center py-2 px-3 rounded-lg hover:bg-slate-100"
                    onClick={(e) => { e.preventDefault(); handleNavigation("/admin"); }}
                  >
                    <File className="h-5 w-5 mr-3 text-slate-600" />
                    <span className="text-slate-900">Admin Panel</span>
                  </a>
                  <a 
                    href="#" 
                    className="flex items-center py-2 px-3 rounded-lg hover:bg-slate-100"
                    onClick={(e) => { e.preventDefault(); handleNavigation("/orders"); }}
                  >
                    <File className="h-5 w-5 mr-3 text-slate-600" />
                    <span className="text-slate-900">Orders</span>
                  </a>
                  <a 
                    href="#" 
                    className="flex items-center py-2 px-3 rounded-lg hover:bg-slate-100"
                    onClick={(e) => { e.preventDefault(); handleNavigation("/organization"); }}
                  >
                    <Building2 className="h-5 w-5 mr-3 text-slate-600" />
                    <span className="text-slate-900">Organization</span>
                  </a>
                  <a 
                    href="#" 
                    className="flex items-center py-2 px-3 rounded-lg hover:bg-slate-100"
                    onClick={(e) => { e.preventDefault(); handleNavigation("/settings"); }}
                  >
                    <Settings className="h-5 w-5 mr-3 text-slate-600" />
                    <span className="text-slate-900">Settings</span>
                  </a>
                </nav>
              </div>
              
              <div className="mt-auto border-t border-slate-200 pt-4">
                <a 
                  href="#" 
                  className="flex items-center py-2 px-3 text-red-600 rounded-lg hover:bg-red-50"
                  onClick={(e) => { e.preventDefault(); handleNavigation("/logout"); }}
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  <span>Log out</span>
                </a>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default AppHeader;