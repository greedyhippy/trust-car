// src/constants/index.ts
export const APP_ID = 741037215; // TestNet APP_ID
export const API_BASE_URL = 'https://irish-vehicle-registry-api.vercel.app';

export const SERVICE_TYPES = [
  { value: 'oil-change', label: 'Oil Change' },
  { value: 'tire-rotation', label: 'Tire Rotation' },
  { value: 'brake-service', label: 'Brake Service' },
  { value: 'general-maintenance', label: 'General Maintenance' },
  { value: 'major-service', label: 'Major Service' },
] as const;

export const TEST_VEHICLES = [
  { registration: '21G99999', description: 'Tesla Model 3' },
  { registration: '12D12345', description: 'Toyota Corolla' },
  { registration: '24L86420', description: 'BMW iX3' },
  { registration: '16WX7890', description: 'Peugeot 308' },
  { registration: '23G97531', description: 'Lexus IS300h' },
] as const;

export const TRANSACTION_WAIT_ROUNDS = 4;
