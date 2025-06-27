// src/services/blockchain/vehicleContract.ts
import algosdk from 'algosdk';
import { AlgorandClient } from './algorandClient';
import { APP_ID, TRANSACTION_WAIT_ROUNDS } from '../../constants';
import { VehicleLogger } from '../../utils/logger';
import { TransactionResult } from '../../types/blockchain';

export class VehicleContractService {
  private client: AlgorandClient;

  constructor() {
    this.client = AlgorandClient.getInstance();
  }

  private async executeTransaction(
    appArgs: Uint8Array[],
    sender: string,
    signTransaction: (txn: Uint8Array) => Promise<Uint8Array[]>
  ): Promise<TransactionResult> {
    const algodClient = this.client.getClient();
    const suggestedParams = await this.client.getTransactionParams();

    const txn = algosdk.makeApplicationNoOpTxnFromObject({
      sender,
      appIndex: APP_ID,
      appArgs,
      suggestedParams,
    });

    const txnB64 = algosdk.encodeUnsignedTransaction(txn);
    const signedTxns = await signTransaction([txnB64]);

    const txId = await this.client.sendTransaction(signedTxns[0] as Uint8Array);
    const result = await this.client.waitForConfirmation(txId, TRANSACTION_WAIT_ROUNDS);

    return {
      txId,
      confirmedRound: Number(result.confirmedRound || 0),
    };
  }

  async registerVehicle(
    registration: string,
    sender: string,
    signTransaction: (txn: Uint8Array) => Promise<Uint8Array[]>
  ): Promise<TransactionResult> {
    VehicleLogger.blockchain('Registering vehicle', { registration, sender });

    const method = algosdk.ABIMethod.fromSignature("registerVehicle(string)string");
    const appArgs = [
      method.getSelector(),
      algosdk.ABIType.from("string").encode(registration)
    ];

    return this.executeTransaction(appArgs, sender, signTransaction);
  }

  async transferOwnership(
    registration: string,
    newOwner: string,
    sender: string,
    signTransaction: (txn: Uint8Array) => Promise<Uint8Array[]>
  ): Promise<TransactionResult> {
    VehicleLogger.blockchain('Transferring ownership', { registration, newOwner, sender });

    const method = algosdk.ABIMethod.fromSignature("transferOwnership(string,string)string");
    const appArgs = [
      method.getSelector(),
      algosdk.ABIType.from("string").encode(registration),
      algosdk.ABIType.from("string").encode(newOwner)
    ];

    return this.executeTransaction(appArgs, sender, signTransaction);
  }

  async addServiceRecord(
    registration: string,
    serviceDetails: string,
    sender: string,
    signTransaction: (txn: Uint8Array) => Promise<Uint8Array[]>
  ): Promise<TransactionResult> {
    VehicleLogger.blockchain('Adding service record', { registration, serviceDetails, sender });

    const method = algosdk.ABIMethod.fromSignature("addServiceRecord(string,string)string");
    const appArgs = [
      method.getSelector(),
      algosdk.ABIType.from("string").encode(registration),
      algosdk.ABIType.from("string").encode(serviceDetails)
    ];

    return this.executeTransaction(appArgs, sender, signTransaction);
  }
}
