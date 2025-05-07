import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date to a human-readable format
 * @param date Date to format
 * @param includeTime Whether to include time in the formatted output
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number | null | undefined,
  includeTime = true
): string {
  if (!date) return "Not specified";
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return "Invalid date";
  }
  
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  
  if (includeTime) {
    options.hour = "numeric";
    options.minute = "numeric";
  }
  
  return new Intl.DateTimeFormat("en-US", options).format(dateObj);
}

/**
 * Calculate age from a date of birth
 * @param dob Date of birth
 * @returns Age in years
 */
export function calculateAge(dob: Date | string | null | undefined): number | null {
  if (!dob) return null;
  
  const dobDate = dob instanceof Date ? dob : new Date(dob);
  
  if (isNaN(dobDate.getTime())) {
    return null;
  }
  
  const today = new Date();
  let age = today.getFullYear() - dobDate.getFullYear();
  const monthDiff = today.getMonth() - dobDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
    age--;
  }
  
  return age;
}