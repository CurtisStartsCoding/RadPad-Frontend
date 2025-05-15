import { Response } from 'express';
import { log } from './vite';

/**
 * This file previously contained utility functions for handling API requests and responses
 * that are no longer needed since the client now communicates directly with the remote API.
 *
 * Keeping this file as a placeholder for future utility functions if needed.
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

/**
 * Create standard error response - kept for potential future use
 */
export function errorResponse(res: Response, status: number, message: string): void {
  res.status(status).json({
    success: false,
    error: message,
    status
  });
}