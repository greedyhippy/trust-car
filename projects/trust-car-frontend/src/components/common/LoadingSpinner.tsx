// src/components/common/LoadingSpinner.tsx
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message = 'Loading...'
}) => {
  const sizeMap = {
    small: 20,
    medium: 40,
    large: 60,
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px'
    }}>
      <div
        style={{
          width: sizeMap[size],
          height: sizeMap[size],
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #1976d2',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      {message && (
        <p style={{ marginTop: '10px', color: '#666' }}>{message}</p>
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

// src/components/common/ErrorMessage.tsx
import React from 'react';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onDismiss }) => {
  return (
    <div style={{
      padding: '15px',
      backgroundColor: '#ffebee',
      color: '#c62828',
      borderRadius: '4px',
      border: '1px solid #ef5350',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      margin: '10px 0'
    }}>
      <span>⚠️ {message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: '#c62828',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '0 5px'
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};

// src/components/common/SuccessMessage.tsx
import React from 'react';

interface SuccessMessageProps {
  message: string;
  txId?: string;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({ message, txId }) => {
  return (
    <div style={{
      padding: '15px',
      backgroundColor: '#c8e6c9',
      color: '#2e7d32',
      borderRadius: '4px',
      border: '1px solid #66bb6a',
      margin: '10px 0'
    }}>
      <div>✅ {message}</div>
      {txId && (
        <div style={{ fontSize: '12px', marginTop: '5px' }}>
          Transaction ID: {txId.substring(0, 8)}...
        </div>
      )}
    </div>
  );
};
