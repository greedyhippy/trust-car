// src/utils/logger.ts
// Production-ready logging utility

export const VehicleLogger = {
  info: (message: string, data?: any) => {
    // In production, you might want to send to a logging service
    // For now, keeping minimal logging for critical info only
  },

  error: (message: string, error?: any) => {
    // Always log errors to console for debugging
    console.error(`[ERROR] ${message}`, error || '');
  },

  success: (message: string, data?: any) => {
    // Success messages can be logged in development
    if (import.meta.env.DEV) {
      console.log(`[SUCCESS] ${message}`, data || '');
    }
  },

  api: (message: string, data?: any) => {
    // API logs only in development
    if (import.meta.env.DEV) {
      console.log(`[API] ${message}`, data || '');
    }
  },

  blockchain: (message: string, data?: any) => {
    // Blockchain logs only in development
    if (import.meta.env.DEV) {
      console.log(`[BLOCKCHAIN] ${message}`, data || '');
    }
  }
};
