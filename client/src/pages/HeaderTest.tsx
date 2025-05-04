import React from "react";
import AppHeader from "@/components/layout/AppHeader";

const HeaderTest: React.FC = () => {
  const handleNavigate = (path: string) => {
    console.log(`Navigating to: ${path}`);
    // In a real app, this would use router navigation
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader onNavigate={handleNavigate} />
      
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Header Test Page</h1>
          <p className="mb-4">
            This page demonstrates the app header with hamburger menu. 
            Try resizing the window to see how it responds.
          </p>
          <p>
            Click on the user avatar (U) or the hamburger menu icon to see the navigation options.
          </p>
        </div>
      </main>
    </div>
  );
};

export default HeaderTest;