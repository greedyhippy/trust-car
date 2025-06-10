// src/components/VehicleRegisterButton.tsx
// Updated with actual contract integration

import React, { useState } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { VehicleLogger } from '../utils/logger';
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs';
import { IrishVehicleRegistryClient } from '../contracts/IrishVehicleRegistryClient';
import * as algokit from '@algorandfoundation/algokit-utils';
import algosdk from 'algosdk';

interface VehicleRegisterButtonProps {
  vehicleData: {
    registration: string;
    vin: string;
    make: string;
    model: string;
    year: number;
  };
}

// Your deployed App ID
const APP_ID = 1012;

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
      // Get Algod client
      const algodConfig = getAlgodConfigFromViteEnvironment();
      const algodClient = new algosdk.Algodv2(
        algodConfig.token,
        algodConfig.server,
        algodConfig.port
      );

      // Create contract client with proper signer
      const signer = algosdk.makeBasicAccountTransactionSigner({
        addr: activeAddress,
        sk: new Uint8Array(0) // This will be replaced by wallet signer
      });

      const sender = {
        addr: activeAddress,
        signer: async (txns: algosdk.Transaction[]) => {
          return await signTransactions(txns.map(algokit.toTransactionWithSigner));
        }
      };

      const appClient = new IrishVehicleRegistryClient(
        {
          appId: APP_ID,
          sender: sender,
          resolveBy: 'id',
        },
        algodClient
      );

      // Call the contract
      VehicleLogger.blockchain('Calling registerVehicle method', {
        appId: APP_ID,
        registration: vehicleData.registration
      });

      const result = await appClient.registerVehicle({
        registration: vehicleData.registration,
      });

      VehicleLogger.success('Vehicle registration transaction completed', {
        txId: result.transaction.txID(),
        result: result.returnValue
      });

      setStatus('success');
      setMessage(`✅ ${result.returnValue || 'Vehicle registered successfully!'}`);

    } catch (error) {
      VehicleLogger.error('Registration failed', error);
      setStatus('error');
      setMessage(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        <div>
          <p style={{ color: '#1976d2', fontSize: '14px' }}>
            Connected wallet: {activeAddress.slice(0, 6)}...{activeAddress.slice(-4)}
          </p>
          <p style={{ color: '#666', fontSize: '12px' }}>
            App ID: {APP_ID}
          </p>
        </div>
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
          {message}
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
          <li>Transaction is recorded with App ID {APP_ID}</li>
          <li>You can view the transaction in the blockchain explorer</li>
          <li>All data is publicly verifiable</li>
        </ul>
      </div>
    </div>
  );
};
