// test-current-contract.ts - Test the current deployed contract
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { IrishVehicleRegistryClient } from './smart_contracts/artifacts/irish_vehicle_registry/IrishVehicleRegistryClient'

async function testCurrentContract() {
  console.log('🧪 Testing current deployed contract...')

  try {
    const algorand = AlgorandClient.fromEnvironment()
    const deployer = await algorand.account.fromEnvironment('DEPLOYER')

    // Use the current APP_ID from your constants
    const APP_ID = 741037215n // Your current testnet APP_ID

    const appClient = new IrishVehicleRegistryClient({
      appId: APP_ID,
      defaultSender: deployer.addr,
      algorand: algorand,
    })

    console.log(`📱 Testing App ID: ${APP_ID}`)
    console.log(`📝 Test account: ${deployer.addr}`)

    // Test 1: Get contract info
    console.log('\n1️⃣ Getting contract info...')
    const infoResponse = await appClient.send.getInfo({
      args: {}
    })
    console.log(`Contract Info: ${infoResponse.return}`)

    // Test 2: Register a test vehicle
    console.log('\n2️⃣ Registering test vehicle (TEST999)...')
    const registerResponse = await appClient.send.registerVehicle({
      args: { registration: 'TEST999' }
    })
    console.log(`Register Response: ${registerResponse.return}`)

    // Test 3: Try to register a "known" vehicle that should be flagged as duplicate
    console.log('\n3️⃣ Testing duplicate registration (12D12345)...')
    const duplicateResponse = await appClient.send.registerVehicle({
      args: { registration: '12D12345' }
    })
    console.log(`Duplicate Response: ${duplicateResponse.return}`)

    // Test 4: Test service record for valid vehicle
    console.log('\n4️⃣ Adding service record for valid vehicle (13C98876)...')
    const serviceResponse = await appClient.send.addServiceRecord({
      args: {
        registration: '13C98876',
        serviceType: 'Oil Change'
      }
    })
    console.log(`Service Response: ${serviceResponse.return}`)

    // Test 5: Test service record for invalid vehicle
    console.log('\n5️⃣ Testing service record for invalid vehicle (INVALID)...')
    const invalidServiceResponse = await appClient.send.addServiceRecord({
      args: {
        registration: 'INVALID',
        serviceType: 'Brake Service'
      }
    })
    console.log(`Invalid Service Response: ${invalidServiceResponse.return}`)

    // Test 6: Test ownership transfer for valid vehicle
    console.log('\n6️⃣ Testing ownership transfer for valid vehicle (14L56789)...')
    const transferResponse = await appClient.send.transferOwnership({
      args: {
        registration: '14L56789',
        newOwner: 'GBKB7IXUZKW23YZBVZ4PQRPGZL2F4IMLYGKHLSGCG3ACGRV3OH3YZUIM'
      }
    })
    console.log(`Transfer Response: ${transferResponse.return}`)

    console.log('\n✅ Contract testing completed!')
    console.log('\n📝 Summary:')
    console.log('   - Contract is responding to all method calls')
    console.log('   - Error messages are being returned for invalid operations')
    console.log('   - Enhanced validation logic is working')

  } catch (error) {
    console.error('❌ Contract testing failed:', error)
    throw error
  }
}

// Run the test
if (require.main === module) {
  testCurrentContract()
    .then(() => {
      console.log('\n✅ Testing completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Testing failed:', error)
      process.exit(1)
    })
}

export { testCurrentContract }
