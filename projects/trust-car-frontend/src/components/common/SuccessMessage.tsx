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
