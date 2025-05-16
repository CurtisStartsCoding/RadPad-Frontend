/**
 * Navigation utilities for the application
 * This file provides functions for handling navigation logic
 */

import { UserRole } from "./roles";

/**
 * Determine the correct navigation path for the "New Order" button
 * based on the user's role
 * 
 * @param userRole The user's role
 * @returns The path to navigate to
 */
export function getNewOrderPath(userRole?: string | null): string {
  // If the user has a trial user role, navigate to trial-validation
  if (userRole === UserRole.TrialPhysician || userRole === 'trial_physician') {
    return '/trial-validation';
  }
  
  // Otherwise, navigate to new-order
  return '/new-order';
}

/**
 * Check if a user is a trial user based on their token and user data
 * 
 * @returns True if the user is a trial user, false otherwise
 */
export function isTrialUser(userRole?: string | null): boolean {
  // Check if the user role is a trial role
  return userRole === UserRole.TrialPhysician || userRole === 'trial_physician';
}

/**
 * Get the user's role from localStorage
 * 
 * @returns The user's role or null if not found
 */
export function getUserRoleFromStorage(): string | null {
  // Try to extract role from token
  try {
    const token = localStorage.getItem('rad_order_pad_access_token');
    if (token) {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        if (payload && payload.role) {
          return payload.role;
        }
      }
    }
  } catch (e) {
    console.error("Error extracting role from token:", e);
  }
  
  // We no longer need to check for trial user data in localStorage
  
  return null;
}