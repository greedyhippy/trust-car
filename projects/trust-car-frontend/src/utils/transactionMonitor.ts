// src/utils/transactionMonitor.ts
import { VehicleLogger } from './logger';

export interface TransactionInfo {
  txId: string;
  appId: bigint;
  method: string;
  registration?: string;
  timestamp: number;
}

export class TransactionMonitor {
  private static transactions: TransactionInfo[] = [];

  static addTransaction(txInfo: TransactionInfo) {
    this.transactions.push(txInfo);
    VehicleLogger.success(`Transaction recorded: ${txInfo.method}`, {
      txId: txInfo.txId,
      registration: txInfo.registration,
      loraUrl: `https://lora.algokit.io/testnet/transaction/${txInfo.txId}`
    });
  }

  static getTransactions(): TransactionInfo[] {
    return [...this.transactions].reverse(); // Most recent first
  }

  static getLoraUrl(txId: string): string {
    return `https://lora.algokit.io/testnet/transaction/${txId}`;
  }

  static getAppUrl(appId: bigint): string {
    return `https://lora.algokit.io/testnet/application/${appId}`;
  }

  static logTransactionDetails(txId: string, method: string, registration?: string) {
    console.group(`🔗 Transaction Details - ${method}`);
    console.log(`Transaction ID: ${txId}`);
    console.log(`View on Lora: ${this.getLoraUrl(txId)}`);
    if (registration) {
      console.log(`Vehicle Registration: ${registration}`);
    }
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.groupEnd();
  }
}
