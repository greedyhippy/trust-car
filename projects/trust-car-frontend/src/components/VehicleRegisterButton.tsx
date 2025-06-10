// src/components/VehicleRegisterButton.tsx
// Step 2: Simple blockchain registration button

import React, { useState } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { VehicleLogger } from '../utils/logger';

interface VehicleRegisterButtonProps {
  vehicleData: {
    registration: string;
    vin: string;
    make: string;
    model: string;
    year: number;
  };
}

export const VehicleRegisterButton: React.FC<VehicleRegisterButtonProps> = ({ vehicleData }) => {
  const { activeAddress, signTransactions, sendTransactions } = useWallet();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const registerVehicle = async () => {
    VehicleLogger.blockchain('Starting vehicle registration', {
      registration: vehicleData.registration,
      wallet: activeAddress
    });

    if (!activeAddress) {
      setMessage('Please connect your wallet first');
      setStatus('error');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      // For now, just log the action - we'll add the actual contract call next
      VehicleLogger.blockchain('Would register vehicle:', {
        registration: vehicleData.registration,
        vin: vehicleData.vin,
        make: vehicleData.make,
        model: vehicleData.model,
        year: vehicleData.year,
        owner: activeAddress
      });

      // Simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      setStatus('success');
      setMessage(`Vehicle ${vehicleData.registration} registered successfully!`);
      VehicleLogger.success('Vehicle registration complete', { registration: vehicleData.registration });

    } catch (error) {
      VehicleLogger.error('Registration failed', error);
      setStatus('error');
      setMessage('Failed to register vehicle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      marginTop: '20px',
      padding: '15px',
      backgroundColor: '#e3f2fd',
      borderRadius: '8px',
      border: '1px solid #1976d2'
    }}>
      <h4 style={{ marginTop: 0 }}>Register on Algorand Blockchain</h4>

      {!activeAddress ? (
        <p style={{ color: '#d32f2f' }}>
          ⚠️ Please connect your wallet to register this vehicle
        </p>
      ) : (
        <p style={{ color: '#1976d2', fontSize: '14px' }}>
          Connected wallet: {activeAddress.slice(0, 6)}...{activeAddress.slice(-4)}
        </p>
      )}

      <button
        onClick={registerVehicle}
        disabled={loading || !activeAddress}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: loading || !activeAddress ? '#ccc' : '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading || !activeAddress ? 'not-allowed' : 'pointer',
          marginRight: '10px'
        }}
      >
        {loading ? 'Registering...' : 'Register Vehicle'}
      </button>

      {/* Status Messages */}
      {status === 'success' && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#c8e6c9',
          color: '#2e7d32',
          borderRadius: '4px'
        }}>
          ✅ {message}
        </div>
      )}

      {status === 'error' && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#ffcdd2',
          color: '#c62828',
          borderRadius: '4px'
        }}>
          ❌ {message}
        </div>
      )}

      {/* Registration Info */}
      <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
        <strong>What happens when you register:</strong>
        <ul style={{ marginLeft: '20px', marginTop: '5px' }}>
          <li>Vehicle data is stored permanently on Algorand blockchain</li>
          <li>You become the registered owner</li>
          <li>Registration cannot be altered (only ownership can be transferred)</li>
          <li>All data is publicly verifiable</li>
        </ul>
      </div>
    </div>
  );
};
