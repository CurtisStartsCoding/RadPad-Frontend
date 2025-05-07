import React from 'react';
import { Route, Switch } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient';
import { AuthProvider } from './useAuth';
import LoginPage from './login.sample';

// Import the PhysicianInterface component from the package
// This would be the main component for the dictation functionality
// This is a placeholder for the actual PhysicianInterface component
// When implementing in your project, replace this with the actual import
// Example: import PhysicianInterface from './components/physician/PhysicianInterface';
const PhysicianInterface = (props: any) => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Radiology Order Dictation</h1>
      <p className="text-gray-600">
        This is a placeholder for the PhysicianInterface component.
        Replace this with the actual component from the package.
      </p>
    </div>
  );
};

// Create a loading component for lazy-loaded routes
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
    <span className="ml-2 text-lg">Loading...</span>
  </div>
);

// Create a protected route component
const ProtectedRoute = ({ component: Component, ...rest }: any) => {
  // You would implement your own authentication check here
  const isAuthenticated = localStorage.getItem('rad_order_pad_access_token') !== null;
  
  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    window.location.href = '/login';
    return null;
  }
  
  return <Component {...rest} />;
};

// Create a dictation page component
const DictationPage = () => {
  return <PhysicianInterface />;
};

// Create the main app component
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Switch>
            <Route path="/login" component={LoginPage} />
            <Route path="/dictation">
              <ProtectedRoute component={DictationPage} />
            </Route>
            <Route path="/">
              {/* Redirect to dictation page by default */}
              {() => {
                window.location.href = '/dictation';
                return null;
              }}
            </Route>
            <Route>
              {/* 404 page */}
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900">404</h1>
                  <p className="text-xl text-gray-600">Page not found</p>
                  <button
                    onClick={() => (window.location.href = '/')}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Go Home
                  </button>
                </div>
              </div>
            </Route>
          </Switch>
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;