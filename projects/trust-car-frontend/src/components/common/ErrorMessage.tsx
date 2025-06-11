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
