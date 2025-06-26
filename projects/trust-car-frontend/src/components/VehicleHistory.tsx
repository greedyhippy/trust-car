// src/components/VehicleHistory.tsx - Enhanced Version with TransactionMonitor Integration
import React, { useEffect, useState } from 'react';
import { TransactionMonitor, TransactionInfo } from '../utils/transactionMonitor';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ErrorMessage } from './common/ErrorMessage';

interface VehicleHistoryProps {
  registration: string;
  isVisible: boolean;
}

// Convert TransactionInfo to our VehicleHistoryEvent format
interface VehicleHistoryEvent {
  id: string;
  type: 'register' | 'transfer' | 'service' | 'unknown';
  timestamp: Date;
  txId: string;
  details: {
    registration?: string;
    method?: string;
  };
}

interface VehicleHistoryProps {
  registration: string;
  isVisible: boolean;
}

const EventIcon: React.FC<{ type: VehicleHistoryEvent['type'] }> = ({ type }) => {
  const getIconStyle = () => {
    const baseStyle = {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: 'bold',
      color: 'white',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
    };

    switch (type) {
      case 'register':
        return { ...baseStyle, background: 'linear-gradient(145deg, #4CAF50, #45a049)' };
      case 'transfer':
        return { ...baseStyle, background: 'linear-gradient(145deg, #2196F3, #1976D2)' };
      case 'service':
        return { ...baseStyle, background: 'linear-gradient(145deg, #FF9800, #F57C00)' };
      default:
        return { ...baseStyle, background: 'linear-gradient(145deg, #9E9E9E, #757575)' };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'register': return '📝';
      case 'transfer': return '🔄';
      case 'service': return '🔧';
      default: return '❓';
    }
  };

  return <div style={getIconStyle()}>{getIcon()}</div>;
};

const EventDetails: React.FC<{ event: VehicleHistoryEvent }> = ({ event }) => {
  const getEventDescription = () => {
    switch (event.type) {
      case 'register':
        return `Vehicle ${event.details.registration} was registered on the blockchain`;

      case 'transfer':
        return (
          <div>
            <div style={{ fontWeight: '600', color: '#333' }}>Ownership transferred</div>
            {event.details.fromOwner && (
              <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                <span style={{ fontWeight: '500' }}>From:</span> {event.details.fromOwner.slice(0, 8)}...{event.details.fromOwner.slice(-4)}
              </div>
            )}
            {event.details.toOwner && (
              <div style={{ fontSize: '13px', color: '#666' }}>
                <span style={{ fontWeight: '500' }}>To:</span> {event.details.toOwner.slice(0, 8)}...{event.details.toOwner.slice(-4)}
              </div>
            )}
          </div>
        );

      case 'service':
        return (
          <div>
            <div style={{ fontWeight: '600', color: '#333' }}>Service Record Added</div>
            <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
              {event.details.serviceType}
            </div>
          </div>
        );

      default:
        return 'Unknown event';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTestNetUrl = (txId: string) => {
    // Use the correct AlgoKit explorer URL that was working before
    return `https://lora.algokit.io/testnet/transaction/${txId}`;
  };

  return (
    <div style={{
      padding: '16px',
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px)',
      borderRadius: '12px',
      marginBottom: '12px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
    }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px'
      }}>
        <EventIcon type={event.type} />

        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: '8px' }}>
            {getEventDescription()}
          </div>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            fontSize: '12px',
            color: '#666'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>📅</span>
              <span>{formatDate(event.timestamp)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>🔗</span>
              <span>Round {event.round}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {!event.txId.startsWith('MOCK') ? (
                <a
                  href={getTestNetUrl(event.txId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#2196F3',
                    textDecoration: 'none',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';
                    e.target.style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.textDecoration = 'none';
                  }}
                >
                  <span>🔍</span>
                  <span>{event.txId.slice(0, 8)}...</span>
                </a>
              ) : (
                <span
                  title={event.txId}
                  style={{ cursor: 'help', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>📋</span>
                  <span>{event.txId.slice(0, 8)}...</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HistoryStats: React.FC<{ events: VehicleHistoryEvent[] }> = ({ events }) => {
  const stats = {
    total: events.length,
    registrations: events.filter(e => e.type === 'register').length,
    transfers: events.filter(e => e.type === 'transfer').length,
    services: events.filter(e => e.type === 'service').length
  };

  const statItems = [
    { label: 'Total Events', value: stats.total, color: '#667eea', icon: '📊' },
    { label: 'Registrations', value: stats.registrations, color: '#4CAF50', icon: '📝' },
    { label: 'Transfers', value: stats.transfers, color: '#2196F3', icon: '🔄' },
    { label: 'Services', value: stats.services, color: '#FF9800', icon: '🔧' }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: '12px',
      marginBottom: '24px'
    }}>
      {statItems.map(({ label, value, color, icon }) => (
        <div
          key={label}
          style={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            padding: '16px',
            borderRadius: '12px',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '4px' }}>{icon}</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color, marginBottom: '4px' }}>
            {value}
          </div>
          <div style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>{label}</div>
        </div>
      ))}
    </div>
  );
};

