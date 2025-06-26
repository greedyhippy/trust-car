// src/types/vehicle.ts
export interface VehicleData {
  registration: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  color: string;
  fuelType: string;
  engineSize: string;
  owner?: {
    name?: string;
    address?: string;
  };
  // Image properties from API
  imageUrl?: string;
  thumbnailUrl?: string;
}

export interface VehicleApiResponse {
  success: boolean;
  data?: VehicleData;
  metadata?: Record<string, any>;
  message?: string;
}

// src/types/blockchain.ts
export type BlockchainAction = 'register' | 'transfer' | 'service' | 'info';

export interface TransactionResult {
  txId: string;
  confirmedRound: number;
  message?: string;
}

export interface ServiceRecord {
  type: string;
  mileage: string;
  provider?: string;
  date?: string;
}
