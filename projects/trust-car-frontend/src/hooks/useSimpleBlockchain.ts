// src/hooks/useSimpleBlockchain.ts
import { useState, useCallback } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs';
import { AlgorandClient, algo } from '@algorandfoundation/algokit-utils';
import { VehicleLogger } from '../utils/logger';
import { TransactionMonitor } from '../utils/transactionMonitor';
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
      // Use the IrishVehicleRegistryClient directly
      const { IrishVehicleRegistryClient } = await import('../contracts/IrishVehicleRegistry');

      const appClient = new IrishVehicleRegistryClient({
        appId: APP_ID,
        defaultSender: activeAddress,
        algorand: algorand,
      });

      VehicleLogger.blockchain('App client created, calling registerVehicle...');

      const result = await appClient.send.registerVehicle({
        args: { registration: registration.trim() },
        sender: activeAddress,
        signer: transactionSigner
      });

      VehicleLogger.success('Vehicle registration successful', result);

      // Log transaction for monitoring
      TransactionMonitor.addTransaction({
        txId: result.txIds[0],
        appId: APP_ID,
        method: 'registerVehicle',
        registration: registration.trim(),
        timestamp: Date.now()
      });

      TransactionMonitor.logTransactionDetails(result.txIds[0], 'registerVehicle', registration.trim());

      setState(prev => ({
        ...prev,
        loading: false,
        result: {
          txId: result.txIds[0],
          confirmedRound: 0,
          message: `Vehicle ${registration} registered successfully`
        }
      }));

      return true;

    } catch (error) {
      VehicleLogger.error('Vehicle registration failed', error);

      // Handle specific error cases
      let errorMessage = 'Registration failed';
      if (error instanceof Error) {
        if (error.message.includes('already registered')) {
          errorMessage = `Vehicle ${registration} is already registered`;
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for transaction';
        } else if (error.message.includes('rejected')) {
          errorMessage = 'Transaction rejected by user';
        } else {
          errorMessage = error.message;
        }
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      return false;
    }
  }, [algorand, activeAddress, transactionSigner]);

  const checkVehicleRegistration = useCallback(async (registration: string): Promise<boolean> => {
    if (!activeAddress) return false;

    try {
      const { IrishVehicleRegistryClient } = await import('../contracts/IrishVehicleRegistry');

      const appClient = new IrishVehicleRegistryClient({
        appId: APP_ID,
        defaultSender: activeAddress,
        algorand: algorand,
      });

      // This would call a read-only method if available in your contract
      // For now, we'll assume the contract handles duplicate registration checks internally
      return false; // Placeholder - implement if you add isVehicleRegistered method to contract
    } catch (error) {
      VehicleLogger.info('Could not check vehicle registration status', error);
      return false;
    }
  }, [algorand, activeAddress]);

  const clearState = useCallback(() => {
    setState({
      loading: false,
      error: null,
      result: null,
    });
  }, []);

  const transferOwnership = useCallback(async (registration: string, newOwner: string): Promise<boolean> => {
    if (!transactionSigner || !activeAddress) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return false;
    }

    if (!registration.trim() || !newOwner.trim()) {
      setState(prev => ({ ...prev, error: 'Registration and new owner are required' }));
      return false;
    }

    setState(prev => ({ ...prev, loading: true, error: null, result: null }));
    VehicleLogger.blockchain('Starting ownership transfer', { registration, newOwner, activeAddress });

    try {
      const { IrishVehicleRegistryClient } = await import('../contracts/IrishVehicleRegistry');

      const appClient = new IrishVehicleRegistryClient({
        appId: APP_ID,
        defaultSender: activeAddress,
        algorand: algorand,
      });

      VehicleLogger.blockchain('App client created, calling transferOwnership...');

      const result = await appClient.send.transferOwnership({
        args: {
          registration: registration.trim(),
          newOwner: newOwner.trim()
        },
        sender: activeAddress,
        signer: transactionSigner
      });

      VehicleLogger.success('Transfer ownership successful', result);

      // Log transaction for monitoring
      TransactionMonitor.addTransaction({
        txId: result.txIds[0],
        appId: APP_ID,
        method: 'transferOwnership',
        registration: registration.trim(),
        timestamp: Date.now()
      });

      TransactionMonitor.logTransactionDetails(result.txIds[0], 'transferOwnership', registration.trim());

      setState(prev => ({
        ...prev,
        loading: false,
        result: {
          txId: result.txIds[0],
          confirmedRound: 0,
          message: `Ownership of ${registration} transferred to ${newOwner}`
        }
      }));

      return true;

    } catch (error) {
      VehicleLogger.error('Transfer ownership failed', error);

      const errorMessage = error instanceof Error ? error.message : 'Transfer failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      return false;
    }
  }, [algorand, activeAddress, transactionSigner]);

  const addServiceRecord = useCallback(async (registration: string, serviceDetails: string): Promise<boolean> => {
    if (!transactionSigner || !activeAddress) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return false;
    }

    if (!registration.trim() || !serviceDetails.trim()) {
      setState(prev => ({ ...prev, error: 'Registration and service details are required' }));
      return false;
    }

    setState(prev => ({ ...prev, loading: true, error: null, result: null }));
    VehicleLogger.blockchain('Starting service record addition', { registration, serviceDetails, activeAddress });

    try {
      const { IrishVehicleRegistryClient } = await import('../contracts/IrishVehicleRegistry');

      const appClient = new IrishVehicleRegistryClient({
        appId: APP_ID,
        defaultSender: activeAddress,
        algorand: algorand,
      });

      VehicleLogger.blockchain('App client created, calling addServiceRecord...');

      const result = await appClient.send.addServiceRecord({
        args: {
          registration: registration.trim(),
          serviceType: serviceDetails.trim()
        },
        sender: activeAddress,
        signer: transactionSigner
      });

      VehicleLogger.success('Service record addition successful', result);

      // Log transaction for monitoring
      TransactionMonitor.addTransaction({
        txId: result.txIds[0],
        appId: APP_ID,
        method: 'addServiceRecord',
        registration: registration.trim(),
        timestamp: Date.now()
      });

      TransactionMonitor.logTransactionDetails(result.txIds[0], 'addServiceRecord', registration.trim());

      setState(prev => ({
        ...prev,
        loading: false,
        result: {
          txId: result.txIds[0],
          confirmedRound: 0,
          message: `Service record added for ${registration}: ${serviceDetails}`
        }
      }));

      return true;

    } catch (error) {
      VehicleLogger.error('Service record addition failed', error);

      const errorMessage = error instanceof Error ? error.message : 'Service record failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      return false;
    }
  }, [algorand, activeAddress, transactionSigner]);

  return {
    ...state,
    registerVehicle,
    transferOwnership,
    addServiceRecord,
    checkVehicleRegistration,
    clearState,
    isWalletConnected: !!activeAddress,
    walletAddress: activeAddress
  };
};
