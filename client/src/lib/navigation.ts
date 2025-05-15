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
export function getNewOrderPath(userRole?: string): string {
  // Check if this is a trial user
  const trialUserData = localStorage.getItem('rad_order_pad_trial_user');
  const isTrialUser = !!trialUserData;
  
  // If the user is a trial user or has a trial user role, navigate to trial-validation
  if (isTrialUser || userRole === UserRole.TrialUser || userRole === 'trial_user') {
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
export function isTrialUser(): boolean {
  const trialUserData = localStorage.getItem('rad_order_pad_trial_user');
  return !!trialUserData;
}

/**
 * Get the user's role from localStorage
 * 
 * @returns The user's role or null if not found
 */
export function getUserRoleFromStorage(): string | null {
  // First check for trial user data
  const trialUserData = localStorage.getItem('rad_order_pad_trial_user');
  if (trialUserData) {
    try {
      const trialUser = JSON.parse(trialUserData);
      if (trialUser.role) {
        return trialUser.role;
      }
    } catch (e) {
      console.error("Error parsing trial user data:", e);
    }
  }
  
  // If no trial user data, try to extract role from regular token
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
  
  return null;
}