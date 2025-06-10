// src/utils/logger.ts
// Simple logger utility to help us debug as we build

export const VehicleLogger = {
  info: (message: string, data?: any) => {
    console.log(`[VEHICLE-INFO] ${new Date().toISOString()} - ${message}`, data || '');
  },

  error: (message: string, error?: any) => {
    console.error(`[VEHICLE-ERROR] ${new Date().toISOString()} - ${message}`, error || '');
  },

  success: (message: string, data?: any) => {
    console.log(`[VEHICLE-SUCCESS] ✓ ${new Date().toISOString()} - ${message}`, data || '');
  },

  api: (message: string, data?: any) => {
    console.log(`[VEHICLE-API] ${new Date().toISOString()} - ${message}`, data || '');
  },

  blockchain: (message: string, data?: any) => {
    console.log(`[VEHICLE-BLOCKCHAIN] ${new Date().toISOString()} - ${message}`, data || '');
  }
};

// Test the logger on load
VehicleLogger.info('Logger utility loaded successfully');
