// src/components/VehicleManagerRefactored.tsx
import React, { useState } from 'react';
import { useVehicleSearch } from '../hooks/useVehicleSearch';
import { useSimpleBlockchain as useBlockchainTransaction } from '../hooks/useSimpleBlockchain';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ErrorMessage } from './common/ErrorMessage';
import { SuccessMessage } from './common/SuccessMessage';
import { VehicleHistory } from './VehicleHistoryNew';
import { TransactionHistory } from './TransactionHistory';
import ConnectWallet from './ConnectWallet';
import { AVAILABLE_VEHICLES, SERVICE_TYPES, VEHICLE_CONDITIONS } from '../constants';
import { BlockchainAction } from '../types/blockchain';
import { VehicleLogger } from '../utils/logger';
import trustCarLogo from '../assets/trustcar-logo.svg';

export const VehicleManager: React.FC = () => {
  const [registration, setRegistration] = useState('');
  const [activeAction, setActiveAction] = useState<BlockchainAction | null>(null);
  const [newOwner, setNewOwner] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [serviceMileage, setServiceMileage] = useState('');
  const [serviceCondition, setServiceCondition] = useState('');
  const [showServiceMode, setShowServiceMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [openWalletModal, setOpenWalletModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentTutorialStep, setCurrentTutorialStep] = useState(0);
  const [showWelcomeHint, setShowWelcomeHint] = useState(true);

  // Tutorial Steps
  const tutorialSteps = [
    {
      title: "Welcome to TrustCar! 🚗",
      content: (
        <div>
          <p><strong>TrustCar</strong> is a blockchain-powered vehicle management system built on Algorand.</p>
          <p>This demo will show you how to:</p>
          <ul>
            <li>🔍 Search for vehicle information</li>
            <li>📝 Register vehicles on the blockchain</li>
            <li>🔄 Transfer ownership between parties</li>
            <li>🔧 Add service records as a service provider</li>
          </ul>
          <p>Let's get started with the guided tour!</p>
        </div>
      )
    },
    {
      title: "Step 1: Connect Your Wallet 🔗",
      content: (
        <div>
          <p>First, you need to connect a <strong>TestNet wallet</strong> to interact with the blockchain.</p>
          <p><strong>Options:</strong></p>
          <ul>
            <li><strong>Pera Wallet:</strong> Mobile app with TestNet support</li>
            <li><strong>Defly Wallet:</strong> Browser extension</li>
          </ul>
          <p><strong>⚠️ Important:</strong> Make sure your wallet is set to <em>TestNet</em> mode, not MainNet!</p>
          <p>Click the "Connect Wallet" button to proceed.</p>
        </div>
      )
    },
    {
      title: "Step 2: Search for a Vehicle 🔍",
      content: (
        <div>
          <p>Try searching for a vehicle using an Irish registration number.</p>
          <p><strong>Demo vehicles available:</strong></p>
          <ul style={{ fontSize: '14px', maxHeight: '150px', overflowY: 'auto' }}>
            {AVAILABLE_VEHICLES.slice(0, 5).map(v => (
              <li key={v.registration}><code>{v.registration}</code> - {v.description}</li>
            ))}
            <li><em>...and {AVAILABLE_VEHICLES.length - 5} more!</em></li>
          </ul>
          <p>Use the dropdown to select a vehicle or type directly in the license plate field.</p>
        </div>
      )
    },
    {
      title: "Step 3: Vehicle Owner Mode 👤",
      content: (
        <div>
          <p>As a <strong>Vehicle Owner</strong>, you can:</p>
          <ul>
            <li><strong>📝 Register Vehicle:</strong> Record your vehicle permanently on the Algorand blockchain</li>
            <li><strong>🔄 Transfer Ownership:</strong> Transfer your vehicle to another wallet address</li>
          </ul>
          <p><strong>Registration Process:</strong></p>
          <ol>
            <li>Search for your vehicle</li>
            <li>Click "Register Vehicle"</li>
            <li>Confirm the transaction in your wallet</li>
          </ol>
          <p>The blockchain will store an immutable record of ownership!</p>
        </div>
      )
    },
    {
      title: "Step 4: Service Provider Mode 🔧",
      content: (
        <div>
          <p>Switch to <strong>Service Provider</strong> mode to add service records.</p>
          <p><strong>Available service types:</strong></p>
          <ul style={{ fontSize: '14px', maxHeight: '120px', overflowY: 'auto' }}>
            {SERVICE_TYPES.map(type => (
              <li key={type.value}><strong>{type.label}</strong></li>
            ))}
          </ul>
          <p><strong>Process:</strong></p>
          <ol>
            <li>Select service type</li>
            <li>Enter current mileage</li>
            <li>For maintenance services, select vehicle condition</li>
            <li>Submit to blockchain</li>
          </ol>
        </div>
      )
    },
    {
      title: "Step 5: Transaction History 📜",
      content: (
        <div>
          <p>View the complete transaction history for any vehicle:</p>
          <ul>
            <li><strong>🔍 Search Results:</strong> View vehicle details and photos</li>
            <li><strong>⛓️ Blockchain Records:</strong> See all on-chain transactions</li>
            <li><strong>📜 Service History:</strong> Complete maintenance timeline</li>
          </ul>
          <p>Click the "Transaction History" tab after searching for a vehicle.</p>
          <p><strong>Pro Tip:</strong> All data is stored immutably on Algorand - no one can tamper with the records!</p>
        </div>
      )
    },
    {
      title: "You're Ready! 🎉",
      content: (
        <div>
          <p><strong>Congratulations!</strong> You now know how to use TrustCar.</p>
          <p><strong>Key Benefits:</strong></p>
          <ul>
            <li>🔒 <strong>Immutable Records:</strong> Blockchain prevents fraud</li>
            <li>🌐 <strong>Decentralized:</strong> No single point of failure</li>
            <li>📱 <strong>Mobile-First:</strong> Works on any device</li>
            <li>💡 <strong>Transparent:</strong> All transactions are public</li>
          </ul>
          <p>Start exploring by connecting your wallet and searching for a vehicle!</p>
          <p><em>Need help? Click the purple help button (?) anytime.</em></p>
        </div>
      )
    }
  ];

  const nextTutorialStep = () => {
    if (currentTutorialStep < tutorialSteps.length - 1) {
      setCurrentTutorialStep(currentTutorialStep + 1);
    } else {
      setShowTutorial(false);
      setCurrentTutorialStep(0);
    }
  };

  const prevTutorialStep = () => {
    if (currentTutorialStep > 0) {
      setCurrentTutorialStep(currentTutorialStep - 1);
    }
  };

  const { vehicleData, loading: searchLoading, error: searchError, searchVehicle } = useVehicleSearch();
  const {
    loading: txLoading,
    error: txError,
    result: txResult,
    registerVehicle,
    transferOwnership,
    addServiceRecord,
    isWalletConnected,
    walletAddress
  } = useBlockchainTransaction();

  const handleSearch = async () => {
    if (!registration.trim()) return;
    await searchVehicle(registration);
  };

  const handleExecuteAction = async () => {
    if (!vehicleData || !activeAction) return;

    let success = false;

    switch (activeAction) {
      case 'register':
        success = await registerVehicle(vehicleData.registration);
        break;

      case 'transfer':
        if (!newOwner.trim()) {
          return; // The validation error will be handled by the blockchain hook
        }
        success = await transferOwnership(vehicleData.registration, newOwner);
        if (success) setNewOwner('');
        break;
    }

    if (success) {
      setActiveAction(null);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;700&display=swap');

        :root {
          --automotive-black: #0d0d0d;
          --automotive-grey: #1a1a1a;
          --automotive-silver: #c4c4c4;
          --automotive-gold: #d4af37;
          --automotive-blue: #1e3a8a;
          --automotive-red: #dc2626;
          --automotive-green: #16a34a;
          --gradient-dark: linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 50%, #2d2d2d 100%);
          --gradient-luxury: linear-gradient(135deg, #1a1a1a 0%, #d4af37 100%);
          --gradient-chrome: linear-gradient(135deg, #e5e7eb 0%, #9ca3af 50%, #6b7280 100%);
        }

        * {
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--automotive-black);
          color: white;
          margin: 0;
          padding: 0;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { transform: translateX(-30px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes shine {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes engineHum {
          0%, 100% { box-shadow: 0 0 20px rgba(212, 175, 55, 0.3); }
          50% { box-shadow: 0 0 40px rgba(212, 175, 55, 0.6); }
        }
        @keyframes chromeReflection {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .fade-in {
          animation: fadeIn 0.8s ease-out;
        }
        .slide-in {
          animation: slideIn 0.6s ease-out;
        }
        .pulse {
          animation: pulse 3s ease-in-out infinite;
        }

        .automotive-hero {
          background: var(--gradient-dark);
          position: relative;
          overflow: hidden;
          border-bottom: 3px solid var(--automotive-gold);
        }

        .automotive-hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" fill="%23d4af37" opacity="0.05"><path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"/><path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"/><path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"/></svg>') no-repeat center bottom;
          background-size: 120% 100px;
          pointer-events: none;
        }

        .automotive-card {
          background: linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(45, 45, 45, 0.85));
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 16px;
          backdrop-filter: blur(20px);
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(212, 175, 55, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .automotive-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.1), transparent);
          transition: left 0.6s ease;
        }

        .automotive-card:hover {
          transform: translateY(-4px);
          border-color: var(--automotive-gold);
          box-shadow:
            0 16px 48px rgba(0, 0, 0, 0.6),
            0 0 0 1px var(--automotive-gold),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          animation: engineHum 2s ease-in-out infinite;
        }

        .automotive-card:hover::before {
          left: 100%;
        }

        .luxury-button {
          background: var(--gradient-luxury);
          border: none;
          color: white;
          padding: 16px 32px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          font-size: 16px;
          font-family: 'Inter', sans-serif;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          box-shadow:
            0 4px 16px rgba(212, 175, 55, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .luxury-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.6s ease;
        }

        .luxury-button:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow:
            0 8px 24px rgba(212, 175, 55, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        .luxury-button:hover::before {
          left: 100%;
        }

        .luxury-button:active {
          transform: translateY(0) scale(0.98);
        }

        .luxury-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: 0 4px 16px rgba(212, 175, 55, 0.2);
        }

        .premium-button {
          background: linear-gradient(145deg, #1e3a8a, #1e40af);
          border: none;
          color: white;
          padding: 14px 28px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          font-size: 15px;
          font-family: 'Inter', sans-serif;
          letter-spacing: 0.3px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          box-shadow:
            0 4px 12px rgba(30, 58, 138, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .premium-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s ease;
        }

        .premium-button:hover {
          background: linear-gradient(145deg, #1e40af, #2563eb);
          transform: translateY(-2px);
          box-shadow:
            0 6px 16px rgba(30, 58, 138, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        .premium-button:hover::before {
          left: 100%;
        }

        .premium-button.active {
          background: var(--gradient-luxury);
          box-shadow:
            0 6px 20px rgba(212, 175, 55, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
          animation: engineHum 2s ease-in-out infinite;
        }

        .chrome-input {
          background: var(--gradient-chrome);
          border: 2px solid rgba(212, 175, 55, 0.3);
          border-radius: 12px;
          padding: 16px 20px;
          font-size: 16px;
          font-family: 'Inter', sans-serif;
          color: var(--automotive-black);
          font-weight: 500;
          outline: none;
          transition: all 0.3s ease;
          box-shadow:
            inset 0 2px 4px rgba(0, 0, 0, 0.1),
            0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .chrome-input:focus {
          border-color: var(--automotive-gold);
          box-shadow:
            inset 0 2px 4px rgba(0, 0, 0, 0.1),
            0 0 0 4px rgba(212, 175, 55, 0.2),
            0 4px 12px rgba(0, 0, 0, 0.2);
          transform: translateY(-1px);
        }

        .chrome-input::placeholder {
          color: rgba(13, 13, 13, 0.6);
          font-weight: 400;
        }

        .automotive-license-plate {
          display: flex;
          align-items: center;
          background: linear-gradient(145deg, #ffffff, #f8f9fa);
          border: 4px solid var(--automotive-black);
          border-radius: 12px;
          font-family: 'Inter', monospace;
          font-weight: 800;
          font-size: 22px;
          box-shadow:
            0 8px 16px rgba(0, 0, 0, 0.3),
            inset 0 2px 4px rgba(0, 0, 0, 0.1);
          height: 70px;
          min-width: 320px;
          max-width: 360px;
          overflow: hidden;
          position: relative;
          transition: all 0.3s ease;
        }

        .automotive-license-plate:hover {
          box-shadow:
            0 12px 24px rgba(0, 0, 0, 0.4),
            inset 0 2px 4px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .automotive-license-plate:focus-within {
          border-color: var(--automotive-gold);
          box-shadow:
            0 0 0 4px rgba(212, 175, 55, 0.3),
            0 12px 24px rgba(0, 0, 0, 0.4);
        }

        .automotive-section-title {
          font-family: 'Playfair Display', serif;
          font-size: 2.2rem;
          font-weight: 700;
          color: var(--automotive-gold);
          margin-bottom: 12px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          position: relative;
        }

        .automotive-section-title::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 0;
          width: 60px;
          height: 3px;
          background: var(--gradient-luxury);
          border-radius: 2px;
        }

        .automotive-subtitle {
          font-family: 'Inter', sans-serif;
          font-size: 1.1rem;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.6;
          margin-bottom: 8px;
        }

        .vehicle-showcase {
          background: linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(13, 13, 13, 0.98));
          border: 2px solid rgba(212, 175, 55, 0.3);
          border-radius: 20px;
          overflow: hidden;
          box-shadow:
            0 12px 40px rgba(0, 0, 0, 0.6),
            inset 0 1px 0 rgba(212, 175, 55, 0.1);
          transition: all 0.4s ease;
        }

        .vehicle-showcase:hover {
          border-color: var(--automotive-gold);
          box-shadow:
            0 20px 60px rgba(0, 0, 0, 0.8),
            inset 0 1px 0 rgba(212, 175, 55, 0.2);
          transform: translateY(-2px);
        }

        .vehicle-image-container {
          position: relative;
          overflow: hidden;
          border-radius: 16px;
          background: linear-gradient(135deg, #f8f9fa, #e9ecef);
        }

        .vehicle-image-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, transparent 0%, rgba(212, 175, 55, 0.1) 100%);
          pointer-events: none;
          z-index: 1;
        }

        .vehicle-image {
          width: 100%;
          height: 280px;
          object-fit: cover;
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .vehicle-image:hover {
          transform: scale(1.05);
          filter: brightness(1.1) saturate(1.1);
        }

        .dealer-badge {
          background: var(--gradient-luxury);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
        }

        .price-tag {
          background: linear-gradient(145deg, #16a34a, #15803d);
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 18px;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
          display: inline-block;
        }

        .automotive-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          padding: 20px 0;
        }

        .spec-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .spec-item {
          background: rgba(26, 26, 26, 0.6);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          transition: all 0.3s ease;
        }

        .spec-item:hover {
          border-color: var(--automotive-gold);
          background: rgba(26, 26, 26, 0.8);
          transform: translateY(-2px);
        }

        .spec-icon {
          font-size: 24px;
          margin-bottom: 8px;
          display: block;
        }

        .spec-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 4px;
        }

        .spec-value {
          font-size: 16px;
          color: white;
          font-weight: 600;
        }

        .tutorial-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(13, 13, 13, 0.95);
          backdrop-filter: blur(12px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.4s ease-out;
        }

        .tutorial-card {
          background: linear-gradient(145deg, rgba(26, 26, 26, 0.98), rgba(45, 45, 45, 0.95));
          border: 2px solid var(--automotive-gold);
          border-radius: 20px;
          padding: 40px;
          max-width: 650px;
          width: 90%;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow:
            0 25px 70px rgba(0, 0, 0, 0.8),
            inset 0 1px 0 rgba(212, 175, 55, 0.2);
          animation: slideInUp 0.5s ease-out;
          color: white;
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(40px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .step-indicator {
          display: flex;
          justify-content: center;
          margin-bottom: 30px;
          padding: 0 10px;
        }

        .step-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          margin: 0 8px;
          background: rgba(255, 255, 255, 0.3);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          border: 2px solid transparent;
        }

        .step-dot:hover {
          background: rgba(212, 175, 55, 0.5);
          transform: scale(1.2);
        }

        .step-dot.active {
          background: var(--automotive-gold);
          transform: scale(1.4);
          border-color: rgba(212, 175, 55, 0.3);
          box-shadow: 0 0 20px rgba(212, 175, 55, 0.6);
        }

        .help-button {
          background: var(--gradient-luxury);
          border: none;
          color: white;
          padding: 16px 20px;
          border-radius: 50px;
          cursor: pointer;
          font-weight: 700;
          font-size: 16px;
          letter-spacing: 0.5px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: fixed;
          bottom: 30px;
          right: 30px;
          z-index: 1000;
          box-shadow:
            0 8px 24px rgba(212, 175, 55, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          animation: pulse 3s ease-in-out infinite;
        }

        .help-button:hover {
          transform: scale(1.15);
          box-shadow:
            0 12px 32px rgba(212, 175, 55, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        .status-connected {
          background: linear-gradient(145deg, #16a34a, #15803d);
          border: 2px solid #22c55e;
          animation: engineHum 3s ease-in-out infinite;
        }

        .status-disconnected {
          background: linear-gradient(145deg, #dc2626, #b91c1c);
          border: 2px solid #ef4444;
        }

        @media (max-width: 768px) {
          .automotive-grid {
            grid-template-columns: 1fr;
          }
          .help-button {
            bottom: 20px;
            right: 20px;
            padding: 12px 16px;
          }
          .automotive-section-title {
            font-size: 1.8rem;
          }
          .automotive-license-plate {
            min-width: 280px;
            font-size: 18px;
            height: 60px;
          }
        }

        @media (max-width: 480px) {
          .tutorial-card {
            padding: 24px;
            margin: 20px;
          }
          .automotive-license-plate {
            min-width: 240px;
            font-size: 16px;
            height: 55px;
          }
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
          border-radius: 20px;
          transition: all 0.3s ease;
        }
        .glass-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 50px rgba(0, 0, 0, 0.2);
        }
        .gradient-bg {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%);
          min-height: 100vh;
        }
        .btn-modern {
          background: linear-gradient(145deg, #4CAF50, #45a049);
          border: none;
          color: white;
          padding: 14px 28px;
          border-radius: 14px;
          cursor: pointer;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
          box-shadow: 0 6px 20px rgba(76, 175, 80, 0.3);
          position: relative;
          overflow: hidden;
        }
        .btn-modern:before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }
        .btn-modern:hover:before {
          left: 100%;
        }
        .btn-modern:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(76, 175, 80, 0.4);
        }
        .btn-modern:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
        }
        .btn-action {
          background: linear-gradient(145deg, #2196F3, #1976D2);
          border: none;
          color: white;
          padding: 12px 24px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
          position: relative;
          overflow: hidden;
        }
        .btn-action:before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }
        .btn-action:hover:before {
          left: 100%;
        }
        .btn-action:hover {
          background: linear-gradient(145deg, #1976D2, #1565C0);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
        }
        .btn-action:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .btn-action.active {
          background: linear-gradient(145deg, #FF9800, #F57C00);
          box-shadow: 0 6px 20px rgba(255, 152, 0, 0.4);
          animation: glow 2s ease-in-out infinite;
        }
        .btn-help {
          background: linear-gradient(145deg, #9C27B0, #7B1FA2);
          border: none;
          color: white;
          padding: 12px 24px;
          border-radius: 50px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(156, 39, 176, 0.3);
          position: fixed;
          bottom: 30px;
          right: 30px;
          z-index: 1000;
        }
        .btn-help:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(156, 39, 176, 0.5);
        }
        .input-modern {
          padding: 16px;
          font-size: 16px;
          border: 2px solid #e3f2fd;
          border-radius: 14px;
          outline: none;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .input-modern:focus {
          border-color: #2196F3;
          box-shadow: 0 0 0 4px rgba(33, 150, 243, 0.1), 0 4px 15px rgba(0,0,0,0.1);
          transform: translateY(-1px);
        }
        .tutorial-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease-out;
        }
        .tutorial-card {
          background: white;
          border-radius: 20px;
          padding: 30px;
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          animation: slideInUp 0.4s ease-out;
          position: relative;
        }
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .step-indicator {
          display: flex;
          justify-content: center;
          margin-bottom: 25px;
          padding: 0 10px;
        }
        .step-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin: 0 6px;
          background: #e0e0e0;
          transition: all 0.3s ease;
          cursor: pointer;
          border: 2px solid transparent;
        }
        .step-dot:hover {
          background: #bdbdbd;
          transform: scale(1.1);
        }
        .step-dot.active {
          background: linear-gradient(145deg, #2196F3, #1976D2);
          transform: scale(1.3);
          border-color: rgba(33, 150, 243, 0.3);
          box-shadow: 0 0 15px rgba(33, 150, 243, 0.4);
        }
        .license-plate-input {
          display: flex;
          align-items: center;
          backgroundColor: #ffffff;
          border: 3px solid #000000;
          border-radius: 8px;
          padding: 0;
          fontFamily: 'monospace, "Courier New"';
          fontWeight: bold;
          fontSize: 20px;
          boxShadow: 0 4px 8px rgba(0,0,0,0.2), inset 0 2px 4px rgba(0,0,0,0.1);
          height: 60px;
          minWidth: 280px;
          maxWidth: 320px;
          overflow: hidden;
          position: relative;
          transition: all 0.3s ease;
        }
        .license-plate-input:hover {
          box-shadow: 0 6px 12px rgba(0,0,0,0.3), inset 0 2px 4px rgba(0,0,0,0.1);
          transform: translateY(-1px);
        }
        .license-plate-input:focus-within {
          border-color: #2196F3;
          box-shadow: 0 0 0 4px rgba(33, 150, 243, 0.2), 0 6px 12px rgba(0,0,0,0.3);
        }
        @media (max-width: 768px) {
          .grid-responsive {
            grid-template-columns: 1fr !important;
          }
          .btn-help {
            bottom: 20px;
            right: 20px;
            padding: 10px 20px;
          }
        }
      `}</style>

      <div className="gradient-bg" style={{ padding: '20px', minHeight: '100vh' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div className="fade-in" style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ marginBottom: '15px' }}>
              <img
                src={trustCarLogo}
                alt="TrustCar Logo"
                style={{
                  height: '80px',
                  maxWidth: '400px',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';
                }}
                onClick={() => {
                  setShowTutorial(true);
                  setCurrentTutorialStep(0);
                }}
                title="Click for help and tutorial"
              />
            </div>
            <p style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: '1.2rem',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              marginBottom: '10px'
            }}>
              Blockchain-Powered Vehicle Management System
            </p>
            <p style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.9rem',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              fontStyle: 'italic'
            }}>
              Built on Algorand TestNet • Immutable • Transparent • Secure
            </p>
          </div>

          {/* Welcome Hint Banner */}
          {showWelcomeHint && (
            <div className="glass-card slide-in" style={{
              marginBottom: '30px',
              padding: '20px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(33, 150, 243, 0.1))',
              border: '2px solid rgba(76, 175, 80, 0.3)',
              position: 'relative'
            }}>
              <button
                onClick={() => setShowWelcomeHint(false)}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '15px',
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#999',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#666'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#999'}
                title="Dismiss"
              >
                ×
              </button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>👋</div>
                <h3 style={{
                  color: '#2e7d32',
                  marginBottom: '10px',
                  fontSize: '1.2rem'
                }}>
                  Welcome to TrustCar Demo!
                </h3>
                <p style={{
                  color: '#555',
                  marginBottom: '15px',
                  lineHeight: '1.5'
                }}>
                  New here? Click the <strong>❓ Help</strong> button or the logo above for a guided tour.
                  Already know what you're doing? Connect your TestNet wallet and start exploring!
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      setShowTutorial(true);
                      setCurrentTutorialStep(0);
                      setShowWelcomeHint(false);
                    }}
                    style={{
                      background: 'linear-gradient(145deg, #4CAF50, #45a049)',
                      border: 'none',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    📚 Take Tutorial
                  </button>
                  <button
                    onClick={() => setShowWelcomeHint(false)}
                    style={{
                      background: 'linear-gradient(145deg, #2196F3, #1976D2)',
                      border: 'none',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    🚀 Start Exploring
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Wallet Status */}
          {!isWalletConnected ? (
            <div className="glass-card slide-in" style={{
              textAlign: 'center',
              marginBottom: '30px',
              padding: '20px',
              borderRadius: '16px'
            }}>
              <div style={{ marginBottom: '15px' }}>
                <span style={{ fontSize: '2rem', marginRight: '10px' }}>🔗</span>
                <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#333' }}>
                  Connect your TestNet wallet to get started
                </span>
              </div>
              <button
                className="btn-modern"
                onClick={() => setOpenWalletModal(true)}
              >
                Connect Wallet
              </button>
            </div>
          ) : (
            <div className="glass-card slide-in" style={{
              textAlign: 'center',
              marginBottom: '30px',
              padding: '15px',
              borderRadius: '16px',
              border: '2px solid #4CAF50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>✅</span>
                <span style={{ fontWeight: '600', color: '#2e7d32' }}>
                  Wallet Connected: {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-6)}
                </span>
              </div>
              <button
                onClick={() => setOpenWalletModal(true)}
                style={{
                  background: 'linear-gradient(145deg, #f44336, #d32f2f)',
                  border: 'none',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  const target = e.target as HTMLButtonElement;
                  target.style.background = 'linear-gradient(145deg, #d32f2f, #c62828)';
                  target.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  const target = e.target as HTMLButtonElement;
                  target.style.background = 'linear-gradient(145deg, #f44336, #d32f2f)';
                  target.style.transform = 'scale(1)';
                }}
              >
                🔄 Change Wallet
              </button>
            </div>
          )}

          {/* Search Section */}
          <div className="glass-card fade-in" style={{
            padding: '30px',
            borderRadius: '20px',
            marginBottom: '30px'
          }}>
            <h2 style={{
              fontSize: '1.8rem',
              marginBottom: '20px',
              color: '#333',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              🔍 Search Vehicle
            </h2>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center', justifyContent: 'center' }}>
              {/* European Style Irish License Plate Styled Search Bar */}
              <div className="license-plate-input">
                {/* EU Stars Strip */}
                <div style={{
                  backgroundColor: '#003f7f',
                  color: '#ffcc00',
                  width: '45px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  borderRight: '2px solid #000000'
                }}>
                  <div style={{ marginBottom: '2px' }}>★</div>
                  <div style={{ fontSize: '8px', letterSpacing: '0.5px' }}>IRL</div>
                  <div style={{ marginTop: '2px' }}>★</div>
                </div>

                {/* License Plate Input */}
                <input
                  type="text"
                  placeholder="21G99999"
                  value={registration}
                  onChange={(e) => setRegistration(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    color: '#000000',
                    fontSize: '20px',
                    fontFamily: 'monospace, "Courier New"',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    letterSpacing: '2px',
                    padding: '0 15px',
                    height: '100%'
                  }}
                  maxLength={8}
                />
              </div>

              <button
                className="btn-modern"
                onClick={handleSearch}
                disabled={!registration.trim() || searchLoading}
                style={{
                  height: '60px',
                  padding: '0 25px',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                {searchLoading ? '🔍 Searching...' : '🔍 Search'}
              </button>
            </div>

            {/* Plate Helper Text */}
            <div style={{
              textAlign: 'center',
              marginBottom: '15px',
              fontSize: '12px',
              color: '#666',
              fontStyle: 'italic'
            }}>
              📋 Enter Irish registration number (e.g., 21G99999, 12D12345)
            </div>

            {/* Vehicle Selection Dropdown */}
            <div style={{
              padding: '15px',
              backgroundColor: 'rgba(0,0,0,0.05)',
              borderRadius: '10px',
              fontSize: '14px'
            }}>
              <strong style={{ color: '#666', display: 'block', marginBottom: '10px' }}>
                Select from available vehicles ({AVAILABLE_VEHICLES.length} total):
              </strong>
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    setRegistration(e.target.value);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#2196F3';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#ddd';
                }}
              >
                <option value="" disabled>-- Choose a vehicle to lookup --</option>
                {AVAILABLE_VEHICLES.map((vehicle) => (
                  <option key={vehicle.registration} value={vehicle.registration}>
                    {vehicle.registration} - {vehicle.description}
                  </option>
                ))}
              </select>
              <div style={{
                marginTop: '8px',
                fontSize: '12px',
                color: '#888',
                fontStyle: 'italic'
              }}>
                💡 These are demo vehicles available in the test API
              </div>
            </div>

            {searchError && <ErrorMessage message={searchError} />}
          </div>

          {/* Loading State */}
          {searchLoading && <LoadingSpinner message="Searching for vehicle..." />}

          {/* Vehicle Details & Actions */}
          {vehicleData && !searchLoading && (
            <>
              {/* Tab Navigation */}
              <div className="fade-in" style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '30px'
              }}>
                <button
                  className={`btn-action ${!showHistory ? 'active' : ''}`}
                  onClick={() => setShowHistory(false)}
                >
                  📄 Vehicle Details
                </button>
                <button
                  className={`btn-action ${showHistory ? 'active' : ''}`}
                  onClick={() => setShowHistory(true)}
                >
                  📜 Transaction History
                </button>
              </div>

              {!showHistory ? (
                <div className="fade-in grid-responsive" style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '30px'
                }}>
                  {/* Vehicle Info Card */}
                  <div className="glass-card" style={{
                    padding: '30px',
                    borderRadius: '20px'
                  }}>
                    <h3 style={{
                      fontSize: '1.6rem',
                      marginBottom: '25px',
                      color: '#333',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      🚗 Vehicle Details
                    </h3>

                    {/* European Style License Plate Display */}
                    <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        backgroundColor: '#ffffff',
                        border: '3px solid #000000',
                        borderRadius: '8px',
                        padding: '0',
                        fontFamily: 'monospace, "Courier New"',
                        fontWeight: 'bold',
                        fontSize: '18px',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.2), inset 0 2px 4px rgba(0,0,0,0.1)',
                        height: '50px',
                        minWidth: '240px',
                        overflow: 'hidden'
                      }}>
                        {/* EU Stars Strip */}
                        <div style={{
                          backgroundColor: '#003f7f',
                          color: '#ffcc00',
                          width: '35px',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '8px',
                          fontWeight: 'bold',
                          borderRight: '2px solid #000000'
                        }}>
                          <div style={{ marginBottom: '1px' }}>★</div>
                          <div style={{ fontSize: '6px', letterSpacing: '0.5px' }}>IRL</div>
                          <div style={{ marginTop: '1px' }}>★</div>
                        </div>

                        {/* Registration Number */}
                        <div style={{
                          flex: 1,
                          color: '#000000',
                          fontSize: '18px',
                          fontFamily: 'monospace, "Courier New"',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          letterSpacing: '1.5px',
                          padding: '0 15px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {vehicleData.registration}
                        </div>
                      </div>
                    </div>

                    {/* Vehicle Image */}
                    {vehicleData.imageUrl && (
                      <div style={{
                        marginBottom: '30px',
                        textAlign: 'center',
                        borderRadius: '15px',
                        overflow: 'hidden',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                        backgroundColor: '#f5f5f5'
                      }}>
                        <img
                          src={vehicleData.imageUrl}
                          alt={`${vehicleData.make} ${vehicleData.model} (${vehicleData.year})`}
                          style={{
                            width: '100%',
                            maxWidth: '400px',
                            height: '250px',
                            objectFit: 'cover',
                            borderRadius: '12px',
                            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 12px 25px rgba(0,0,0,0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          onError={(e) => {
                            // Show fallback if image fails to load
                            const target = e.currentTarget;
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDQwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0yMDAgMTI1SDE2MFYxNjVIMjAwVjEyNVoiIGZpbGw9IiNEREREREQiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwIDMwSDEwVjEwSDMwVjMwSDIwWiIgZmlsbD0iI0RERERERCIvPgo8L3N2Zz4K';
                            target.alt = 'Vehicle image not available';
                          }}
                          onClick={() => {
                            // Open full size image in new tab
                            window.open(vehicleData.imageUrl, '_blank');
                          }}
                        />
                        <div style={{
                          marginTop: '10px',
                          fontSize: '12px',
                          color: '#666',
                          fontStyle: 'italic'
                        }}>
                          📷 {vehicleData.make} {vehicleData.model} ({vehicleData.year}) • Click to view full size
                        </div>
                      </div>
                    )}

                    {/* Vehicle Info Table */}
                    <div style={{ display: 'grid', gap: '15px' }}>
                      {[
                        { label: 'VIN', value: vehicleData.vin, icon: '🔢' },
                        { label: 'Make/Model', value: `${vehicleData.make} ${vehicleData.model}`, icon: '🏭' },
                        { label: 'Year', value: vehicleData.year, icon: '📅' },
                        { label: 'Color', value: vehicleData.color || 'N/A', icon: '🎨' },
                        { label: 'Fuel Type', value: vehicleData.fuelType, icon: '⚡' },
                        { label: 'Engine Size', value: vehicleData.engineSize, icon: '🔧' },
                      ].map(({ label, value, icon }) => (
                        <div key={label} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px',
                          backgroundColor: 'rgba(0,0,0,0.03)',
                          borderRadius: '8px',
                          border: '1px solid rgba(0,0,0,0.1)'
                        }}>
                          <span style={{ fontWeight: '600', color: '#555' }}>
                            {icon} {label}:
                          </span>
                          <span style={{ color: '#333' }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Blockchain Actions Card */}
                  <div className="glass-card" style={{
                    padding: '30px',
                    borderRadius: '20px'
                  }}>
                    <h3 style={{
                      fontSize: '1.6rem',
                      marginBottom: '25px',
                      color: '#333',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      ⛓️ Blockchain Actions
                    </h3>

                    {!isWalletConnected ? (
                      <ErrorMessage message="Please connect your wallet to perform blockchain actions" />
                    ) : (
                      <>
                        <div style={{
                          padding: '15px',
                          backgroundColor: 'rgba(33, 150, 243, 0.1)',
                          borderRadius: '10px',
                          marginBottom: '25px',
                          border: '1px solid rgba(33, 150, 243, 0.2)'
                        }}>
                          <p style={{ margin: 0, color: '#1976D2', fontWeight: '600' }}>
                            🔗 Wallet: {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                          </p>
                        </div>

                        {/* Mode Toggle */}
                        <div style={{
                          display: 'flex',
                          backgroundColor: 'rgba(0,0,0,0.05)',
                          borderRadius: '12px',
                          padding: '4px',
                          marginBottom: '20px'
                        }}>
                          <button
                            onClick={() => {
                              setShowServiceMode(false);
                              setActiveAction(null);
                              setServiceType('');
                              setServiceMileage('');
                              setServiceCondition('');
                            }}
                            style={{
                              flex: 1,
                              padding: '12px',
                              border: 'none',
                              borderRadius: '8px',
                              backgroundColor: !showServiceMode ? '#4CAF50' : 'transparent',
                              color: !showServiceMode ? 'white' : '#666',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            🔍 Vehicle Owner
                          </button>
                          <button
                            onClick={() => {
                              setShowServiceMode(true);
                              setActiveAction(null);
                              setNewOwner('');
                            }}
                            style={{
                              flex: 1,
                              padding: '12px',
                              border: 'none',
                              borderRadius: '8px',
                              backgroundColor: showServiceMode ? '#2196F3' : 'transparent',
                              color: showServiceMode ? 'white' : '#666',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            🔧 Service Provider
                          </button>
                        </div>

                        {!showServiceMode ? (
                          <>
                            {/* Action Buttons */}
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '12px',
                              marginBottom: '25px'
                            }}>
                              {[
                                { action: 'register' as const, label: 'Register Vehicle', icon: '📝' },
                                { action: 'transfer' as const, label: 'Transfer Ownership', icon: '🔄' },
                              ].map(({ action, label, icon }) => (
                                <button
                                  key={action}
                                  className={`btn-action ${activeAction === action ? 'active' : ''}`}
                                  onClick={() => setActiveAction(action)}
                                  disabled={txLoading}
                                  style={{
                                    padding: '12px',
                                    fontSize: '14px',
                                    fontWeight: '600'
                                  }}
                                >
                                  {icon} {label}
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Service Provider Mode */}
                            <div style={{
                              backgroundColor: 'rgba(33, 150, 243, 0.1)',
                              padding: '20px',
                              borderRadius: '12px',
                              marginBottom: '20px',
                              border: '1px solid rgba(33, 150, 243, 0.2)'
                            }}>
                              <h4 style={{ color: '#2196F3', marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                                🔧 Add Service Record
                              </h4>

                              <select
                                value={serviceType}
                                onChange={(e) => setServiceType(e.target.value)}
                                className="input-modern"
                                style={{
                                  width: '100%',
                                  marginBottom: '12px',
                                  padding: '12px',
                                  fontSize: '14px'
                                }}
                              >
                                <option value="">Select service type</option>
                                {SERVICE_TYPES.map(type => (
                                  <option key={type.value} value={type.label}>
                                    {type.label}
                                  </option>
                                ))}
                              </select>

                              <input
                                type="number"
                                placeholder="Mileage (km)"
                                value={serviceMileage}
                                onChange={(e) => setServiceMileage(e.target.value)}
                                className="input-modern"
                                style={{
                                  width: '100%',
                                  padding: '12px',
                                  fontSize: '14px',
                                  marginBottom: '12px'
                                }}
                              />

                              {/* Condition dropdown for General Maintenance and Major Service */}
                              {(serviceType === 'General Maintenance' || serviceType === 'Major Service') && (
                                <select
                                  value={serviceCondition}
                                  onChange={(e) => setServiceCondition(e.target.value)}
                                  className="input-modern"
                                  style={{
                                    width: '100%',
                                    padding: '12px',
                                    fontSize: '14px',
                                    marginBottom: '12px'
                                  }}
                                >
                                  <option value="">Select vehicle condition</option>
                                  {VEHICLE_CONDITIONS.map(condition => (
                                    <option key={condition.value} value={condition.label}>
                                      {condition.label}
                                    </option>
                                  ))}
                                </select>
                              )}

                              <button
                                className="btn-modern"
                                onClick={async () => {
                                  if (!vehicleData || !serviceType || !serviceMileage) return;

                                  // Check if this service type requires condition input
                                  const requiresCondition = serviceType === 'General Maintenance' || serviceType === 'Major Service';
                                  if (requiresCondition && !serviceCondition.trim()) {
                                    return;
                                  }

                                  // Build service details with condition if applicable
                                  let serviceDetails = `${serviceType} at ${serviceMileage}km`;
                                  if (requiresCondition && serviceCondition.trim()) {
                                    serviceDetails += ` - Condition: ${serviceCondition.trim()}`;
                                  }

                                  const success = await addServiceRecord(vehicleData.registration, serviceDetails);
                                  if (success) {
                                    setServiceType('');
                                    setServiceMileage('');
                                    setServiceCondition('');
                                  }
                                }}
                                disabled={txLoading || !serviceType || !serviceMileage || ((serviceType === 'General Maintenance' || serviceType === 'Major Service') && !serviceCondition)}
                                style={{
                                  width: '100%',
                                  backgroundColor: '#2196F3'
                                }}
                              >
                                {txLoading ? 'Processing...' : 'Add Service Record'}
                              </button>
                            </div>
                          </>
                        )}

                        {/* Action Forms for Vehicle Owner Mode */}
                        {!showServiceMode && activeAction && !txLoading && (
                          <div style={{
                            backgroundColor: 'rgba(0,0,0,0.05)',
                            padding: '20px',
                            borderRadius: '12px',
                            marginBottom: '20px',
                            border: '1px solid rgba(0,0,0,0.1)'
                          }}>
                            {activeAction === 'register' && (
                              <div>
                                <h4 style={{ color: '#333', marginBottom: '10px' }}>
                                  📝 Register Vehicle
                                </h4>
                                <p style={{ color: '#666', fontSize: '14px' }}>
                                  This will permanently record {vehicleData.registration} on the Algorand blockchain.
                                </p>
                              </div>
                            )}

                            {activeAction === 'transfer' && (
                              <div>
                                <h4 style={{ color: '#333', marginBottom: '15px' }}>
                                  🔄 Transfer Ownership
                                </h4>
                                <input
                                  type="text"
                                  placeholder="New owner address (e.g., KHXEW77SJC...)"
                                  value={newOwner}
                                  onChange={(e) => setNewOwner(e.target.value)}
                                  className="input-modern"
                                  style={{
                                    width: '100%',
                                    marginBottom: '10px',
                                    padding: '12px',
                                    fontSize: '14px'
                                  }}
                                />
                              </div>
                            )}

                            <button
                              className="btn-modern"
                              onClick={handleExecuteAction}
                              disabled={txLoading}
                              style={{
                                width: '100%',
                                marginTop: '15px',
                                fontSize: '16px'
                              }}
                            >
                              Execute {activeAction}
                            </button>
                          </div>
                        )}

                        {/* Loading State */}
                        {txLoading && <LoadingSpinner size="small" message="Processing transaction..." />}

                        {/* Transaction Results */}
                        {txError && <ErrorMessage message={txError} />}
                        {txResult && <SuccessMessage message="Transaction successful!" txId={txResult.txId} />}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="fade-in">
                  <div className="glass-card" style={{
                    padding: '30px',
                    borderRadius: '20px'
                  }}>
                    <VehicleHistory
                      registration={vehicleData.registration}
                      isVisible={showHistory}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Transaction History */}
          {isWalletConnected && (
            <div className="slide-in" style={{ marginTop: '30px' }}>
              <TransactionHistory />
            </div>
          )}

          {/* Wallet Connection Modal */}
          <ConnectWallet
            openModal={openWalletModal}
            closeModal={() => setOpenWalletModal(false)}
          />

          {/* Help Button */}
          <button
            className="btn-help"
            onClick={() => {
              setShowTutorial(true);
              setCurrentTutorialStep(0);
            }}
            title="Get help and tutorial"
          >
            ❓ Help
          </button>

          {/* Tutorial Overlay */}
          {showTutorial && (
            <div className="tutorial-overlay">
              <div className="tutorial-card">
                {/* Step Indicator */}
                <div className="step-indicator">
                  {tutorialSteps.map((_, index) => (
                    <div
                      key={index}
                      className={`step-dot ${index <= currentTutorialStep ? 'active' : ''}`}
                    />
                  ))}
                </div>

                {/* Tutorial Content */}
                <div style={{ marginBottom: '30px' }}>
                  <h2 style={{
                    color: '#333',
                    marginBottom: '20px',
                    fontSize: '1.5rem',
                    textAlign: 'center'
                  }}>
                    {tutorialSteps[currentTutorialStep].title}
                  </h2>
                  <div style={{
                    color: '#555',
                    lineHeight: '1.6',
                    fontSize: '16px'
                  }}>
                    {tutorialSteps[currentTutorialStep].content}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '20px',
                  borderTop: '1px solid #eee'
                }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {currentTutorialStep > 0 && (
                      <button
                        onClick={prevTutorialStep}
                        style={{
                          background: 'linear-gradient(145deg, #757575, #616161)',
                          border: 'none',
                          color: 'white',
                          padding: '10px 20px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(117, 117, 117, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        ← Previous
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowTutorial(false);
                        setCurrentTutorialStep(0);
                      }}
                      style={{
                        background: 'linear-gradient(145deg, #f44336, #d32f2f)',
                        border: 'none',
                        color: 'white',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(244, 67, 54, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      Skip Tutorial
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{
                      color: '#999',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      {currentTutorialStep + 1} of {tutorialSteps.length}
                    </span>
                    <button
                      onClick={nextTutorialStep}
                      style={{
                        background: currentTutorialStep === tutorialSteps.length - 1
                          ? 'linear-gradient(145deg, #4CAF50, #45a049)'
                          : 'linear-gradient(145deg, #2196F3, #1976D2)',
                        border: 'none',
                        color: 'white',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                        boxShadow: currentTutorialStep === tutorialSteps.length - 1
                          ? '0 4px 15px rgba(76, 175, 80, 0.3)'
                          : '0 4px 15px rgba(33, 150, 243, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = currentTutorialStep === tutorialSteps.length - 1
                          ? '0 6px 20px rgba(76, 175, 80, 0.4)'
                          : '0 6px 20px rgba(33, 150, 243, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = currentTutorialStep === tutorialSteps.length - 1
                          ? '0 4px 15px rgba(76, 175, 80, 0.3)'
                          : '0 4px 15px rgba(33, 150, 243, 0.3)';
                      }}
                    >
                      {currentTutorialStep === tutorialSteps.length - 1 ? '🎉 Finish' : 'Next →'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
