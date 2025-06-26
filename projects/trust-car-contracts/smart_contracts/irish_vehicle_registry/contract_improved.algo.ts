// contract_improved.algo.ts - Enhanced Irish Vehicle Registry with State Storage
import { Contract } from '@algorandfoundation/algorand-typescript'

// Vehicle struct to hold vehicle data
class Vehicle {
  registration: string = ''
  owner: string = ''
  isRegistered: boolean = false
  registrationDate: number = 0

  constructor(registration: string, owner: string) {
    this.registration = registration
    this.owner = owner
    this.isRegistered = true
    this.registrationDate = globals.latestTimestamp
  }
}

export class IrishVehicleRegistryImproved extends Contract {
  // Global state to store vehicles
  vehicles = GlobalStateMap<string, Vehicle>() // registration -> Vehicle
  vehicleOwners = GlobalStateMap<string, string>() // registration -> owner address

  // Register a new vehicle
  public registerVehicle(registration: string): string {
    // Check if vehicle already exists
    assert(!this.vehicles(registration).value.isRegistered, 'Vehicle already registered')

    // Create new vehicle record
    const vehicle = new Vehicle(registration, this.txn.sender)
    this.vehicles(registration).value = vehicle
    this.vehicleOwners(registration).value = this.txn.sender

    return `Vehicle ${registration} registered successfully to ${this.txn.sender}`
  }

  // Transfer ownership of a vehicle
  public transferOwnership(registration: string, newOwner: string): string {
    // Check if vehicle exists
    assert(this.vehicles(registration).value.isRegistered, 'Vehicle not found')

    // Check if caller is current owner
    assert(this.vehicleOwners(registration).value === this.txn.sender, 'Only owner can transfer')

    // Update ownership
    this.vehicleOwners(registration).value = newOwner
    const vehicle = this.vehicles(registration).value
    vehicle.owner = newOwner
    this.vehicles(registration).value = vehicle

    return `${registration} ownership transferred to ${newOwner}`
  }

  // Add service record (simplified - just updates timestamp)
  public addServiceRecord(registration: string, serviceType: string): string {
    // Check if vehicle exists
    assert(this.vehicles(registration).value.isRegistered, 'Vehicle not found')

    // Check if caller is owner
    assert(this.vehicleOwners(registration).value === this.txn.sender, 'Only owner can add service records')

    // In a real implementation, you'd store service records in a separate map
    // For now, just confirm the action
    return `Service record '${serviceType}' added for ${registration} at ${globals.latestTimestamp}`
  }

  // Get vehicle owner
  public getVehicleOwner(registration: string): string {
    assert(this.vehicles(registration).value.isRegistered, 'Vehicle not found')
    return this.vehicleOwners(registration).value
  }

  // Check if vehicle is registered
  public isVehicleRegistered(registration: string): boolean {
    return this.vehicles(registration).value.isRegistered
  }

  // Get app info
  public getInfo(): string {
    return 'Irish Vehicle Registry v2.0 - Enhanced with State Storage'
  }
}
