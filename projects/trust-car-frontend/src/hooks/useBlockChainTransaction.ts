// src/hooks/useBlockchainTransaction.ts
import { useState } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { VehicleContractService } from '../services/blockchain/vehicleContract';
import { TransactionResult } from '../types/blockchain';

export const useBlockchainTransaction = () => {
  const { activeAddress, signTransactions } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TransactionResult | null>(null);

  const contractService = new VehicleContractService();

  const execute = async (
    action: () => Promise<TransactionResult>
  ): Promise<boolean> => {
    if (!activeAddress) {
      setError('Please connect your wallet');
      return false;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const txResult = await action();
      setResult(txResult);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const registerVehicle = async (registration: string) => {
    return execute(() =>
      contractService.registerVehicle(registration, activeAddress!, signTransactions)
    );
  };

  const transferOwnership = async (registration: string, newOwner: string) => {
    return execute(() =>
      contractService.transferOwnership(registration, newOwner, activeAddress!, signTransactions)
    );
  };

  const addServiceRecord = async (registration: string, serviceDetails: string) => {
    return execute(() =>
      contractService.addServiceRecord(registration, serviceDetails, activeAddress!, signTransactions)
    );
  };

  return {
    loading,
    error,
    result,
    registerVehicle,
    transferOwnership,
    addServiceRecord,
    isWalletConnected: !!activeAddress,
    walletAddress: activeAddress,
  };
};