export const VehicleHistory: React.FC<VehicleHistoryProps> = ({
  registration,
  isVisible
}) => {
  const {
    events,
    loading,
    error,
    lastFetched,
    fetchVehicleHistory,
    clearHistory,
    isConnected
  } = useVehicleHistory();

  useEffect(() => {
    if (isVisible && registration && isConnected) {
      // Only fetch once when the component becomes visible
      fetchVehicleHistory(registration);
    }
    // Don't clear history when not visible to prevent unnecessary re-fetching
  }, [isVisible, registration, isConnected]); // Removed fetchVehicleHistory and clearHistory from dependencies

  if (!isVisible) {
    return null;
  }

  if (!isConnected) {
    return (
      <div style={{ textAlign: 'center' }}>
        <h3 style={{
          fontSize: '1.6rem',
          marginBottom: '20px',
          color: '#333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        }}>
          📜 Transaction History
        </h3>
        <ErrorMessage message="Please connect your wallet to view transaction history" />
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '1.6rem',
          color: '#333',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          📜 Transaction History
        </h3>

        <button
          onClick={() => fetchVehicleHistory(registration)}
          disabled={loading}
          style={{
            background: loading
              ? 'linear-gradient(145deg, #ccc, #999)'
              : 'linear-gradient(145deg, #2196F3, #1976D2)',
            border: 'none',
            color: 'white',
            padding: '10px 16px',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }
          }}
        >
          <span style={{
            animation: loading ? 'spin 1s linear infinite' : 'none',
            display: 'inline-block'
          }}>
            {loading ? '⟳' : '🔄'}
          </span>
          Refresh
        </button>
      </div>

      {loading && <LoadingSpinner message="Loading transaction history..." />}

      {error && <ErrorMessage message={error} />}

      {!loading && !error && events.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.7 }}>📋</div>
          <div style={{ fontSize: '18px', marginBottom: '8px', color: '#333', fontWeight: '600' }}>
            No History Found
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            No blockchain transactions found for {registration}
          </div>
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <>
          <HistoryStats events={events} />

          {/* Show network notice */}
          {events.some(e => e.txId.startsWith('MOCK')) ? (
            <div style={{
              background: 'rgba(255, 243, 205, 0.9)',
              backdropFilter: 'blur(10px)',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '20px',
              border: '1px solid rgba(255, 234, 167, 0.8)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '24px' }}>⚠️</span>
              <div>
                <strong style={{ color: '#B45309' }}>Development Mode:</strong>
                <span style={{ color: '#92400E', marginLeft: '8px' }}>
                  Showing mock transaction data for localnet. Deploy to TestNet to see real blockchain history.
                </span>
              </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(219, 234, 254, 0.9)',
              backdropFilter: 'blur(10px)',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '20px',
              border: '1px solid rgba(147, 197, 253, 0.8)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '24px' }}>🌐</span>
              <div>
                <strong style={{ color: '#1E40AF' }}>TestNet Mode:</strong>
                <span style={{ color: '#1D4ED8', marginLeft: '8px' }}>
                  Showing live TestNet transactions. Click transaction IDs to view on AlgoExplorer.
                </span>
              </div>
            </div>
          )}

          <div style={{
            maxHeight: '500px',
            overflowY: 'auto',
            padding: '4px'
          }}>
            {events.map((event) => (
              <EventDetails key={event.id} event={event} />
            ))}
          </div>

          {lastFetched && (
            <div style={{
              textAlign: 'center',
              fontSize: '12px',
              color: '#999',
              marginTop: '16px',
              fontStyle: 'italic'
            }}>
              Last updated: {lastFetched.toLocaleTimeString()}
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
