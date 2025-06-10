// smart_contracts/irish_vehicle_registry/deploy-config.ts
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { IrishVehicleRegistryFactory } from '../artifacts/irish_vehicle_registry/IrishVehicleRegistryClient'

export async function deploy() {
  console.log('=== Deploying Irish Vehicle Registry ===')

  const algorand = AlgorandClient.fromEnvironment()
  const deployer = await algorand.account.fromEnvironment('DEPLOYER')

  const factory = algorand.client.getTypedAppFactory(IrishVehicleRegistryFactory, {
    defaultSender: deployer.addr,
  })

  const { appClient, result } = await factory.deploy({
    onUpdate: 'append',
    onSchemaBreak: 'append'
  })

  console.log(`✅ Irish Vehicle Registry deployed!`)
  console.log(`App ID: ${appClient.appClient.appId}`)
  console.log(`App Address: ${appClient.appAddress}`)

  // Test the contract with a simple call
  const response = await appClient.send.registerVehicle({
    args: {
      registration: 'TEST123'
    },
  })

  console.log(`Test registration response: ${response.return}`)

  return {
    appId: appClient.appClient.appId,
    appAddress: appClient.appAddress,
    deployer: deployer.addr,
  }
}
