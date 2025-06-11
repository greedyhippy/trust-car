// src/hooks/useVehicleHistory.ts
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
  const algorand = AlgorandClient.fromConfig({ algodConfig });

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
      // Only process application call transactions to our contract
      if (txn.txType !== 'appl' || txn.applicationTransaction?.applicationId !== APP_ID) {
        return null;
      }

      const appTxn = txn.applicationTransaction;
      const { method, decodedArgs } = parseApplicationArgs(appTxn.applicationArgs || []);

      // Only include transactions related to this specific vehicle
      const isRelevantToVehicle = decodedArgs.some(arg =>
        arg.includes(registration) || registration.includes(arg)
      );

      if (!isRelevantToVehicle && method !== 'getInfo') {
        return null;
      }

      let eventType: VehicleHistoryEvent['type'] = 'unknown';
      let details: VehicleHistoryEvent['details'] = {};

      switch (method) {
        case 'registerVehicle':
          eventType = 'register';
          details = { registration: decodedArgs[0] };
          break;

        case 'transferOwnership':
          eventType = 'transfer';
          details = {
            registration: decodedArgs[0],
            fromOwner: txn.sender,
            toOwner: decodedArgs[1]
          };
          break;

        case 'addServiceRecord':
          eventType = 'service';
          details = {
            registration: decodedArgs[0],
            serviceType: decodedArgs[1]
          };
          break;

        default:
          return null;
      }

      return {
        id: `${txn.id}-${method}`,
        type: eventType,
        timestamp: new Date(txn.roundTime * 1000),
        round: txn.confirmedRound,
        txId: txn.id,
        details,
        sender: txn.sender
      };
    } catch (error) {
      VehicleLogger.error('Failed to parse transaction', { error, txn });
      return null;
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
      // Check if we're on localnet
      const networkName = algodConfig.network || 'localnet';

      if (networkName === 'localnet' || networkName === '') {
        // For localnet development, provide mock data
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

      // For TestNet/MainNet, try to use real indexer
      let indexer;
      try {
        indexer = algorand.client.indexer;
      } catch (indexerError) {
        throw new Error('Indexer not available - transaction history requires TestNet or MainNet deployment');
      }

      if (!indexer) {
        throw new Error('Indexer not configured - transaction history requires TestNet or MainNet');
      }

      // Search for transactions to our application
      const searchResponse = await indexer
        .searchForTransactions()
        .applicationID(APP_ID)
        .limit(1000)
        .do();

      VehicleLogger.api('Raw transaction search response', {
        totalTransactions: searchResponse.transactions?.length || 0
      });

      if (!searchResponse.transactions) {
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

      for (const txn of searchResponse.transactions) {
        const event = parseTransactionToEvent(txn, registration);
        if (event) {
          events.push(event);
        }
      }

      // Sort by timestamp (newest first)
      events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      VehicleLogger.success('Vehicle history loaded', {
        registration,
        eventsFound: events.length
      });

      setState(prev => ({
        ...prev,
        loading: false,
        events,
        error: null,
        lastFetched: new Date()
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch history';
      VehicleLogger.error('History fetch failed', error);

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
    }
  }, [algodConfig.network, activeAddress]);

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
