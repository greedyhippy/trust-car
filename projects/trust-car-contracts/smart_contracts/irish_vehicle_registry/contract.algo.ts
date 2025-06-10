// contract.algo.ts - Irish Vehicle Registry (Simple Demo)
import { Contract } from '@algorandfoundation/algorand-typescript'

export class IrishVehicleRegistry extends Contract {
  // Register a new vehicle
  public registerVehicle(registration: string): string {
    return `Vehicle ${registration} registered`
  }

  // Transfer ownership
  public transferOwnership(registration: string, newOwner: string): string {
    return `${registration} transferred to ${newOwner}`
  }

  // Add service record
  public addServiceRecord(registration: string, serviceType: string): string {
    return `Service ${serviceType} recorded for ${registration}`
  }

  // Get info
  public getInfo(): string {
    return 'Irish Vehicle Registry v1.0'
  }
}
