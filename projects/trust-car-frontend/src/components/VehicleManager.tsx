// src/components/VehicleManager.tsx
// Comprehensive vehicle management interface

import React, { useState } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { VehicleLogger } from '../utils/logger';
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs';
import algosdk from 'algosdk';

// Vehicle data interface
interface VehicleData {
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
}

// Action types
type ActionType = 'register' | 'transfer' | 'service' | 'info' | null;

const APP_ID = 1012; // Your deployed App ID
const API_BASE = 'https://irish-vehicle-registry-api.vercel.app';

export const VehicleManager: React.FC = () => {
  const { activeAddress, signTransactions } = useWallet();

  // State
  const [registration, setRegistration] = useState('');
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [actionStatus, setActionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [actionMessage, setActionMessage] = useState('');

  // Form inputs for actions
  const [newOwner, setNewOwner] = useState('');
  const [serviceMileage, setServiceMileage] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [serviceProvider, setServiceProvider] = useState('');

  // Search vehicle from API
  const searchVehicle = async () => {
    VehicleLogger.info('Starting vehicle search', { registration });
    setError(null);
    setVehicleData(null);
    setLoading(true);
    setActiveAction(null);

    try {
      const url = `${API_BASE}/api/vehicles/${registration}`;
      VehicleLogger.api('Calling API', { url });

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Vehicle not found (${response.status})`);
      }

      const result = await response.json();
      VehicleLogger.success('Vehicle data retrieved', result);

      if (result.success && result.data) {
        setVehicleData(result.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      VehicleLogger.error('Search failed', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Execute blockchain action
  const executeAction = async () => {
    if (!activeAddress || !vehicleData || !activeAction) return;

    setActionStatus('loading');
    setActionMessage('');

    try {
      const algodConfig = getAlgodConfigFromViteEnvironment();
      const algodClient = new algosdk.Algodv2(
        algodConfig.token as string,
        algodConfig.server,
        algodConfig.port
      );

      const suggestedParams = await algodClient.getTransactionParams().do();
      let appArgs: Uint8Array[] = [];
      let logMessage = '';

      // Prepare transaction based on action type
      switch (activeAction) {
        case 'register':
          const registerMethod = algosdk.ABIMethod.fromSignature("registerVehicle(string)string");
          appArgs = [
            registerMethod.getSelector(),
            algosdk.ABIType.from("string").encode(vehicleData.registration)
          ];
          logMessage = 'Registering vehicle';
          break;

        case 'transfer':
          if (!newOwner) throw new Error('Please enter new owner address');
          const transferMethod = algosdk.ABIMethod.fromSignature("transferOwnership(string,string)string");
          appArgs = [
            transferMethod.getSelector(),
            algosdk.ABIType.from("string").encode(vehicleData.registration),
            algosdk.ABIType.from("string").encode(newOwner)
          ];
          logMessage = 'Transferring ownership';
          break;

        case 'service':
          if (!serviceMileage || !serviceType) throw new Error('Please fill all service details');
          const serviceMethod = algosdk.ABIMethod.fromSignature("addServiceRecord(string,string)string");
          appArgs = [
            serviceMethod.getSelector(),
            algosdk.ABIType.from("string").encode(vehicleData.registration),
            algosdk.ABIType.from("string").encode(`${serviceType} at ${serviceMileage}km`)
          ];
          logMessage = 'Adding service record';
          break;

        case 'info':
          const infoMethod = algosdk.ABIMethod.fromSignature("getInfo()string");
          appArgs = [infoMethod.getSelector()];
          logMessage = 'Getting contract info';
          break;
      }

      VehicleLogger.blockchain(logMessage, { action: activeAction, registration: vehicleData.registration });

      // Create and sign transaction
      const txn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: activeAddress,
        appIndex: APP_ID,
        appArgs: appArgs,
        suggestedParams: suggestedParams,
      });

      const txnB64 = algosdk.encodeUnsignedTransaction(txn);
      const signedTxns = await signTransactions([txnB64]);

      // Send transaction
      const response = await algodClient.sendRawTransaction(signedTxns[0]).do();
      const txId = response.txid; // lowercase 'txid'

      VehicleLogger.blockchain('Transaction sent', { txId });

      // Wait for confirmation
      const result = await algosdk.waitForConfirmation(algodClient, txId, 4);

      // Extract return value
      let returnValue = "Action completed successfully!";
      if (result['logs'] && result['logs'].length > 0) {
        try {
          const decoder = new TextDecoder();
          // Skip the first 4 bytes (ABI return prefix) and decode the string
          const logBytes = result['logs'][0];
          const returnBytes = logBytes.slice(4);
          const lengthBytes = returnBytes.slice(0, 2);
          const length = (lengthBytes[0] << 8) | lengthBytes[1];
          const stringBytes = returnBytes.slice(2, 2 + length);
          returnValue = decoder.decode(stringBytes);
        } catch (e) {
          VehicleLogger.info('Could not decode return value', e);
        }
      }

      setActionStatus('success');
      setActionMessage(`✅ ${returnValue} (Tx: ${txId.substring(0, 8)}...)`);
      VehicleLogger.success('Action completed', { action: activeAction, txId, returnValue });

      // Reset form fields
      if (activeAction === 'transfer') setNewOwner('');
      if (activeAction === 'service') {
        setServiceMileage('');
        setServiceType('');
        setServiceProvider('');
      }

    } catch (error: any) {
      VehicleLogger.error('Action failed', error);
      setActionStatus('error');
      setActionMessage(`Failed: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
        Irish Vehicle Registry - Blockchain Manager
      </h1>

      {/* Search Section */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h2>Search Vehicle</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Enter registration (e.g., 21G99999)"
            value={registration}
            onChange={(e) => setRegistration(e.target.value.toUpperCase())}
            style={{
              flex: 1,
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
          <button
            onClick={searchVehicle}
            disabled={!registration || loading}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Test registrations */}
        <div style={{ fontSize: '12px', color: '#666' }}>
          <strong>Test vehicles:</strong> 21G99999 (Tesla), 12D12345 (Corolla), 24L86420 (BMW),
          16WX7890 (Peugeot), 23G97531 (Lexus)
        </div>

        {error && (
          <div style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#ffebee',
            color: '#c62828',
            borderRadius: '4px'
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Vehicle Details & Actions */}
      {vehicleData && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Vehicle Info Card */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3>Vehicle Details</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>Registration:</td>
                  <td style={{ padding: '10px' }}>{vehicleData.registration}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>VIN:</td>
                  <td style={{ padding: '10px' }}>{vehicleData.vin}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>Make/Model:</td>
                  <td style={{ padding: '10px' }}>{vehicleData.make} {vehicleData.model}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>Year:</td>
                  <td style={{ padding: '10px' }}>{vehicleData.year}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>Color:</td>
                  <td style={{ padding: '10px' }}>{vehicleData.color || 'N/A'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>Fuel Type:</td>
                  <td style={{ padding: '10px' }}>{vehicleData.fuelType}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>Engine Size:</td>
                  <td style={{ padding: '10px' }}>{vehicleData.engineSize}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Blockchain Actions Card */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3>Blockchain Actions</h3>

            {!activeAddress ? (
              <p style={{ color: '#d32f2f' }}>
                ⚠️ Please connect your wallet to perform blockchain actions
              </p>
            ) : (
              <>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                  Wallet: {activeAddress.slice(0, 6)}...{activeAddress.slice(-4)} | App ID: {APP_ID}
                </p>

                {/* Action Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                  <button
                    onClick={() => setActiveAction('register')}
                    style={{
                      padding: '10px',
                      backgroundColor: activeAction === 'register' ? '#1976d2' : '#e0e0e0',
                      color: activeAction === 'register' ? 'white' : 'black',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Register Vehicle
                  </button>
                  <button
                    onClick={() => setActiveAction('transfer')}
                    style={{
                      padding: '10px',
                      backgroundColor: activeAction === 'transfer' ? '#1976d2' : '#e0e0e0',
                      color: activeAction === 'transfer' ? 'white' : 'black',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Transfer Ownership
                  </button>
                  <button
                    onClick={() => setActiveAction('service')}
                    style={{
                      padding: '10px',
                      backgroundColor: activeAction === 'service' ? '#1976d2' : '#e0e0e0',
                      color: activeAction === 'service' ? 'white' : 'black',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Add Service Record
                  </button>
                  <button
                    onClick={() => setActiveAction('info')}
                    style={{
                      padding: '10px',
                      backgroundColor: activeAction === 'info' ? '#1976d2' : '#e0e0e0',
                      color: activeAction === 'info' ? 'white' : 'black',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Get Contract Info
                  </button>
                </div>

                {/* Action Forms */}
                {activeAction && (
                  <div style={{
                    padding: '15px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    marginBottom: '15px'
                  }}>
                    {activeAction === 'register' && (
                      <div>
                        <h4>Register Vehicle on Blockchain</h4>
                        <p style={{ fontSize: '14px', color: '#666' }}>
                          This will permanently record {vehicleData.registration} on the Algorand blockchain.
                        </p>
                      </div>
                    )}

                    {activeAction === 'transfer' && (
                      <div>
                        <h4>Transfer Ownership</h4>
                        <input
                          type="text"
                          placeholder="New owner address (e.g., KHXEW77SJC...)"
                          value={newOwner}
                          onChange={(e) => setNewOwner(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            marginBottom: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                    )}

                    {activeAction === 'service' && (
                      <div>
                        <h4>Add Service Record</h4>
                        <select
                          value={serviceType}
                          onChange={(e) => setServiceType(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            marginBottom: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                        >
                          <option value="">Select service type</option>
                          <option value="Oil Change">Oil Change</option>
                          <option value="Tire Rotation">Tire Rotation</option>
                          <option value="Brake Service">Brake Service</option>
                          <option value="General Maintenance">General Maintenance</option>
                          <option value="Major Service">Major Service</option>
                        </select>
                        <input
                          type="number"
                          placeholder="Mileage (km)"
                          value={serviceMileage}
                          onChange={(e) => setServiceMileage(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            marginBottom: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Service provider (optional)"
                          value={serviceProvider}
                          onChange={(e) => setServiceProvider(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            marginBottom: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                    )}

                    {activeAction === 'info' && (
                      <div>
                        <h4>Get Contract Information</h4>
                        <p style={{ fontSize: '14px', color: '#666' }}>
                          Retrieve general information about the smart contract.
                        </p>
                      </div>
                    )}

                    <button
                      onClick={executeAction}
                      disabled={actionStatus === 'loading'}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: actionStatus === 'loading' ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {actionStatus === 'loading' ? 'Processing...' : `Execute ${activeAction}`}
                    </button>
                  </div>
                )}

                {/* Status Messages */}
                {actionMessage && (
                  <div style={{
                    padding: '10px',
                    backgroundColor: actionStatus === 'success' ? '#c8e6c9' : '#ffcdd2',
                    color: actionStatus === 'success' ? '#2e7d32' : '#c62828',
                    borderRadius: '4px'
                  }}>
                    {actionMessage}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
