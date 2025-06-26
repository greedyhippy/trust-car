// src/components/ServiceRecordManager.tsx
import React, { useState } from 'react';
import { useSimpleBlockchain } from '../hooks/useSimpleBlockchain';
import { useVehicleSearch } from '../hooks/useVehicleSearch';
import { useWallet } from '@txnlab/use-wallet-react';
import ConnectWallet from './ConnectWallet';
import { ErrorMessage } from './common/ErrorMessage';
import { LoadingSpinner } from './common/LoadingSpinner';
import { SERVICE_TYPES, AVAILABLE_VEHICLES, VEHICLE_CONDITIONS } from '../constants';
import trustCarLogo from '../assets/trustcar-logo.svg';

export const ServiceRecordManager: React.FC = () => {
  const [registration, setRegistration] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [serviceMileage, setServiceMileage] = useState('');
  const [serviceCondition, setServiceCondition] = useState('');
  const [openWalletModal, setOpenWalletModal] = useState(false);

  const { vehicleData, loading: searchLoading, error: searchError, searchVehicle } = useVehicleSearch();
  const {
    loading: txLoading,
    error: txError,
    result: txResult,
    addServiceRecord,
    clearState,
    isWalletConnected,
    walletAddress
  } = useSimpleBlockchain();

  const { activeAddress } = useWallet();

  const handleVehicleSearch = async () => {
    if (!registration.trim()) return;
    await searchVehicle(registration);
  };

  const handleAddServiceRecord = async () => {
    if (!vehicleData || !serviceType || !serviceMileage) return;

    // Check if this service type requires condition input
    const requiresCondition = serviceType === 'General Maintenance' || serviceType === 'Major Service';
    if (requiresCondition && !serviceCondition.trim()) {
      return;
    }

    // Build service details with condition if applicable
    let serviceDetails = `${serviceType} at ${serviceMileage}km`;
    if (requiresCondition && serviceCondition.trim()) {
      serviceDetails += ` - Condition: ${serviceCondition.trim()}`;
    }

    const success = await addServiceRecord(vehicleData.registration, serviceDetails);
    if (success) {
      setServiceType('');
      setServiceMileage('');
      setServiceCondition('');
      // Keep the vehicle data so they can add multiple records
    }
  };

  const handleClearAll = () => {
    setRegistration('');
    setServiceType('');
    setServiceMileage('');
    setServiceCondition('');
    clearState();
  };

  const handleSelectVehicle = (selectedRegistration: string) => {
    setRegistration(selectedRegistration);
    searchVehicle(selectedRegistration);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '30px',
        color: 'white'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          <img
            src={trustCarLogo}
            alt="TrustCar"
            style={{
              height: '40px',
              marginRight: '15px'
            }}
          />
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            margin: 0,
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            Service Record Manager
          </h1>
        </div>
        <p style={{
          fontSize: '1.1rem',
          opacity: 0.9,
          margin: 0
        }}>
          Add maintenance and service records to the blockchain
        </p>
      </div>

      {/* Wallet Connection */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '30px'
      }}>
        {!isWalletConnected ? (
          <ConnectWallet
            openModal={openWalletModal}
            closeModal={() => setOpenWalletModal(false)}
          />
        ) : (
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '15px 25px',
            color: 'white',
            fontSize: '14px'
          }}>
            ✅ Connected: {activeAddress?.slice(0, 6)}...{activeAddress?.slice(-4)}
          </div>
        )}
      </div>

      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        display: 'grid',
        gap: '20px',
        gridTemplateColumns: vehicleData ? '1fr 1fr' : '1fr'
      }}>
        {/* Vehicle Search Section */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '25px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            margin: '0 0 20px 0',
            color: '#333',
            fontSize: '1.5rem',
            display: 'flex',
            alignItems: 'center'
          }}>
            🔍 Find Vehicle
          </h2>

          {/* Manual Registration Input */}
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Enter registration (e.g., 21G99999)"
              value={registration}
              onChange={(e) => setRegistration(e.target.value.toUpperCase())}
              className="input-modern"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                marginBottom: '10px'
              }}
            />
            <button
              onClick={handleVehicleSearch}
              disabled={!registration.trim() || searchLoading}
              className="btn-modern"
              style={{
                width: '100%',
                backgroundColor: '#4CAF50',
                opacity: (!registration.trim() || searchLoading) ? 0.6 : 1
              }}
            >
              {searchLoading ? <LoadingSpinner size="small" /> : 'Search Vehicle'}
            </button>
          </div>

          {/* Vehicle Selection Dropdown */}
          <div style={{
            borderTop: '1px solid #eee',
            paddingTop: '20px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#666' }}>
              Select from available vehicles ({AVAILABLE_VEHICLES.length} total):
            </h4>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleSelectVehicle(e.target.value);
                }
              }}
              className="input-modern"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px'
              }}
            >
              <option value="">Choose a test vehicle...</option>
              {AVAILABLE_VEHICLES.map(vehicle => (
                <option key={vehicle.registration} value={vehicle.registration}>
                  {vehicle.registration} - {vehicle.description}
                </option>
              ))}
            </select>
          </div>

          {searchError && <ErrorMessage message={searchError} />}
        </div>

        {/* Service Record Form */}
        {vehicleData && (
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '25px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              margin: '0 0 20px 0',
              color: '#333',
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center'
            }}>
              🔧 Add Service Record
            </h2>

            {/* Vehicle Info */}
            <div style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>
                {vehicleData.make} {vehicleData.model} ({vehicleData.year})
              </h3>
              <p style={{ margin: 0, color: '#666' }}>
                Registration: <strong>{vehicleData.registration}</strong>
              </p>
            </div>

            {/* Service Form */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>
                Service Type
              </h4>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="input-modern"
                style={{
                  width: '100%',
                  marginBottom: '12px',
                  padding: '12px',
                  fontSize: '14px'
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
                className="input-modern"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  marginBottom: '12px'
                }}
              />

              {/* Condition dropdown for General Maintenance and Major Service */}
              {(serviceType === 'General Maintenance' || serviceType === 'Major Service') && (
                <select
                  value={serviceCondition}
                  onChange={(e) => setServiceCondition(e.target.value)}
                  className="input-modern"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select vehicle condition</option>
                  {VEHICLE_CONDITIONS.map(condition => (
                    <option key={condition.value} value={condition.label}>
                      {condition.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Action Buttons */}
            <button
              className="btn-modern"
              onClick={handleAddServiceRecord}
              disabled={!isWalletConnected || txLoading || !serviceType || !serviceMileage}
              style={{
                width: '100%',
                marginBottom: '10px',
                backgroundColor: '#2196F3',
                opacity: (!isWalletConnected || txLoading || !serviceType || !serviceMileage) ? 0.6 : 1
              }}
            >
              {txLoading ? <LoadingSpinner size="small" /> : 'Add Service Record'}
            </button>

            <button
              onClick={handleClearAll}
              className="btn-modern"
              style={{
                width: '100%',
                backgroundColor: '#6c757d'
              }}
            >
              Clear All
            </button>

            {txError && <ErrorMessage message={txError} />}
            {txResult && (
              <div style={{
                marginTop: '15px',
                padding: '15px',
                backgroundColor: '#d4edda',
                border: '1px solid #c3e6cb',
                borderRadius: '8px',
                color: '#155724'
              }}>
                <strong>✅ Success!</strong>
                <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
                  {txResult.message}
                </p>
                <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>
                  Transaction ID: {txResult.txId}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {!isWalletConnected && (
        <div style={{
          maxWidth: '600px',
          margin: '30px auto 0',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '25px',
          textAlign: 'center',
          color: '#333'
        }}>
          <h3>🔒 Wallet Connection Required</h3>
          <p>Connect your wallet to add service records to the blockchain.</p>
          <button
            onClick={() => setOpenWalletModal(true)}
            className="btn-modern"
            style={{
              backgroundColor: '#FF9800',
              color: 'white',
              padding: '12px 24px'
            }}
          >
            Connect Wallet
          </button>
        </div>
      )}
    </div>
  );
};
