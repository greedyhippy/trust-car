import { Contract } from '@algorandfoundation/algorand-typescript'

export class IrishVehicleRegistry extends Contract {
  hello(name: string): string {
    return `Hello, ${name}`
  }
}
