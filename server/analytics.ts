import { log } from './vite';

/**
 * This file previously contained analytics functionality that is no longer needed
 * since the client now communicates directly with the remote API and generates
 * analytics data client-side using client/src/lib/analyticsUtils.ts.
 *
 * Keeping this file as a placeholder for future analytics-related functionality if needed.
 */

/**
 * Register analytics routes - now a no-op function since analytics are handled client-side
 */
export function registerAnalyticsRoutes(app: any) {
  log('Analytics routes no longer registered - analytics are now handled client-side', 'analytics');
}