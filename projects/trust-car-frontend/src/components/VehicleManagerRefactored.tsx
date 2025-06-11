// src/components/VehicleManager.tsx
import React, { useState } from 'react';
import { useVehicleSearch } from '../hooks/useVehicleSearch';
import { useBlockchainTransaction } from '../hooks/useBlockchainTransaction';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ErrorMessage } from './common/ErrorMessage';
import { SuccessMessage } from './common/SuccessMessage';
import { SERVICE_TYPES, TEST_VEHICLES } from '../constants';
import { BlockchainAction } from '../types/blockchain';
import { VehicleLogger } from '../utils/logger';

export const VehicleManager: React.FC = () => {
  const [registration, setRegistration] = useState('');
  const [activeAction, setActiveAction] = useState<BlockchainAction | null>(null);
  const [newOwner, setNewOwner] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [serviceMileage, setServiceMileage] = useState('');

  const { vehicleData, loading: searchLoading, error: searchError, searchVehicle } = useVehicleSearch();
  const {
    loading: txLoading,
    error: txError,
    result: txResult,
    registerVehicle,
    transferOwnership,
    addServiceRecord,
    isWalletConnected,
    walletAddress
  } = useBlockchainTransaction();

  const handleSearch = async () => {
    if (!registration.trim()) return;
    await searchVehicle(registration);
  };

  const handleExecuteAction = async () => {
    if (!vehicleData || !activeAction) return;

    let success = false;

    switch (activeAction) {
      case 'register':
        success = await registerVehicle(vehicleData.registration);
        break;

      case 'transfer':
        if (!newOwner.trim()) {
          VehicleLogger.error('Transfer failed', 'No new owner specified');
          return;
        }
        success = await transferOwnership(vehicleData.registration, newOwner);
        if (success) setNewOwner('');
        break;

      case 'service':
        if (!serviceType || !serviceMileage) {
          VehicleLogger.error('Service record failed', 'Missing service details');
          return;
        }
        const serviceDetails = `${serviceType} at ${serviceMileage}km`;
        success = await addServiceRecord(vehicleData.registration, serviceDetails);
        if (success) {
          setServiceType('');
          setServiceMileage('');
        }
        break;
    }

    if (success) {
      setActiveAction(null);
    }
  };

  return (
    <div className="vehicle-manager" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
        Irish Vehicle Registry - Blockchain Manager
      </h1>

      {/* Search Section */}
      <section style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2>Search Vehicle</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Enter registration (e.g., 21G99999)"
            value={registration}
            onChange={(e) => setRegistration(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            style={{
              flex: 1,
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
          <button
            onClick={handleSearch}
            disabled={!registration.trim() || searchLoading}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: !registration.trim() || searchLoading ? 'not-allowed' : 'pointer',
              opacity: !registration.trim() || searchLoading ? 0.6 : 1
            }}
          >
            {searchLoading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Test Vehicles */}
        <div style={{ fontSize: '12px', color: '#666' }}>
          <strong>Test vehicles:</strong> {TEST_VEHICLES.map((v, i) => (
            <span key={v.registration}>
              <button
                onClick={() => setRegistration(v.registration)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1976d2',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                {v.registration}
              </button>
              {` (${v.description})`}
              {i < TEST_VEHICLES.length - 1 && ', '}
            </span>
          ))}
        </div>

        {searchError && <ErrorMessage message={searchError} />}
      </section>

      {/* Loading State */}
      {searchLoading && <LoadingSpinner message="Searching for vehicle..." />}

      {/* Vehicle Details & Actions */}
      {vehicleData && !searchLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Vehicle Info Card */}
          <section style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3>Vehicle Details</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  { label: 'Registration', value: vehicleData.registration },
                  { label: 'VIN', value: vehicleData.vin },
                  { label: 'Make/Model', value: `${vehicleData.make} ${vehicleData.model}` },
                  { label: 'Year', value: vehicleData.year },
                  { label: 'Color', value: vehicleData.color || 'N/A' },
                  { label: 'Fuel Type', value: vehicleData.fuelType },
                  { label: 'Engine Size', value: vehicleData.engineSize },
                ].map(({ label, value }) => (
                  <tr key={label} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{label}:</td>
                    <td style={{ padding: '10px' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Blockchain Actions Card */}
          <section style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3>Blockchain Actions</h3>

            {!isWalletConnected ? (
              <ErrorMessage message="Please connect your wallet to perform blockchain actions" />
            ) : (
              <>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                  Wallet: {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                </p>

                {/* Action Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                  {(['register', 'transfer', 'service'] as const).map((action) => (
                    <button
                      key={action}
                      onClick={() => setActiveAction(action)}
                      disabled={txLoading}
                      style={{
                        padding: '10px',
                        backgroundColor: activeAction === action ? '#1976d2' : '#e0e0e0',
                        color: activeAction === action ? 'white' : 'black',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: txLoading ? 'not-allowed' : 'pointer',
                        textTransform: 'capitalize',
                        ...(action === 'service' && { gridColumn: 'span 2' })
                      }}
                    >
                      {action === 'register' && 'Register Vehicle'}
                      {action === 'transfer' && 'Transfer Ownership'}
                      {action === 'service' && 'Add Service Record'}
                    </button>
                  ))}
                </div>

                {/* Action Forms */}
                {activeAction && !txLoading && (
                  <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
                    {activeAction === 'register' && (
                      <div>
                        <h4>Register Vehicle</h4>
                        <p>This will permanently record {vehicleData.registration} on the Algorand blockchain.</p>
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
                          {SERVICE_TYPES.map(type => (
                            <option key={type.value} value={type.label}>
                              {type.label}
                            </option>
                          ))}
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
                      onClick={handleExecuteAction}
                      disabled={txLoading}
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

                {/* Loading State */}
                {txLoading && <LoadingSpinner size="small" message="Processing transaction..." />}

                {/* Transaction Results */}
                {txError && <ErrorMessage message={txError} />}
                {txResult && <SuccessMessage message="Transaction successful!" txId={txResult.txId} />}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
