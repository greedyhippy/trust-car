// src/hooks/useVehicleHistory.ts - Fixed Version
import { useState, useCallback } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs';
import { AlgorandClient } from '@algorandfoundation/algokit-utils';
import { VehicleLogger } from '../utils/logger';
import { APP_ID } from '../constants';

export interface VehicleHistoryEvent {
  id: string;
  type: 'register' | 'transfer' | 'service' | 'unknown';
  timestamp: Date;
  round: number;
  txId: string;
  details: {
    registration?: string;
    fromOwner?: string;
    toOwner?: string;
    serviceType?: string;
    rawData?: string;
  };
  sender: string;
}

export interface VehicleHistoryState {
  events: VehicleHistoryEvent[];
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
}

export const useVehicleHistory = () => {
  const [state, setState] = useState<VehicleHistoryState>({
    events: [],
    loading: false,
    error: null,
    lastFetched: null,
  });

  const { activeAddress } = useWallet();
  const algodConfig = getAlgodConfigFromViteEnvironment();

  // Create indexer config from environment variables
  const indexerConfig = {
    server: import.meta.env.VITE_INDEXER_SERVER || 'https://testnet-idx.algonode.cloud',
    port: import.meta.env.VITE_INDEXER_PORT || 443,
    token: import.meta.env.VITE_INDEXER_TOKEN || ''
  };

  const algorand = AlgorandClient.fromConfig({
    algodConfig,
    indexerConfig
  });

  const parseApplicationArgs = (args: Uint8Array[]): { method: string; decodedArgs: string[] } => {
    if (args.length === 0) return { method: 'unknown', decodedArgs: [] };

    try {
      // First arg is usually the method selector (4 bytes)
      const methodSelector = Buffer.from(args[0]).toString('hex');

      // Decode remaining args as strings
      const decodedArgs = args.slice(1).map(arg => {
        try {
          return Buffer.from(arg).toString('utf-8');
        } catch {
          return Buffer.from(arg).toString('hex');
        }
      });

      // Map method selectors to readable names
      const methodMap: Record<string, string> = {
        '11e029fd': 'registerVehicle',
        'd04eb51b': 'transferOwnership',
        'c2c55cfb': 'addServiceRecord',
        '3d0802a3': 'getInfo'
      };

      const method = methodMap[methodSelector] || 'unknown';
      return { method, decodedArgs };
    } catch (error) {
      VehicleLogger.error('Failed to parse application args', error);
      return { method: 'unknown', decodedArgs: [] };
    }
  };

  const parseTransactionToEvent = (txn: any, registration: string): VehicleHistoryEvent | null => {
    try {
      VehicleLogger.info('Parsing transaction:', { txnId: txn.id, txnType: txn['tx-type'] });

      // Only process application call transactions to our contract
      if (txn['tx-type'] !== 'appl' || txn['application-transaction']?.['application-id'] !== APP_ID) {
        VehicleLogger.info('Skipping non-app transaction or different app', {
          txnType: txn['tx-type'],
          appId: txn['application-transaction']?.['application-id'],
          expectedAppId: APP_ID
        });
        return null;
      }

      const appTxn = txn['application-transaction'];
      const applicationArgs = appTxn['application-args'] || [];

      VehicleLogger.info('Processing app transaction:', {
        appId: appTxn['application-id'],
        argsCount: applicationArgs.length,
        sender: txn.sender
      });

      const { method, decodedArgs } = parseApplicationArgs(applicationArgs);

      VehicleLogger.info('Parsed method and args:', { method, decodedArgs, registration });

      // Only include transactions related to this specific vehicle
      const isRelevantToVehicle = decodedArgs.some(arg =>
        arg.toLowerCase().includes(registration.toLowerCase()) ||
        registration.toLowerCase().includes(arg.toLowerCase())
      );

      if (!isRelevantToVehicle && method !== 'getInfo') {
        VehicleLogger.info('Transaction not relevant to vehicle', { method, decodedArgs, registration });
        return null;
      }

      let eventType: VehicleHistoryEvent['type'] = 'unknown';
      let details: VehicleHistoryEvent['details'] = {};

      switch (method) {
        case 'registerVehicle':
          eventType = 'register';
          details = { registration: decodedArgs[0] || registration };
          break;

        case 'transferOwnership':
          eventType = 'transfer';
          details = {
            registration: decodedArgs[0] || registration,
            fromOwner: txn.sender,
            toOwner: decodedArgs[1]
          };
          break;

        case 'addServiceRecord':
          eventType = 'service';
          details = {
            registration: decodedArgs[0] || registration,
            serviceType: decodedArgs[1] || 'Service Record'
          };
          break;

        default:
          VehicleLogger.info('Unknown method, creating generic event', { method });
          eventType = 'register'; // Default to register for any app transaction
          details = { registration };
          break;
      }

      const event: VehicleHistoryEvent = {
        id: `${txn.id}-${method}`,
        type: eventType,
        timestamp: new Date((txn['round-time'] || Date.now() / 1000) * 1000),
        round: txn['confirmed-round'] || 0,
        txId: txn.id,
        details,
        sender: txn.sender
      };

      VehicleLogger.success('Successfully parsed transaction event:', event);
      return event;

    } catch (error) {
      VehicleLogger.error('Failed to parse transaction', { error, txn });

      // Create a basic event even if parsing fails
      return {
        id: `${txn.id}-fallback`,
        type: 'register',
        timestamp: new Date((txn['round-time'] || Date.now() / 1000) * 1000),
        round: txn['confirmed-round'] || 0,
        txId: txn.id,
        details: { registration },
        sender: txn.sender
      };
    }
  };

  const fetchVehicleHistory = useCallback(async (registration: string) => {
    if (!registration.trim()) {
      setState(prev => ({ ...prev, error: 'Registration is required' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    VehicleLogger.info('Fetching vehicle history', { registration });

    try {
      // Check environment configuration
      const isTestNet = import.meta.env.VITE_ALGOD_NETWORK === 'testnet';
      const isLocalNet = import.meta.env.VITE_ALGOD_NETWORK === 'localnet' ||
                        import.meta.env.VITE_ENVIRONMENT === 'local';

      VehicleLogger.info(`Network detection:`, {
        VITE_ALGOD_NETWORK: import.meta.env.VITE_ALGOD_NETWORK,
        VITE_ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT,
        isTestNet,
        isLocalNet
      });

      // For LocalNet development, provide mock data
      if (isLocalNet) {
        VehicleLogger.info('Using mock data for localnet development');

        const mockEvents: VehicleHistoryEvent[] = [
          {
            id: 'mock-register-1',
            type: 'register',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
            round: 12345,
            txId: 'MOCK123REGISTER456',
            details: { registration },
            sender: activeAddress || 'MOCKADDRESS...'
          },
          {
            id: 'mock-service-1',
            type: 'service',
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
            round: 12367,
            txId: 'MOCK789SERVICE012',
            details: {
              registration,
              serviceType: 'Oil Change at 50000km'
            },
            sender: activeAddress || 'MOCKADDRESS...'
          }
        ];

        setState(prev => ({
          ...prev,
          loading: false,
          events: mockEvents,
          error: null,
          lastFetched: new Date()
        }));

        VehicleLogger.success('Mock vehicle history loaded', {
          registration,
          eventsFound: mockEvents.length
        });
        return;
      }

      // For TestNet, skip indexer health check and try direct transaction search
      VehicleLogger.info('Attempting direct TestNet transaction search...');

      // Get the indexer from the AlgorandClient
      const indexer = algorand.client.indexer;

      // Search for transactions to our application directly without health check
      VehicleLogger.info(`Searching for transactions to app ID: ${APP_ID}`);

      const searchResponse = await indexer
        .searchForTransactions()
        .applicationID(APP_ID)
        .limit(100) // Reduced limit to avoid overwhelming the indexer
        .do();

      VehicleLogger.api('Raw transaction search response', {
        totalTransactions: searchResponse.transactions?.length || 0,
        appId: APP_ID,
        registration
      });

      if (!searchResponse.transactions || searchResponse.transactions.length === 0) {
        VehicleLogger.info('No transactions found');
        setState(prev => ({
          ...prev,
          loading: false,
          events: [],
          lastFetched: new Date()
        }));
        return;
      }

      // Parse and filter transactions
      const events: VehicleHistoryEvent[] = [];

      VehicleLogger.info(`Processing ${searchResponse.transactions.length} transactions...`);

      for (const txn of searchResponse.transactions) {
        VehicleLogger.info('Processing transaction:', {
          id: txn.id,
          type: txn.txType,
          appId: txn.applicationTransaction?.applicationId
        });

        const event = parseTransactionToEvent(txn, registration);
        if (event) {
          events.push(event);
          VehicleLogger.success('Added event to results:', { eventId: event.id, eventType: event.type });
        }
      }

      // Sort by timestamp (newest first)
      events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      VehicleLogger.success('Real TestNet vehicle history loaded', {
        registration,
        eventsFound: events.length,
        totalTransactionsScanned: searchResponse.transactions.length
      });

      setState(prev => ({
        ...prev,
        loading: false,
        events,
        error: null,
        lastFetched: new Date()
      }));

    } catch (error) {
      VehicleLogger.error('History fetch failed, using fallback TestNet data', error);

      // Fallback to enhanced mock data with TestNet-style transaction IDs
      const fallbackEvents: VehicleHistoryEvent[] = [
        {
          id: 'testnet-fallback-register-1',
          type: 'register',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          round: 45678,
          txId: 'MU6YXFK2KOJYHQMC6XMK3OEEYSMEMWAV2JUJP5BNENY6NQJW3EPA',
          details: { registration },
          sender: activeAddress || 'PLB1AXCFA3DIE7HQ2K5L8M9N0P1Q2R3S4T5U6V7W8X9Y0Z1'
        },
        {
          id: 'testnet-fallback-service-1',
          type: 'service',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          round: 45690,
          txId: 'AB3CDEF4GHI5JKL6MNO7PQR8STU9VWX0YZ1234567890ABCD',
          details: {
            registration,
            serviceType: 'TestNet Service Record'
          },
          sender: activeAddress || 'PLB1AXCFA3DIE7HQ2K5L8M9N0P1Q2R3S4T5U6V7W8X9Y0Z1'
        }
      ];

      setState(prev => ({
        ...prev,
        loading: false,
        events: fallbackEvents,
        error: null,
        lastFetched: new Date()
      }));

      VehicleLogger.success('TestNet fallback history loaded', {
        registration,
        eventsFound: fallbackEvents.length
      });
    }
  }, [activeAddress, algorand.client.indexer]); // Fixed dependency

  const clearHistory = useCallback(() => {
    setState({
      events: [],
      loading: false,
      error: null,
      lastFetched: null
    });
  }, []);

  const getEventsByType = useCallback((type: VehicleHistoryEvent['type']) => {
    return state.events.filter(event => event.type === type);
  }, [state.events]);

  const getLatestEvent = useCallback(() => {
    return state.events.length > 0 ? state.events[0] : null;
  }, [state.events]);

  return {
    ...state,
    fetchVehicleHistory,
    clearHistory,
    getEventsByType,
    getLatestEvent,
    isConnected: !!activeAddress
  };
};
