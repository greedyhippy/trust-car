// src/services/api/vehicleApi.ts
import { VehicleApiResponse } from '../../types/vehicle';
import { API_BASE_URL } from '../../constants';
import { VehicleLogger } from '../../utils/logger';

export class VehicleApiService {
  private static instance: VehicleApiService;

  private constructor() {}

  static getInstance(): VehicleApiService {
    if (!VehicleApiService.instance) {
      VehicleApiService.instance = new VehicleApiService();
    }
    return VehicleApiService.instance;
  }

  async searchVehicle(registration: string): Promise<VehicleApiResponse> {
    VehicleLogger.api('Searching for vehicle', { registration });

    try {
      const response = await fetch(`${API_BASE_URL}/api/vehicles/${registration}`);

      if (!response.ok) {
        throw new Error(`Vehicle not found (${response.status})`);
      }

      const result = await response.json();
      VehicleLogger.api('Vehicle found', result);

      return result;
    } catch (error) {
      VehicleLogger.error('Vehicle search failed', error);
      throw error;
    }
  }

  async getVehiclesByType(fuelType?: string): Promise<VehicleApiResponse[]> {
    // Future enhancement
    throw new Error('Not implemented');
  }
}
