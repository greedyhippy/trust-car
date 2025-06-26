// src/components/VehicleHistory.tsx - Integrated with TransactionMonitor
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
            <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
              Vehicle: {event.details.registration}
            </div>
          </div>
        );

      case 'service':
        return (
          <div>
            <div style={{ fontWeight: '600', color: '#333' }}>Service Record Added</div>
            <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
              Vehicle: {event.details.registration}
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
    return TransactionMonitor.getLoraUrl(txId);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      padding: '20px',
      borderBottom: '1px solid rgba(0,0,0,0.1)',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      const target = e.currentTarget as HTMLDivElement;
      target.style.backgroundColor = 'rgba(33, 150, 243, 0.05)';
    }}
    onMouseLeave={(e) => {
      const target = e.currentTarget as HTMLDivElement;
      target.style.backgroundColor = 'transparent';
    }}>
      <div style={{ marginRight: '16px', flexShrink: 0 }}>
        <EventIcon type={event.type} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: '8px' }}>
          {getEventDescription()}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          fontSize: '13px',
          color: '#666'
        }}>
          <span>{formatDate(event.timestamp)}</span>
          <span>•</span>
          <a
            href={getTestNetUrl(event.txId)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#2196F3',
              textDecoration: 'none',
              fontWeight: '500',
              padding: '2px 6px',
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLAnchorElement;
              target.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';
              target.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLAnchorElement;
              target.style.backgroundColor = 'transparent';
              target.style.textDecoration = 'none';
            }}
          >
            View on Lora
          </a>
        </div>
      </div>
    </div>
  );
};

export const VehicleHistory: React.FC<VehicleHistoryProps> = ({ registration, isVisible }) => {
  const [events, setEvents] = useState<VehicleHistoryEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert TransactionInfo to VehicleHistoryEvent
  const convertTransactionToEvent = (tx: TransactionInfo): VehicleHistoryEvent => {
    let type: VehicleHistoryEvent['type'] = 'unknown';

    switch (tx.method) {
      case 'registerVehicle':
        type = 'register';
        break;
      case 'transferOwnership':
        type = 'transfer';
        break;
      case 'addServiceRecord':
        type = 'service';
        break;
    }

    return {
      id: tx.txId,
      type,
      timestamp: new Date(tx.timestamp),
      txId: tx.txId,
      details: {
        registration: tx.registration,
        method: tx.method
      }
    };
  };

  useEffect(() => {
    if (!isVisible) return;

    const fetchTransactionHistory = () => {
      setLoading(true);
      setError(null);

      try {
        // Get transactions from TransactionMonitor
        const allTransactions = TransactionMonitor.getTransactions();

        // Filter by registration if specified
        const filteredTransactions = registration
          ? allTransactions.filter(tx => tx.registration === registration)
          : allTransactions;

        // Convert to VehicleHistoryEvent format
        const convertedEvents = filteredTransactions.map(convertTransactionToEvent);

        setEvents(convertedEvents);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch transaction history');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionHistory();

    // Set up polling to refresh data
    const interval = setInterval(fetchTransactionHistory, 5000);
    return () => clearInterval(interval);
  }, [registration, isVisible]);

  if (!isVisible) return null;

  const refreshHistory = () => {
    const allTransactions = TransactionMonitor.getTransactions();
    const filteredTransactions = registration
      ? allTransactions.filter(tx => tx.registration === registration)
      : allTransactions;
    const convertedEvents = filteredTransactions.map(convertTransactionToEvent);
    setEvents(convertedEvents);
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            📋 Transaction History
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
            {registration ? `Vehicle: ${registration}` : 'All Transactions'}
          </p>
        </div>
        <button
          onClick={refreshHistory}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.transform = 'translateY(-1px)';
            target.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.3)';
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.transform = 'translateY(0)';
            target.style.boxShadow = 'none';
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Content */}
      <div style={{ minHeight: '200px' }}>
        {loading && (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <LoadingSpinner />
            <p style={{ margin: '12px 0 0 0', color: '#666' }}>Loading transaction history...</p>
          </div>
        )}

        {error && (
          <div style={{ padding: '20px' }}>
            <ErrorMessage message={error} />
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#666'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
              No History Found
            </h4>
            <p style={{ margin: 0, fontSize: '14px' }}>
              {registration
                ? `No blockchain transactions found for ${registration}`
                : 'No blockchain transactions found. Try performing some operations first.'
              }
            </p>
          </div>
        )}

        {!loading && !error && events.length > 0 && (
          <div>
            <div style={{
              padding: '16px 20px',
              background: 'rgba(33, 150, 243, 0.05)',
              borderBottom: '1px solid rgba(0,0,0,0.1)',
              fontSize: '14px',
              fontWeight: '500',
              color: '#333'
            }}>
              {events.length} transaction{events.length !== 1 ? 's' : ''} found
            </div>
            {events.map((event) => (
              <EventDetails key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
