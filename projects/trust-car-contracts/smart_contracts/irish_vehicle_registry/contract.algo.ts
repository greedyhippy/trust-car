// contract.algo.ts - Enhanced Irish Vehicle Registry (Demo Version)
import { Contract } from '@algorandfoundation/algorand-typescript'

export class IrishVehicleRegistry extends Contract {
  // Register a new vehicle with enhanced validation
  public registerVehicle(registration: string): string {
    // For demo: Return different message for already "registered" vehicles
    // In production, this would check actual blockchain state
    if (registration === '12D12345' || registration === '13C98876') {
      return `Error: Vehicle ${registration} is already registered`
    }
    return `Vehicle ${registration} registered successfully`
  }

  // Transfer ownership with validation
  public transferOwnership(registration: string, newOwner: string): string {
    // Demo validation: check if vehicle "exists" (simulate state check)
    const knownVehicles = ['12D12345', '13C98876', '14L56789', '16WX7890', '21G99999', '23G97531', '24G54321']
    if (!knownVehicles.includes(registration)) {
      return `Error: Vehicle ${registration} not found`
    }
    return `${registration} ownership transferred to ${newOwner}`
  }

  // Add service record with enhanced validation
  public addServiceRecord(registration: string, serviceType: string): string {
    // Demo validation: check if vehicle "exists"
    const knownVehicles = ['12D12345', '13C98876', '14L56789', '16WX7890', '21G99999', '23G97531', '24L86420']
    if (!knownVehicles.includes(registration)) {
      return `Error: Vehicle ${registration} not found`
    }

    // Demo ownership check (simulate checking caller is owner)
    // In production, this would verify txn.sender against stored owner
    if (registration === '12D12345') {
      return `Error: Only owner can add service records for ${registration}`
    }

    return `Service record '${serviceType}' added for ${registration}`
  }

  // Check if vehicle is registered (new method for frontend)
  public isVehicleRegistered(registration: string): boolean {
    const knownVehicles = ['12D12345', '13C98876', '14L56789', '16WX7890', '21G99999', '23G97531', '24G54321']
    return knownVehicles.includes(registration)
  }

  // Get info
  public getInfo(): string {
    return 'Irish Vehicle Registry v2.0 - Enhanced Demo with Validation'
  }
}
