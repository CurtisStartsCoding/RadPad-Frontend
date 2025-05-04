import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./queryClient";
import { AuthProvider, useAuth } from "./useAuth";
import LoginSample from "./login.sample";

/**
 * Sample App Component
 * 
 * This is a simplified version of the app component that demonstrates
 * how to set up authentication and routing.
 */

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  // If authentication is still loading, show a loading spinner
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <span>Loading...</span>
      </div>
    );
  }
  
  // If not authenticated, show login
  if (!isAuthenticated) {
    return <LoginSample />;
  }
  
  // If authenticated, render the children
  return <>{children}</>;
}

// Dashboard component (protected)
function Dashboard() {
  const { user, logout } = useAuth();
  
  const handleLogout = async () => {
    try {
      await logout();
      console.log("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  
  return (
    <div className="dashboard">
      <header>
        <h1>Dashboard</h1>
        <div className="user-info">
          {user && (
            <>
              <span>Welcome, {user.name}</span>
              <button onClick={handleLogout}>Logout</button>
            </>
          )}
        </div>
      </header>
      
      <main>
        <h2>Your Dashboard</h2>
        <p>This is a protected page that only authenticated users can see.</p>
        
        {user && (
          <div className="user-details">
            <h3>User Information</h3>
            <p>Email: {user.email}</p>
            <p>Role: {user.role}</p>
            <p>ID: {user.id}</p>
          </div>
        )}
      </main>
    </div>
  );
}

// Main App component
function AppSample() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="app">
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default AppSample;