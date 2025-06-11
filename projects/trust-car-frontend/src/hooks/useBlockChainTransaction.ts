// src/hooks/useBlockchainTransaction.ts
import { useState, useCallback } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs';
import { AlgorandClient } from '@algorandfoundation/algokit-utils';
import { IrishVehicleRegistryClient } from '../contracts/IrishVehicleRegistry';
import { VehicleLogger } from '../utils/logger';
import { APP_ID, TRANSACTION_WAIT_ROUNDS } from '../constants';
import { TransactionResult } from '../types/vehicle';

interface BlockchainTransactionState {
  loading: boolean;
  error: string | null;
  result: TransactionResult | null;
}

export const useBlockchainTransaction = () => {
  const [state, setState] = useState<BlockchainTransactionState>({
    loading: false,
    error: null,
    result: null,
  });

  const { transactionSigner, activeAddress } = useWallet();
  const algodConfig = getAlgodConfigFromViteEnvironment();
  const algorand = AlgorandClient.fromConfig({ algodConfig });

  const clearState = useCallback(() => {
    setState({
      loading: false,
      error: null,
      result: null,
    });
  }, []);

  const executeTransaction = useCallback(async (
    operation: string,
    transactionFn: () => Promise<any>
  ): Promise<boolean> => {
    if (!transactionSigner || !activeAddress) {
      setState(prev => ({
        ...prev,
        error: 'Please connect your wallet first'
      }));
      return false;
    }

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      result: null
    }));

    VehicleLogger.blockchain(`Starting ${operation}`, { activeAddress });

    try {
      const result = await transactionFn();

      if (result && result.txIds && result.txIds.length > 0) {
        const txId = result.txIds[0];

        // Wait for confirmation
        VehicleLogger.blockchain(`Waiting for confirmation`, { txId });

        // For localnet, we don't need to wait long for confirmation
        await new Promise(resolve => setTimeout(resolve, 2000));

        const transactionResult: TransactionResult = {
          txId,
          confirmedRound: 0, // We'll get this from the actual result if available
          message: `${operation} completed successfully`
        };

        setState(prev => ({
          ...prev,
          loading: false,
          result: transactionResult
        }));

        VehicleLogger.success(`${operation} successful`, transactionResult);
        return true;
      } else {
        throw new Error('No transaction ID returned');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `${operation} failed`;
      VehicleLogger.error(`${operation} failed`, error);

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      return false;
    }
  }, [transactionSigner, activeAddress]);

  const registerVehicle = useCallback(async (registration: string): Promise<boolean> => {
    if (!registration.trim()) {
      setState(prev => ({ ...prev, error: 'Registration is required' }));
      return false;
    }

    return executeTransaction('Vehicle Registration', async () => {
      // Use the generated client directly with proper error handling
      try {
        const appClient = new IrishVehicleRegistryClient({
          appId: APP_ID,
          sender: activeAddress!,
          algorand: algorand,
        });

        const result = await appClient.send.registerVehicle({
          args: { registration: registration.trim() },
          signer: transactionSigner!
        });

        return result;
      } catch (error) {
        console.error('Client call failed:', error);
        throw error;
      }
    });
  }, [executeTransaction, algorand, activeAddress, transactionSigner]);

  const transferOwnership = useCallback(async (
    registration: string,
    newOwner: string
  ): Promise<boolean> => {
    if (!registration.trim() || !newOwner.trim()) {
      setState(prev => ({
        ...prev,
        error: 'Registration and new owner address are required'
      }));
      return false;
    }

    // Basic validation for Algorand address
    if (newOwner.length !== 58) {
      setState(prev => ({
        ...prev,
        error: 'Invalid Algorand address format'
      }));
      return false;
    }

    return executeTransaction('Ownership Transfer', async () => {
      const appClient = new IrishVehicleRegistryClient({
        appId: APP_ID,
        sender: activeAddress!,
        algorand: algorand,
      });

      const result = await appClient.send.transferOwnership({
        args: {
          registration: registration.trim(),
          newOwner: newOwner.trim()
        },
        signer: transactionSigner!
      });

      return result;
    });
  }, [executeTransaction, algorand, activeAddress, transactionSigner]);

  const addServiceRecord = useCallback(async (
    registration: string,
    serviceDetails: string
  ): Promise<boolean> => {
    if (!registration.trim() || !serviceDetails.trim()) {
      setState(prev => ({
        ...prev,
        error: 'Registration and service details are required'
      }));
      return false;
    }

    return executeTransaction('Service Record', async () => {
      const appClient = new IrishVehicleRegistryClient({
        appId: APP_ID,
        sender: activeAddress!,
        algorand: algorand,
      });

      const result = await appClient.send.addServiceRecord({
        args: {
          registration: registration.trim(),
          serviceType: serviceDetails.trim()
        },
        signer: transactionSigner!
      });

      return result;
    });
  }, [executeTransaction, algorand, activeAddress, transactionSigner]);

  const getContractInfo = useCallback(async (): Promise<string | null> => {
    try {
      // For read-only operations, we don't need a signer
      const result = await algorand.send.appCall({
        appId: APP_ID,
        sender: activeAddress || 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        method: 'getInfo()string',
        methodArgs: []
      });

      return result.return?.returnValue?.toString() || null;
    } catch (error) {
      VehicleLogger.error('Failed to get contract info', error);
      return null;
    }
  }, [algorand, activeAddress]);

  return {
    ...state,
    registerVehicle,
    transferOwnership,
    addServiceRecord,
    getContractInfo,
    clearState,
    isWalletConnected: !!activeAddress,
    walletAddress: activeAddress
  };
};
