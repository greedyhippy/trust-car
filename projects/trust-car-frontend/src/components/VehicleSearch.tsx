// src/components/VehicleSearch.tsx
// Step 1: Simple vehicle search component with extensive logging

import React, { useState } from 'react';
import { VehicleLogger } from '../utils/logger';
import { VehicleRegisterButton } from './VehicleRegisterButton';

// Vehicle data interface matching your API
interface VehicleData {
  registration: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  color: string;
  fuelType: string;
  owner?: {
    name?: string;
    address?: string;
  };
}

export const VehicleSearch: React.FC = () => {
  const [registration, setRegistration] = useState('');
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Your API URL
  const API_BASE = 'https://irish-vehicle-registry-api.vercel.app';

  const searchVehicle = async () => {
    VehicleLogger.info('Starting vehicle search', { registration });

    // Reset previous state
    setError(null);
    setVehicleData(null);
    setLoading(true);

    try {
      // Log API call
      const url = `${API_BASE}/api/vehicles/${registration}`;
      VehicleLogger.api('Calling API', { url });

      const response = await fetch(url);
      VehicleLogger.api('API Response received', {
        status: response.status,
        ok: response.ok
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const result = await response.json();
      VehicleLogger.success('Vehicle data retrieved', result);

      // Extract the actual vehicle data from the response
      if (result.success && result.data) {
        // Log the structure to debug
        VehicleLogger.info('Vehicle data structure', {
          hasOwner: !!result.data.owner,
          ownerType: typeof result.data.owner,
          ownerValue: result.data.owner,
          keys: Object.keys(result.data)
        });
        setVehicleData(result.data);
      } else if (result && !result.success) {
        // API returned an error
        throw new Error(result.message || 'Vehicle not found');
      } else {
        // Direct data format (fallback)
        setVehicleData(result);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      VehicleLogger.error('Search failed', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vehicle-search-container" style={{
      padding: '20px',
      border: '2px solid #e0e0e0',
      borderRadius: '8px',
      marginBottom: '20px'
    }}>
      <h2>Step 1: Search Irish Vehicle Registry</h2>

      {/* Search Input */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Enter registration (e.g., 21G99999)"
          value={registration}
          onChange={(e) => {
            const value = e.target.value.toUpperCase();
            setRegistration(value);
            VehicleLogger.info('Registration input changed', { value });
          }}
          style={{
            padding: '10px',
            fontSize: '16px',
            width: '300px',
            marginRight: '10px'
          }}
        />
        <button
          onClick={searchVehicle}
          disabled={!registration || loading}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: loading ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          Error: {error}
        </div>
      )}

      {/* Vehicle Data Display */}
      {vehicleData && (
        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '15px',
          borderRadius: '4px'
        }}>
          <h3>Vehicle Found:</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '10px' }}>
            <strong>Registration:</strong> <span>{vehicleData.registration || 'N/A'}</span>
            <strong>VIN:</strong> <span>{vehicleData.vin || 'N/A'}</span>
            <strong>Make/Model:</strong> <span>{vehicleData.make || 'N/A'} {vehicleData.model || ''}</span>
            <strong>Year:</strong> <span>{vehicleData.year || 'N/A'}</span>
            <strong>Color:</strong> <span>{vehicleData.color || 'N/A'}</span>
            <strong>Fuel Type:</strong> <span>{vehicleData.fuelType || 'N/A'}</span>
            <strong>Owner:</strong>
            <span>
              {vehicleData.owner?.name || vehicleData.owner || 'Not specified'}
            </span>
          </div>

          {/* Add Register Button */}
          <VehicleRegisterButton vehicleData={vehicleData} />
        </div>
      )}

      {/* Test Registrations */}
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <strong>Test Registrations:</strong> 21G99999 (Tesla), 12D12345 (Corolla), 24L86420 (BMW)
      </div>
    </div>
  );
};
