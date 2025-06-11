// src/services/blockchain/algorandClient.ts
import algosdk from 'algosdk';
import { getAlgodConfigFromViteEnvironment } from '../../utils/network/getAlgoClientConfigs';

export class AlgorandClient {
  private static instance: AlgorandClient;
  private algodClient: algosdk.Algodv2;

  private constructor() {
    const config = getAlgodConfigFromViteEnvironment();
    this.algodClient = new algosdk.Algodv2(
      config.token as string,
      config.server,
      config.port
    );
  }

  static getInstance(): AlgorandClient {
    if (!AlgorandClient.instance) {
      AlgorandClient.instance = new AlgorandClient();
    }
    return AlgorandClient.instance;
  }

  getClient(): algosdk.Algodv2 {
    return this.algodClient;
  }

  async getTransactionParams() {
    return await this.algodClient.getTransactionParams().do();
  }

  async sendTransaction(signedTxn: Uint8Array): Promise<string> {
    const response = await this.algodClient.sendRawTransaction(signedTxn).do();
    return response.txid;
  }

  async waitForConfirmation(txId: string, rounds: number = 4) {
    return await algosdk.waitForConfirmation(this.algodClient, txId, rounds);
  }
}
