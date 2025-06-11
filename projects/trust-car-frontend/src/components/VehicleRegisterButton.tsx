// src/components/VehicleRegisterButton.tsx
// Simplified version using direct contract calls

import React, { useState } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { VehicleLogger } from '../utils/logger';
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs';
import algosdk from 'algosdk';

interface VehicleRegisterButtonProps {
  vehicleData: {
    registration: string;
    vin: string;
    make: string;
    model: string;
    year: number;
  };
}

// Your deployed App ID
const APP_ID = 1012;

export const VehicleRegisterButton: React.FC<VehicleRegisterButtonProps> = ({ vehicleData }) => {
  const { activeAddress, signTransactions } = useWallet();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const registerVehicle = async () => {
    VehicleLogger.blockchain('Starting vehicle registration', {
      registration: vehicleData.registration,
      wallet: activeAddress
    });

    if (!activeAddress) {
      setMessage('Please connect your wallet first');
      setStatus('error');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      // Get Algod client
      const algodConfig = getAlgodConfigFromViteEnvironment();
      const algodClient = new algosdk.Algodv2(
        algodConfig.token as string,
        algodConfig.server,
        algodConfig.port
      );

      // Get suggested params
      const suggestedParams = await algodClient.getTransactionParams().do();

      // Create the application call transaction
      const encoder = new TextEncoder();

      // Get the ABI method signature
      const method = algosdk.ABIMethod.fromSignature("registerVehicle(string)string");

      // Encode the arguments properly
      const methodSelector = method.getSelector();
      const encodedArg = algosdk.ABIType.from("string").encode(vehicleData.registration);

      const appArgs = [
        methodSelector,
        encodedArg
      ];

      // Debug log
      VehicleLogger.blockchain('Creating transaction with params', {
        from: activeAddress,
        appIndex: APP_ID,
        hasAlgosdk: !!algosdk,
        hasMakeApplicationNoOpTxnFromObject: !!algosdk?.makeApplicationNoOpTxnFromObject
      });

      const txn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: activeAddress,  // Changed from 'from' to 'sender'
        appIndex: APP_ID,
        appArgs: appArgs,
        suggestedParams: suggestedParams,
      });

      VehicleLogger.blockchain('Transaction created', {
        appId: APP_ID,
        method: 'registerVehicle',
        args: vehicleData.registration
      });

      // Sign transaction using wallet - properly encode for wallet
      const txnB64 = algosdk.encodeUnsignedTransaction(txn);

      VehicleLogger.blockchain('Requesting signature from wallet');

      // The wallet expects base64 encoded transactions
      const signedTxns = await signTransactions([txnB64]);

      VehicleLogger.blockchain('Transaction signed');

      // Send the signed transaction
      const response = await algodClient.sendRawTransaction(signedTxns[0]).do();
      const txId = response.txid; // lowercase 'txid'

      VehicleLogger.blockchain('Transaction sent successfully', { txId, fullResponse: response });

      // Wait for confirmation
      const result = await algosdk.waitForConfirmation(algodClient, txId, 4);

      VehicleLogger.success('Vehicle registration transaction confirmed', {
        txId: txId,
        confirmedRound: result.confirmedRound || result['confirmed-round']
      });

      // Extract return value if any
      let returnValue = "Vehicle registered successfully!";
      if (result['logs'] && result['logs'].length > 0) {
        // Try to decode the return value from logs
        try {
          const decoder = new TextDecoder();
          returnValue = decoder.decode(result['logs'][0]);
        } catch (e) {
          // Use default message if decode fails
        }
      }

      setStatus('success');
      setMessage(`✅ ${returnValue} (Tx: ${txId.substring(0, 8)}...)`);

    } catch (error: any) {
      VehicleLogger.error('Registration failed', error);

      // Better error handling
      let errorMessage = 'Unknown error';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.text) {
        errorMessage = error.response.text;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      setStatus('error');
      setMessage(`Failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      marginTop: '20px',
      padding: '15px',
      backgroundColor: '#e3f2fd',
      borderRadius: '8px',
      border: '1px solid #1976d2'
    }}>
      <h4 style={{ marginTop: 0 }}>Register on Algorand Blockchain</h4>

      {!activeAddress ? (
        <p style={{ color: '#d32f2f' }}>
          ⚠️ Please connect your wallet to register this vehicle
        </p>
      ) : (
        <div>
          <p style={{ color: '#1976d2', fontSize: '14px' }}>
            Connected wallet: {activeAddress.slice(0, 6)}...{activeAddress.slice(-4)}
          </p>
          <p style={{ color: '#666', fontSize: '12px' }}>
            App ID: {APP_ID}
          </p>
        </div>
      )}

      <button
        onClick={registerVehicle}
        disabled={loading || !activeAddress}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: loading || !activeAddress ? '#ccc' : '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading || !activeAddress ? 'not-allowed' : 'pointer',
          marginRight: '10px'
        }}
      >
        {loading ? 'Registering...' : 'Register Vehicle'}
      </button>

      {/* Status Messages */}
      {status === 'success' && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#c8e6c9',
          color: '#2e7d32',
          borderRadius: '4px'
        }}>
          {message}
        </div>
      )}

      {status === 'error' && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#ffcdd2',
          color: '#c62828',
          borderRadius: '4px'
        }}>
          ❌ {message}
        </div>
      )}

      {/* Registration Info */}
      <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
        <strong>What happens when you register:</strong>
        <ul style={{ marginLeft: '20px', marginTop: '5px' }}>
          <li>Vehicle data is stored permanently on Algorand blockchain</li>
          <li>Transaction is recorded with App ID {APP_ID}</li>
          <li>You can view the transaction in the blockchain explorer</li>
          <li>All data is publicly verifiable</li>
        </ul>
      </div>
    </div>
  );
};
