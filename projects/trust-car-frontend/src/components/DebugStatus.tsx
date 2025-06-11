// src/components/DebugStatus.tsx
import React, { useState, useEffect } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs';
import { AlgorandClient } from '@algorandfoundation/algokit-utils';
import { APP_ID } from '../constants';

export const DebugStatus: React.FC = () => {
  const { activeAddress, transactionSigner, wallets } = useWallet();
  const [appInfo, setAppInfo] = useState<any>(null);
  const [appError, setAppError] = useState<string | null>(null);
  const [accountInfo, setAccountInfo] = useState<any>(null);

  const algodConfig = getAlgodConfigFromViteEnvironment();
  const algorand = AlgorandClient.fromConfig({ algodConfig });

  const checkAppStatus = async () => {
    try {
      console.log('Checking app status for APP_ID:', APP_ID);
      const appInfo = await algorand.client.algod.getApplicationByID(APP_ID).do();
      setAppInfo(appInfo);
      setAppError(null);
      console.log('App found:', appInfo);
    } catch (error) {
      console.error('App check failed:', error);
      setAppError(error instanceof Error ? error.message : 'App not found');
      setAppInfo(null);
    }
  };

  const checkAccountInfo = async () => {
    if (!activeAddress) return;

    try {
      const accountInfo = await algorand.client.algod.accountInformation(activeAddress).do();
      setAccountInfo(accountInfo);
      console.log('Account info:', accountInfo);
    } catch (error) {
      console.error('Account check failed:', error);
    }
  };

  useEffect(() => {
    checkAppStatus();
  }, []);

  useEffect(() => {
    if (activeAddress) {
      checkAccountInfo();
    }
  }, [activeAddress]);

  const testPayment = async () => {
    if (!activeAddress || !transactionSigner) {
      alert('Wallet not connected');
      return;
    }

    try {
      console.log('Testing payment...');
      const result = await algorand.send.payment({
        sender: activeAddress,
        signer: transactionSigner,
        receiver: activeAddress,
        amount: 0
      });

      console.log('Payment test successful:', result);
      alert(`Payment test successful! TX: ${result.txIds[0]}`);
    } catch (error) {
      console.error('Payment test failed:', error);
      alert(`Payment test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      width: '400px',
      backgroundColor: 'white',
      border: '2px solid #333',
      borderRadius: '8px',
      padding: '15px',
      fontSize: '12px',
      zIndex: 1000,
      maxHeight: '80vh',
      overflowY: 'auto'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>🔍 Debug Status</h3>

      {/* Wallet Status */}
      <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f0f8ff', borderRadius: '4px' }}>
        <strong>👛 Wallet Status:</strong>
        <div>Active Address: {activeAddress ? `${activeAddress.slice(0, 8)}...${activeAddress.slice(-4)}` : 'Not connected'}</div>
        <div>Signer Available: {transactionSigner ? '✅ Yes' : '❌ No'}</div>
        <div>Available Wallets: {wallets?.length || 0}</div>

        {activeAddress && (
          <button
            onClick={testPayment}
            style={{
              marginTop: '8px',
              padding: '4px 8px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            Test Payment (0 ALGO to self)
          </button>
        )}
      </div>

      {/* Account Info */}
      {accountInfo && (
        <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f0fff0', borderRadius: '4px' }}>
          <strong>💰 Account Info:</strong>
          <div>Balance: {(Number(accountInfo.amount) / 1000000).toFixed(6)} ALGO</div>
          <div>Min Balance: {(Number(accountInfo['min-balance']) / 1000000).toFixed(6)} ALGO</div>
        </div>
      )}

      {/* App Status */}
      <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: appError ? '#ffe0e0' : '#e0ffe0', borderRadius: '4px' }}>
        <strong>📱 Smart Contract Status (APP_ID: {APP_ID}):</strong>
        {appError ? (
          <div style={{ color: 'red' }}>❌ {appError}</div>
        ) : appInfo ? (
          <div>
            <div>✅ Contract Found</div>
            <div>Creator: {appInfo.params.creator ? appInfo.params.creator.toString().slice(0, 8) + '...' + appInfo.params.creator.toString().slice(-4) : 'Unknown'}</div>
            <div>Global State: {appInfo.params['global-state']?.length || 0} items</div>
          </div>
        ) : (
          <div>🔄 Checking...</div>
        )}

        <button
          onClick={checkAppStatus}
          style={{
            marginTop: '8px',
            padding: '4px 8px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          Refresh App Status
        </button>
      </div>

      {/* Network Info */}
      <div style={{ padding: '10px', backgroundColor: '#fff0f0', borderRadius: '4px' }}>
        <strong>🌐 Network Info:</strong>
        <div>Network: {algodConfig.network || 'localnet'}</div>
        <div>Server: {algodConfig.server}</div>
        <div>Port: {algodConfig.port}</div>
      </div>
    </div>
  );
};
