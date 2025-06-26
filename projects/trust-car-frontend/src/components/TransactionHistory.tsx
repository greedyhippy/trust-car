// src/components/TransactionHistory.tsx
import React from 'react';
import { TransactionMonitor, TransactionInfo } from '../utils/transactionMonitor';

interface TransactionHistoryProps {
  className?: string;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ className = '' }) => {
  const [transactions, setTransactions] = React.useState<TransactionInfo[]>([]);

  React.useEffect(() => {
    // Update transactions periodically
    const updateTransactions = () => {
      setTransactions(TransactionMonitor.getTransactions());
    };

    updateTransactions();
    const interval = setInterval(updateTransactions, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (transactions.length === 0) {
    return null;
  }

  const formatMethod = (method: string) => {
    switch (method) {
      case 'registerVehicle':
        return '🚗 Register Vehicle';
      case 'transferOwnership':
        return '🔄 Transfer Ownership';
      case 'addServiceRecord':
        return '🔧 Add Service Record';
      default:
        return method;
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s ago`;
    }
    return `${seconds}s ago`;
  };

  return (
    <div className={`transaction-history ${className}`}>
      <style>{`
        .transaction-history {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .transaction-history h3 {
          margin: 0 0 16px 0;
          color: #333;
          font-size: 18px;
          font-weight: 600;
        }
        .transaction-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          margin-bottom: 8px;
          background: linear-gradient(145deg, #f8f9fa, #e9ecef);
          border-radius: 8px;
          border-left: 4px solid #2196F3;
          transition: all 0.3s ease;
        }
        .transaction-item:hover {
          transform: translateX(4px);
          box-shadow: 0 2px 10px rgba(33, 150, 243, 0.2);
        }
        .transaction-main {
          flex: 1;
        }
        .transaction-method {
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }
        .transaction-registration {
          color: #666;
          font-size: 12px;
          margin-top: 2px;
        }
        .transaction-side {
          text-align: right;
        }
        .transaction-time {
          color: #999;
          font-size: 12px;
          margin-bottom: 4px;
        }
        .lora-link {
          background: linear-gradient(145deg, #2196F3, #1976D2);
          color: white;
          text-decoration: none;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        .lora-link:hover {
          background: linear-gradient(145deg, #1976D2, #1565C0);
          transform: scale(1.05);
        }
        .no-transactions {
          text-align: center;
          color: #666;
          font-style: italic;
          padding: 20px;
        }
      `}</style>

      <h3>Recent Transactions</h3>
      {transactions.slice(0, 5).map((tx, index) => (
        <div key={`${tx.txId}-${index}`} className="transaction-item">
          <div className="transaction-main">
            <div className="transaction-method">
              {formatMethod(tx.method)}
            </div>
            {tx.registration && (
              <div className="transaction-registration">
                Vehicle: {tx.registration}
              </div>
            )}
          </div>
          <div className="transaction-side">
            <div className="transaction-time">
              {formatTime(tx.timestamp)}
            </div>
            <a
              href={TransactionMonitor.getLoraUrl(tx.txId)}
              target="_blank"
              rel="noopener noreferrer"
              className="lora-link"
            >
              View on Lora
            </a>
          </div>
        </div>
      ))}
    </div>
  );
};
