import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date string to US format (MM/DD/YYYY)
 * @param dateString - ISO date string or any valid date string
 * @returns Formatted date string in MM/DD/YYYY format
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formats a date string to US format with abbreviated month (Jan 15, 2024)
 * @param dateString - ISO date string or any valid date string
 * @returns Formatted date string with abbreviated month
 */
export function formatDateShort(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Formats a date string to US format with full month name (January 15, 2024)
 * @param dateString - ISO date string or any valid date string
 * @returns Formatted date string with full month name
 */
export function formatDateLong(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}
