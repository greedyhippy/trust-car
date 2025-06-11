// src/components/VehicleManagerV2.tsx
import React, { useState } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { VehicleLogger } from '../utils/logger';
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs';
import algosdk from 'algosdk';

interface VehicleData {
  registration: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  color: string;
  fuelType: string;
  engineSize: string;
}

const APP_ID = 1012;
const API_BASE = 'https://irish-vehicle-registry-api.vercel.app';

export const VehicleManagerV2: React.FC = () => {
  const { activeAddress, signTransactions } = useWallet();
  const [registration, setRegistration] = useState('');
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState('');
  const [actionStatus, setActionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [activeAction, setActiveAction] = useState<'register' | 'transfer' | 'service' | null>(null);

  // Form inputs
  const [newOwner, setNewOwner] = useState('');
  const [serviceMileage, setServiceMileage] = useState('');
  const [serviceType, setServiceType] = useState('');

  const searchVehicle = async () => {
    setError(null);
    setVehicleData(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/vehicles/${registration}`);
      if (!response.ok) throw new Error('Vehicle not found');

      const result = await response.json();
      if (result.success && result.data) {
        setVehicleData(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const executeBlockchainAction = async (action: 'register' | 'transfer' | 'service') => {
    if (!activeAddress || !vehicleData) return;

    setActionStatus('idle');
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

      switch (action) {
        case 'register':
          const registerMethod = algosdk.ABIMethod.fromSignature("registerVehicle(string)string");
          appArgs = [
            registerMethod.getSelector(),
            algosdk.ABIType.from("string").encode(vehicleData.registration)
          ];
          break;

        case 'transfer':
          if (!newOwner) throw new Error('Please enter new owner address');
          const transferMethod = algosdk.ABIMethod.fromSignature("transferOwnership(string,string)string");
          appArgs = [
            transferMethod.getSelector(),
            algosdk.ABIType.from("string").encode(vehicleData.registration),
            algosdk.ABIType.from("string").encode(newOwner)
          ];
          break;

        case 'service':
          if (!serviceMileage || !serviceType) throw new Error('Please fill all service details');
          const serviceMethod = algosdk.ABIMethod.fromSignature("addServiceRecord(string,string)string");
          appArgs = [
            serviceMethod.getSelector(),
            algosdk.ABIType.from("string").encode(vehicleData.registration),
            algosdk.ABIType.from("string").encode(`${serviceType} at ${serviceMileage}km`)
          ];
          break;
      }

      const txn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: activeAddress,
        appIndex: APP_ID,
        appArgs: appArgs,
        suggestedParams: suggestedParams,
      });

      const txnB64 = algosdk.encodeUnsignedTransaction(txn);
      const signedTxns = await signTransactions([txnB64]);

      const response = await algodClient.sendRawTransaction(signedTxns[0]).do();
      const txId = response.txid;

      await algosdk.waitForConfirmation(algodClient, txId, 4);

      setActionStatus('success');
      setActionMessage(`✅ Action completed! (Tx: ${txId.substring(0, 8)}...)`);

      // Reset forms
      if (action === 'transfer') setNewOwner('');
      if (action === 'service') {
        setServiceMileage('');
        setServiceType('');
      }
      setActiveAction(null);
    } catch (error: any) {
      setActionStatus('error');
      setActionMessage(`Failed: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>Irish Vehicle Registry - Blockchain Manager V2</h1>

      {/* Search Section */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Search Vehicle</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Enter registration (e.g., 21G99999)"
            value={registration}
            onChange={(e) => setRegistration(e.target.value.toUpperCase())}
            style={{ flex: 1, padding: '10px', fontSize: '16px' }}
          />
          <button
            onClick={searchVehicle}
            disabled={!registration || loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>

      {/* Vehicle Details */}
      {vehicleData && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Vehicle Info */}
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
            <h3>Vehicle Details</h3>
            <p><strong>Registration:</strong> {vehicleData.registration}</p>
            <p><strong>Make/Model:</strong> {vehicleData.make} {vehicleData.model}</p>
            <p><strong>Year:</strong> {vehicleData.year}</p>
            <p><strong>VIN:</strong> {vehicleData.vin}</p>
            <p><strong>Color:</strong> {vehicleData.color || 'N/A'}</p>
            <p><strong>Fuel Type:</strong> {vehicleData.fuelType}</p>
          </div>

          {/* Blockchain Actions */}
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
            <h3>Blockchain Actions</h3>
            {!activeAddress ? (
              <p style={{ color: '#d32f2f' }}>⚠️ Connect wallet to use blockchain features</p>
            ) : (
              <>
                <p style={{ fontSize: '14px', color: '#666' }}>
                  Wallet: {activeAddress.slice(0, 6)}...{activeAddress.slice(-4)} | App ID: {APP_ID}
                </p>

                {/* Action Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
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
                      cursor: 'pointer',
                      gridColumn: 'span 2'
                    }}
                  >
                    Add Service Record
                  </button>
                </div>

                {/* Action Forms */}
                {activeAction && (
                  <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
                    {activeAction === 'register' && (
                      <div>
                        <h4>Register Vehicle</h4>
                        <p>This will record {vehicleData.registration} on the blockchain.</p>
                      </div>
                    )}

                    {activeAction === 'transfer' && (
                      <div>
                        <h4>Transfer Ownership</h4>
                        <input
                          type="text"
                          placeholder="New owner address"
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
                        </select>
                        <input
                          type="number"
                          placeholder="Mileage (km)"
                          value={serviceMileage}
                          onChange={(e) => setServiceMileage(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                    )}

                    <button
                      onClick={() => executeBlockchainAction(activeAction)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginTop: '10px'
                      }}
                    >
                      Execute {activeAction}
                    </button>
                  </div>
                )}

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
