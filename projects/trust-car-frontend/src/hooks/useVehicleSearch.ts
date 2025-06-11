// src/hooks/useVehicleSearch.ts
import { useState, useCallback } from 'react';
import { VehicleApiService } from '../services/api/vehicleApi';
import { VehicleData } from '../types/vehicle';
import { VehicleLogger } from '../utils/logger';

interface VehicleSearchState {
  vehicleData: VehicleData | null;
  loading: boolean;
  error: string | null;
}

export const useVehicleSearch = () => {
  const [state, setState] = useState<VehicleSearchState>({
    vehicleData: null,
    loading: false,
    error: null,
  });

  const vehicleApi = VehicleApiService.getInstance();

  const searchVehicle = useCallback(async (registration: string) => {
    if (!registration.trim()) {
      setState(prev => ({ ...prev, error: 'Registration is required' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    VehicleLogger.info('Searching for vehicle', { registration });

    try {
      const response = await vehicleApi.searchVehicle(registration.trim());

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          loading: false,
          vehicleData: response.data!,
          error: null
        }));
        VehicleLogger.success('Vehicle found', response.data);
      } else {
        throw new Error(response.message || 'Vehicle not found');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      VehicleLogger.error('Vehicle search failed', error);

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        vehicleData: null
      }));
    }
  }, [vehicleApi]);

  const clearVehicle = useCallback(() => {
    setState({
      vehicleData: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    searchVehicle,
    clearVehicle
  };
};

