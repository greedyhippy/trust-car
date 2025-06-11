// src/components/VehicleHistory.tsx
import React, { useEffect } from 'react';
import { useVehicleHistory, VehicleHistoryEvent } from '../hooks/useVehicleHistory';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ErrorMessage } from './common/ErrorMessage';

interface VehicleHistoryProps {
  registration: string;
  isVisible: boolean;
}

const EventIcon: React.FC<{ type: VehicleHistoryEvent['type'] }> = ({ type }) => {
  const iconStyle = {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    color: 'white'
  };

  switch (type) {
    case 'register':
      return <div style={{ ...iconStyle, backgroundColor: '#4CAF50' }}>R</div>;
    case 'transfer':
      return <div style={{ ...iconStyle, backgroundColor: '#2196F3' }}>T</div>;
    case 'service':
      return <div style={{ ...iconStyle, backgroundColor: '#FF9800' }}>S</div>;
    default:
      return <div style={{ ...iconStyle, backgroundColor: '#9E9E9E' }}>?</div>;
  }
};

const EventDetails: React.FC<{ event: VehicleHistoryEvent }> = ({ event }) => {
  const getEventDescription = () => {
    switch (event.type) {
      case 'register':
        return `Vehicle ${event.details.registration} was registered on the blockchain`;

      case 'transfer':
        return (
          <div>
            <div>Ownership transferred</div>
            {event.details.fromOwner && (
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                From: {event.details.fromOwner.slice(0, 8)}...{event.details.fromOwner.slice(-4)}
              </div>
            )}
            {event.details.toOwner && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                To: {event.details.toOwner.slice(0, 8)}...{event.details.toOwner.slice(-4)}
              </div>
            )}
          </div>
        );

      case 'service':
        return (
          <div>
            <div>Service Record Added</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
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

  return (
    <div style={{
      padding: '12px',
      backgroundColor: '#f8f9fa',
      borderRadius: '6px',
      marginBottom: '8px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        <EventIcon type={event.type} />

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '500', marginBottom: '4px' }}>
            {getEventDescription()}
          </div>

          <div style={{
            display: 'flex',
            gap: '16px',
            fontSize: '11px',
            color: '#666'
          }}>
            <span>📅 {formatDate(event.timestamp)}</span>
            <span>🔗 Round {event.round}</span>
            <span
              title={event.txId}
              style={{ cursor: 'help' }}
            >
              📋 {event.txId.slice(0, 8)}...
            </span>
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

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '8px',
      marginBottom: '16px',
      padding: '12px',
      backgroundColor: '#e3f2fd',
      borderRadius: '6px'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1976d2' }}>
          {stats.total}
        </div>
        <div style={{ fontSize: '11px', color: '#666' }}>Total Events</div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4CAF50' }}>
          {stats.registrations}
        </div>
        <div style={{ fontSize: '11px', color: '#666' }}>Registrations</div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2196F3' }}>
          {stats.transfers}
        </div>
        <div style={{ fontSize: '11px', color: '#666' }}>Transfers</div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#FF9800' }}>
          {stats.services}
        </div>
        <div style={{ fontSize: '11px', color: '#666' }}>Services</div>
      </div>
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
      fetchVehicleHistory(registration);
    } else if (!isVisible) {
      clearHistory();
    }
  }, [isVisible, registration, isConnected, fetchVehicleHistory, clearHistory]);

  if (!isVisible) {
    return null;
  }

  if (!isConnected) {
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <h3>Transaction History</h3>
        <ErrorMessage message="Please connect your wallet to view transaction history" />
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 style={{ margin: 0 }}>Transaction History</h3>

        <button
          onClick={() => fetchVehicleHistory(registration)}
          disabled={loading}
          style={{
            padding: '6px 12px',
            fontSize: '14px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? '⟳' : '🔄'} Refresh
        </button>
      </div>

      {loading && <LoadingSpinner message="Loading transaction history..." />}

      {error && <ErrorMessage message={error} />}

      {!loading && !error && events.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#666'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <div style={{ fontSize: '16px', marginBottom: '8px' }}>No History Found</div>
          <div style={{ fontSize: '14px' }}>
            No blockchain transactions found for {registration}
          </div>
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <>
          <HistoryStats events={events} />

          {/* Show localnet notice if using mock data */}
          {events.some(e => e.txId.startsWith('MOCK')) && (
            <div style={{
              backgroundColor: '#fff3cd',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '16px',
              border: '1px solid #ffeaa7'
            }}>
              <strong>📋 Development Mode:</strong> Showing mock transaction data for localnet.
              Deploy to TestNet to see real blockchain history.
            </div>
          )}

          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            padding: '12px'
          }}>
            {events.map((event) => (
              <EventDetails key={event.id} event={event} />
            ))}
          </div>

          {lastFetched && (
            <div style={{
              textAlign: 'center',
              fontSize: '11px',
              color: '#999',
              marginTop: '12px'
            }}>
              Last updated: {lastFetched.toLocaleTimeString()}
            </div>
          )}
        </>
      )}
    </div>
  );
};
