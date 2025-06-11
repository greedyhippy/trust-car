// src/types/blockchain.ts
export type BlockchainAction = 'register' | 'transfer' | 'service' | 'info';

export interface TransactionResult {
  txId: string;
  confirmedRound: number;
  message?: string;
}

export interface ServiceRecord {
  type: string;
  mileage: string;
  provider?: string;
  date?: string;
}
