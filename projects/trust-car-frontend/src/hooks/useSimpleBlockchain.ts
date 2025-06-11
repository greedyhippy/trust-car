// src/hooks/useSimpleBlockchain.ts
import { useState, useCallback } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs';
import { AlgorandClient, algo } from '@algorandfoundation/algokit-utils';
import { VehicleLogger } from '../utils/logger';
import { APP_ID } from '../constants';
import { TransactionResult } from '../types/vehicle';

interface SimpleBlockchainState {
  loading: boolean;
  error: string | null;
  result: TransactionResult | null;
}

export const useSimpleBlockchain = () => {
  const [state, setState] = useState<SimpleBlockchainState>({
    loading: false,
    error: null,
    result: null,
  });

  const { transactionSigner, activeAddress } = useWallet();
  const algodConfig = getAlgodConfigFromViteEnvironment();
  const algorand = AlgorandClient.fromConfig({ algodConfig });

  const registerVehicle = useCallback(async (registration: string): Promise<boolean> => {
    if (!transactionSigner || !activeAddress) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return false;
    }

    if (!registration.trim()) {
      setState(prev => ({ ...prev, error: 'Registration is required' }));
      return false;
    }

    setState(prev => ({ ...prev, loading: true, error: null, result: null }));
    VehicleLogger.blockchain('Starting vehicle registration', { registration, activeAddress });

    try {
      // Test with a simple payment first to verify wallet works
      VehicleLogger.blockchain('Testing payment transaction first...');

      const paymentResult = await algorand.send.payment({
        sender: activeAddress,
        signer: transactionSigner,
        receiver: activeAddress,
        amount: algo(0) // 0 ALGO to self
      });

      VehicleLogger.success('Payment test successful', paymentResult);

      // If payment works, now try the app call
      VehicleLogger.blockchain('Now attempting app call...');

      // Use the IrishVehicleRegistryClient directly - this should work
      const { IrishVehicleRegistryClient } = await import('../contracts/IrishVehicleRegistry');

      const appClient = new IrishVehicleRegistryClient({
        appId: APP_ID,
        defaultSender: activeAddress, // Use defaultSender instead of sender
        algorand: algorand,
      });

      VehicleLogger.blockchain('App client created, calling registerVehicle...');

      const result = await appClient.send.registerVehicle({
        args: { registration: registration.trim() },
        sender: activeAddress, // Also specify sender in the method call
        signer: transactionSigner
      });

      VehicleLogger.success('App call successful', result);

      setState(prev => ({
        ...prev,
        loading: false,
        result: {
          txId: result.txIds[0],
          confirmedRound: 0,
          message: 'Vehicle registered successfully'
        }
      }));

      return true;

    } catch (error) {
      VehicleLogger.error('Transaction failed', error);

      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      return false;
    }
  }, [algorand, activeAddress, transactionSigner]);

  const clearState = useCallback(() => {
    setState({
      loading: false,
      error: null,
      result: null,
    });
  }, []);

  return {
    ...state,
    registerVehicle,
    transferOwnership: registerVehicle, // Use same logic for now
    addServiceRecord: registerVehicle, // Use same logic for now
    clearState,
    isWalletConnected: !!activeAddress,
    walletAddress: activeAddress
  };
};
