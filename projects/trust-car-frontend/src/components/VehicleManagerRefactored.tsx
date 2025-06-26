// src/components/VehicleManagerRefactored.tsx
import React, { useState } from 'react';
import { useVehicleSearch } from '../hooks/useVehicleSearch';
import { useSimpleBlockchain as useBlockchainTransaction } from '../hooks/useSimpleBlockchain';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ErrorMessage } from './common/ErrorMessage';
import { SuccessMessage } from './common/SuccessMessage';
import { VehicleHistory } from './VehicleHistoryNew';
import { TransactionHistory } from './TransactionHistory';
import ConnectWallet from './ConnectWallet';
import { AVAILABLE_VEHICLES, SERVICE_TYPES, VEHICLE_CONDITIONS } from '../constants';
import { BlockchainAction } from '../types/blockchain';
import { VehicleLogger } from '../utils/logger';
import trustCarLogo from '../assets/trustcar-logo.svg';

export const VehicleManager: React.FC = () => {
  const [registration, setRegistration] = useState('');
  const [activeAction, setActiveAction] = useState<BlockchainAction | null>(null);
  const [newOwner, setNewOwner] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [serviceMileage, setServiceMileage] = useState('');
  const [serviceCondition, setServiceCondition] = useState('');
  const [showServiceMode, setShowServiceMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [openWalletModal, setOpenWalletModal] = useState(false);

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
          return; // The validation error will be handled by the blockchain hook
        }
        success = await transferOwnership(vehicleData.registration, newOwner);
        if (success) setNewOwner('');
        break;
    }

    if (success) {
      setActiveAction(null);
    }
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .fade-in {
          animation: fadeIn 0.6s ease-out;
        }
        .slide-in {
          animation: slideIn 0.4s ease-out;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .gradient-bg {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        .btn-modern {
          background: linear-gradient(145deg, #4CAF50, #45a049);
          border: none;
          color: white;
          padding: 12px 24px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
        }
        .btn-modern:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
        }
        .btn-modern:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
        }
        .btn-action {
          background: linear-gradient(145deg, #2196F3, #1976D2);
          border: none;
          color: white;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        .btn-action:hover {
          background: linear-gradient(145deg, #1976D2, #1565C0);
          transform: scale(1.02);
        }
        .btn-action:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .btn-action.active {
          background: linear-gradient(145deg, #FF9800, #F57C00);
          box-shadow: 0 4px 15px rgba(255, 152, 0, 0.3);
        }
        .input-modern {
          padding: 15px;
          font-size: 16px;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          outline: none;
          transition: border-color 0.3s ease;
          background: rgba(255, 255, 255, 0.9);
        }
        .input-modern:focus {
          border-color: #2196F3;
          box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
        }
        @media (max-width: 768px) {
          .grid-responsive {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div className="gradient-bg" style={{ padding: '20px', minHeight: '100vh' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div className="fade-in" style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ marginBottom: '15px' }}>
              <img
                src={trustCarLogo}
                alt="TrustCar Logo"
                style={{
                  height: '80px',
                  maxWidth: '400px',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                }}
              />
            </div>
            <p style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: '1.2rem',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}>
              Blockchain-Powered Vehicle Management System
            </p>
          </div>

          {/* Wallet Status */}
          {!isWalletConnected ? (
            <div className="glass-card slide-in" style={{
              textAlign: 'center',
              marginBottom: '30px',
              padding: '20px',
              borderRadius: '16px'
            }}>
              <div style={{ marginBottom: '15px' }}>
                <span style={{ fontSize: '2rem', marginRight: '10px' }}>🔗</span>
                <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#333' }}>
                  Connect your TestNet wallet to get started
                </span>
              </div>
              <button
                className="btn-modern"
                onClick={() => setOpenWalletModal(true)}
              >
                Connect Wallet
              </button>
            </div>
          ) : (
            <div className="glass-card slide-in" style={{
              textAlign: 'center',
              marginBottom: '30px',
              padding: '15px',
              borderRadius: '16px',
              border: '2px solid #4CAF50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>✅</span>
                <span style={{ fontWeight: '600', color: '#2e7d32' }}>
                  Wallet Connected: {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-6)}
                </span>
              </div>
              <button
                onClick={() => setOpenWalletModal(true)}
                style={{
                  background: 'linear-gradient(145deg, #f44336, #d32f2f)',
                  border: 'none',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  const target = e.target as HTMLButtonElement;
                  target.style.background = 'linear-gradient(145deg, #d32f2f, #c62828)';
                  target.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  const target = e.target as HTMLButtonElement;
                  target.style.background = 'linear-gradient(145deg, #f44336, #d32f2f)';
                  target.style.transform = 'scale(1)';
                }}
              >
                🔄 Change Wallet
              </button>
            </div>
          )}

          {/* Search Section */}
          <div className="glass-card fade-in" style={{
            padding: '30px',
            borderRadius: '20px',
            marginBottom: '30px'
          }}>
            <h2 style={{
              fontSize: '1.8rem',
              marginBottom: '20px',
              color: '#333',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              🔍 Search Vehicle
            </h2>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center', justifyContent: 'center' }}>
              {/* European Style Irish License Plate Styled Search Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#ffffff',
                border: '3px solid #000000',
                borderRadius: '8px',
                padding: '0',
                fontFamily: 'monospace, "Courier New"',
                fontWeight: 'bold',
                fontSize: '20px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2), inset 0 2px 4px rgba(0,0,0,0.1)',
                height: '60px',
                minWidth: '280px',
                maxWidth: '320px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {/* EU Stars Strip */}
                <div style={{
                  backgroundColor: '#003f7f',
                  color: '#ffcc00',
                  width: '45px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  borderRight: '2px solid #000000'
                }}>
                  <div style={{ marginBottom: '2px' }}>★</div>
                  <div style={{ fontSize: '8px', letterSpacing: '0.5px' }}>IRL</div>
                  <div style={{ marginTop: '2px' }}>★</div>
                </div>

                {/* License Plate Input */}
                <input
                  type="text"
                  placeholder="21G99999"
                  value={registration}
                  onChange={(e) => setRegistration(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    color: '#000000',
                    fontSize: '20px',
                    fontFamily: 'monospace, "Courier New"',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    letterSpacing: '2px',
                    padding: '0 15px',
                    height: '100%'
                  }}
                  maxLength={8}
                />
              </div>

              <button
                className="btn-modern"
                onClick={handleSearch}
                disabled={!registration.trim() || searchLoading}
                style={{
                  height: '60px',
                  padding: '0 25px',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                {searchLoading ? '🔍 Searching...' : '🔍 Search'}
              </button>
            </div>

            {/* Plate Helper Text */}
            <div style={{
              textAlign: 'center',
              marginBottom: '15px',
              fontSize: '12px',
              color: '#666',
              fontStyle: 'italic'
            }}>
              📋 Enter Irish registration number (e.g., 21G99999, 12D12345)
            </div>

            {/* Vehicle Selection Dropdown */}
            <div style={{
              padding: '15px',
              backgroundColor: 'rgba(0,0,0,0.05)',
              borderRadius: '10px',
              fontSize: '14px'
            }}>
              <strong style={{ color: '#666', display: 'block', marginBottom: '10px' }}>
                Select from available vehicles ({AVAILABLE_VEHICLES.length} total):
              </strong>
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    setRegistration(e.target.value);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#2196F3';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#ddd';
                }}
              >
                <option value="" disabled>-- Choose a vehicle to lookup --</option>
                {AVAILABLE_VEHICLES.map((vehicle) => (
                  <option key={vehicle.registration} value={vehicle.registration}>
                    {vehicle.registration} - {vehicle.description}
                  </option>
                ))}
              </select>
              <div style={{
                marginTop: '8px',
                fontSize: '12px',
                color: '#888',
                fontStyle: 'italic'
              }}>
                💡 These are demo vehicles available in the test API
              </div>
            </div>

            {searchError && <ErrorMessage message={searchError} />}
          </div>

          {/* Loading State */}
          {searchLoading && <LoadingSpinner message="Searching for vehicle..." />}

          {/* Vehicle Details & Actions */}
          {vehicleData && !searchLoading && (
            <>
              {/* Tab Navigation */}
              <div className="fade-in" style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '30px'
              }}>
                <button
                  className={`btn-action ${!showHistory ? 'active' : ''}`}
                  onClick={() => setShowHistory(false)}
                >
                  📄 Vehicle Details
                </button>
                <button
                  className={`btn-action ${showHistory ? 'active' : ''}`}
                  onClick={() => setShowHistory(true)}
                >
                  📜 Transaction History
                </button>
              </div>

              {!showHistory ? (
                <div className="fade-in grid-responsive" style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '30px'
                }}>
                  {/* Vehicle Info Card */}
                  <div className="glass-card" style={{
                    padding: '30px',
                    borderRadius: '20px'
                  }}>
                    <h3 style={{
                      fontSize: '1.6rem',
                      marginBottom: '25px',
                      color: '#333',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      🚗 Vehicle Details
                    </h3>

                    {/* European Style License Plate Display */}
                    <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        backgroundColor: '#ffffff',
                        border: '3px solid #000000',
                        borderRadius: '8px',
                        padding: '0',
                        fontFamily: 'monospace, "Courier New"',
                        fontWeight: 'bold',
                        fontSize: '18px',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.2), inset 0 2px 4px rgba(0,0,0,0.1)',
                        height: '50px',
                        minWidth: '240px',
                        overflow: 'hidden'
                      }}>
                        {/* EU Stars Strip */}
                        <div style={{
                          backgroundColor: '#003f7f',
                          color: '#ffcc00',
                          width: '35px',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '8px',
                          fontWeight: 'bold',
                          borderRight: '2px solid #000000'
                        }}>
                          <div style={{ marginBottom: '1px' }}>★</div>
                          <div style={{ fontSize: '6px', letterSpacing: '0.5px' }}>IRL</div>
                          <div style={{ marginTop: '1px' }}>★</div>
                        </div>

                        {/* Registration Number */}
                        <div style={{
                          flex: 1,
                          color: '#000000',
                          fontSize: '18px',
                          fontFamily: 'monospace, "Courier New"',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          letterSpacing: '1.5px',
                          padding: '0 15px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {vehicleData.registration}
                        </div>
                      </div>
                    </div>

                    {/* Vehicle Image */}
                    {vehicleData.imageUrl && (
                      <div style={{
                        marginBottom: '30px',
                        textAlign: 'center',
                        borderRadius: '15px',
                        overflow: 'hidden',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                        backgroundColor: '#f5f5f5'
                      }}>
                        <img
                          src={vehicleData.imageUrl}
                          alt={`${vehicleData.make} ${vehicleData.model} (${vehicleData.year})`}
                          style={{
                            width: '100%',
                            maxWidth: '400px',
                            height: '250px',
                            objectFit: 'cover',
                            borderRadius: '12px',
                            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 12px 25px rgba(0,0,0,0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          onError={(e) => {
                            // Show fallback if image fails to load
                            const target = e.currentTarget;
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDQwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0yMDAgMTI1SDE2MFYxNjVIMjAwVjEyNVoiIGZpbGw9IiNEREREREQiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwIDMwSDEwVjEwSDMwVjMwSDIwWiIgZmlsbD0iI0RERERERCIvPgo8L3N2Zz4K';
                            target.alt = 'Vehicle image not available';
                          }}
                          onClick={() => {
                            // Open full size image in new tab
                            window.open(vehicleData.imageUrl, '_blank');
                          }}
                        />
                        <div style={{
                          marginTop: '10px',
                          fontSize: '12px',
                          color: '#666',
                          fontStyle: 'italic'
                        }}>
                          📷 {vehicleData.make} {vehicleData.model} ({vehicleData.year}) • Click to view full size
                        </div>
                      </div>
                    )}

                    {/* Vehicle Info Table */}
                    <div style={{ display: 'grid', gap: '15px' }}>
                      {[
                        { label: 'VIN', value: vehicleData.vin, icon: '🔢' },
                        { label: 'Make/Model', value: `${vehicleData.make} ${vehicleData.model}`, icon: '🏭' },
                        { label: 'Year', value: vehicleData.year, icon: '📅' },
                        { label: 'Color', value: vehicleData.color || 'N/A', icon: '🎨' },
                        { label: 'Fuel Type', value: vehicleData.fuelType, icon: '⚡' },
                        { label: 'Engine Size', value: vehicleData.engineSize, icon: '🔧' },
                      ].map(({ label, value, icon }) => (
                        <div key={label} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px',
                          backgroundColor: 'rgba(0,0,0,0.03)',
                          borderRadius: '8px',
                          border: '1px solid rgba(0,0,0,0.1)'
                        }}>
                          <span style={{ fontWeight: '600', color: '#555' }}>
                            {icon} {label}:
                          </span>
                          <span style={{ color: '#333' }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Blockchain Actions Card */}
                  <div className="glass-card" style={{
                    padding: '30px',
                    borderRadius: '20px'
                  }}>
                    <h3 style={{
                      fontSize: '1.6rem',
                      marginBottom: '25px',
                      color: '#333',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      ⛓️ Blockchain Actions
                    </h3>

                    {!isWalletConnected ? (
                      <ErrorMessage message="Please connect your wallet to perform blockchain actions" />
                    ) : (
                      <>
                        <div style={{
                          padding: '15px',
                          backgroundColor: 'rgba(33, 150, 243, 0.1)',
                          borderRadius: '10px',
                          marginBottom: '25px',
                          border: '1px solid rgba(33, 150, 243, 0.2)'
                        }}>
                          <p style={{ margin: 0, color: '#1976D2', fontWeight: '600' }}>
                            🔗 Wallet: {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                          </p>
                        </div>

                        {/* Mode Toggle */}
                        <div style={{
                          display: 'flex',
                          backgroundColor: 'rgba(0,0,0,0.05)',
                          borderRadius: '12px',
                          padding: '4px',
                          marginBottom: '20px'
                        }}>
                          <button
                            onClick={() => {
                              setShowServiceMode(false);
                              setActiveAction(null);
                              setServiceType('');
                              setServiceMileage('');
                              setServiceCondition('');
                            }}
                            style={{
                              flex: 1,
                              padding: '12px',
                              border: 'none',
                              borderRadius: '8px',
                              backgroundColor: !showServiceMode ? '#4CAF50' : 'transparent',
                              color: !showServiceMode ? 'white' : '#666',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            🔍 Vehicle Owner
                          </button>
                          <button
                            onClick={() => {
                              setShowServiceMode(true);
                              setActiveAction(null);
                              setNewOwner('');
                            }}
                            style={{
                              flex: 1,
                              padding: '12px',
                              border: 'none',
                              borderRadius: '8px',
                              backgroundColor: showServiceMode ? '#2196F3' : 'transparent',
                              color: showServiceMode ? 'white' : '#666',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            🔧 Service Provider
                          </button>
                        </div>

                        {!showServiceMode ? (
                          <>
                            {/* Action Buttons */}
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '12px',
                              marginBottom: '25px'
                            }}>
                              {[
                                { action: 'register' as const, label: 'Register Vehicle', icon: '📝' },
                                { action: 'transfer' as const, label: 'Transfer Ownership', icon: '🔄' },
                              ].map(({ action, label, icon }) => (
                                <button
                                  key={action}
                                  className={`btn-action ${activeAction === action ? 'active' : ''}`}
                                  onClick={() => setActiveAction(action)}
                                  disabled={txLoading}
                                  style={{
                                    padding: '12px',
                                    fontSize: '14px',
                                    fontWeight: '600'
                                  }}
                                >
                                  {icon} {label}
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Service Provider Mode */}
                            <div style={{
                              backgroundColor: 'rgba(33, 150, 243, 0.1)',
                              padding: '20px',
                              borderRadius: '12px',
                              marginBottom: '20px',
                              border: '1px solid rgba(33, 150, 243, 0.2)'
                            }}>
                              <h4 style={{ color: '#2196F3', marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                                🔧 Add Service Record
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
                                    fontSize: '14px',
                                    marginBottom: '12px'
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

                              <button
                                className="btn-modern"
                                onClick={async () => {
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
                                  }
                                }}
                                disabled={txLoading || !serviceType || !serviceMileage || ((serviceType === 'General Maintenance' || serviceType === 'Major Service') && !serviceCondition)}
                                style={{
                                  width: '100%',
                                  backgroundColor: '#2196F3'
                                }}
                              >
                                {txLoading ? 'Processing...' : 'Add Service Record'}
                              </button>
                            </div>
                          </>
                        )}

                        {/* Action Forms for Vehicle Owner Mode */}
                        {!showServiceMode && activeAction && !txLoading && (
                          <div style={{
                            backgroundColor: 'rgba(0,0,0,0.05)',
                            padding: '20px',
                            borderRadius: '12px',
                            marginBottom: '20px',
                            border: '1px solid rgba(0,0,0,0.1)'
                          }}>
                            {activeAction === 'register' && (
                              <div>
                                <h4 style={{ color: '#333', marginBottom: '10px' }}>
                                  📝 Register Vehicle
                                </h4>
                                <p style={{ color: '#666', fontSize: '14px' }}>
                                  This will permanently record {vehicleData.registration} on the Algorand blockchain.
                                </p>
                              </div>
                            )}

                            {activeAction === 'transfer' && (
                              <div>
                                <h4 style={{ color: '#333', marginBottom: '15px' }}>
                                  🔄 Transfer Ownership
                                </h4>
                                <input
                                  type="text"
                                  placeholder="New owner address (e.g., KHXEW77SJC...)"
                                  value={newOwner}
                                  onChange={(e) => setNewOwner(e.target.value)}
                                  className="input-modern"
                                  style={{
                                    width: '100%',
                                    marginBottom: '10px',
                                    padding: '12px',
                                    fontSize: '14px'
                                  }}
                                />
                              </div>
                            )}

                            <button
                              className="btn-modern"
                              onClick={handleExecuteAction}
                              disabled={txLoading}
                              style={{
                                width: '100%',
                                marginTop: '15px',
                                fontSize: '16px'
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
                  </div>
                </div>
              ) : (
                <div className="fade-in">
                  <div className="glass-card" style={{
                    padding: '30px',
                    borderRadius: '20px'
                  }}>
                    <VehicleHistory
                      registration={vehicleData.registration}
                      isVisible={showHistory}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Transaction History */}
          {isWalletConnected && (
            <div className="slide-in" style={{ marginTop: '30px' }}>
              <TransactionHistory />
            </div>
          )}

          {/* Wallet Connection Modal */}
          <ConnectWallet
            openModal={openWalletModal}
            closeModal={() => setOpenWalletModal(false)}
          />
        </div>
      </div>
    </>
  );
};
