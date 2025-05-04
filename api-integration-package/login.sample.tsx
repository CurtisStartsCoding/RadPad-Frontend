import React, { useState } from "react";
import { useAuth } from "./useAuth";

/**
 * Sample Login Component
 * 
 * This is a simplified version of the login component that demonstrates
 * how to use the authentication hook to log in a user.
 */
const LoginSample = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, isLoading: authLoading } = useAuth();
  
  // Combined loading state for UI
  const isLoading = isSubmitting || authLoading;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log("Attempting login with email:", email);
      
      // Use the hook's login function
      const user = await login(email, password);
      
      console.log("Login successful, user data received:", user);
      
      // Verify localStorage has tokens
      const accessToken = localStorage.getItem('rad_order_pad_access_token');
      
      console.log("Token saved:", accessToken ? "Yes" : "No");
      
      // You would typically redirect the user here
      // For example: navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      
      // Display a more detailed error message if available
      let errorMessage = "Invalid email or password. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      
      setError(errorMessage);
      
      // Clear password field on error for security
      setPassword("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <h1>Sign In</h1>
      <p>Enter your credentials to access your account</p>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            disabled={isLoading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            disabled={isLoading}
          />
        </div>
        
        <div className="form-group">
          <button 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </form>
      
      <div className="test-accounts">
        <p>Test Account:</p>
        <p>Email: test.physician@example.com</p>
        <p>Password: password123</p>
      </div>
    </div>
  );
};

export default LoginSample;