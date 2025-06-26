// manual-deploy.ts - Manual deployment script for enhanced contract
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { IrishVehicleRegistryFactory } from './smart_contracts/artifacts/irish_vehicle_registry/IrishVehicleRegistryClient'

async function manualDeploy() {
  console.log('🚀 Starting manual deployment of enhanced Irish Vehicle Registry...')

  try {
    const algorand = AlgorandClient.fromEnvironment()
    const deployer = await algorand.account.fromEnvironment('DEPLOYER')

    console.log(`📝 Deployer address: ${deployer.addr}`)

    const factory = algorand.client.getTypedAppFactory(IrishVehicleRegistryFactory, {
      defaultSender: deployer.addr,
    })

    console.log('📦 Deploying contract...')
    const { appClient, result } = await factory.deploy({
      onUpdate: 'append',
      onSchemaBreak: 'append'
    })

    console.log('✅ Enhanced Irish Vehicle Registry deployed successfully!')
    console.log(`📱 App ID: ${appClient.appClient.appId}`)
    console.log(`🏠 App Address: ${appClient.appAddress}`)
    console.log(`💰 Deployer: ${deployer.addr}`)

    // Test the enhanced contract with different scenarios
    console.log('\n🧪 Testing enhanced contract functionality...')

    // Test 1: Register a new vehicle
    console.log('Test 1: Registering new vehicle (24G54321)...')
    const registerResponse = await appClient.send.registerVehicle({
      args: { registration: '24G54321' }
    })
    console.log(`Response: ${registerResponse.return}`)

    // Test 2: Try to register an already "registered" vehicle (should fail)
    console.log('Test 2: Attempting to register already registered vehicle (12D12345)...')
    const duplicateResponse = await appClient.send.registerVehicle({
      args: { registration: '12D12345' }
    })
    console.log(`Response: ${duplicateResponse.return}`)

    // Test 3: Add service record for existing vehicle
    console.log('Test 3: Adding service record for valid vehicle (13C98876)...')
    const serviceResponse = await appClient.send.addServiceRecord({
      args: {
        registration: '13C98876',
        serviceType: 'Oil Change'
      }
    })
    console.log(`Response: ${serviceResponse.return}`)

    // Test 4: Try to add service record for non-existent vehicle
    console.log('Test 4: Attempting service record for non-existent vehicle (XX1234)...')
    const invalidServiceResponse = await appClient.send.addServiceRecord({
      args: {
        registration: 'XX1234',
        serviceType: 'Brake Service'
      }
    })
    console.log(`Response: ${invalidServiceResponse.return}`)

    console.log('\n🎉 Deployment and testing completed!')
    console.log('\n📋 UPDATE YOUR FRONTEND:')
    console.log(`   Update APP_ID in constants/index.ts to: ${appClient.appClient.appId}n`)

    return {
      appId: appClient.appClient.appId,
      appAddress: appClient.appAddress,
      deployer: deployer.addr,
    }

  } catch (error) {
    console.error('❌ Deployment failed:', error)
    throw error
  }
}

// Run the deployment
if (require.main === module) {
  manualDeploy()
    .then((result) => {
      console.log('\n✅ Deployment successful!')
      console.log(JSON.stringify(result, null, 2))
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Deployment failed:', error)
      process.exit(1)
    })
}

export { manualDeploy }
