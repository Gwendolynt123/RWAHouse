import React, { useState } from 'react';
import './App.css';
import { PropertyRegistration } from './components/PropertyRegistration';
import { PropertyInfo } from './components/PropertyInfo';
import { PropertyQueries } from './components/PropertyQueries';
import { AuthorizationManager } from './components/AuthorizationManager';
import { AccessDenied } from './components/AccessDenied';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { FHEProvider, useFHE } from './contexts/FHEContext';
import { useAccount, useChainId } from 'wagmi';

type UserRole = 'appraiser' | 'user' | 'lending_platform';

const roleNames = {
  appraiser: 'Property Appraiser',
  user: 'Property Owner',
  lending_platform: 'Lending Platform'
};

// FHE Initialization Component
const FHEInitButton: React.FC = () => {
  const { instance, isInitializing, initFHE } = useFHE();
  const { connector } = useAccount();
  const chainId = useChainId();

  const handleInitFHE = async () => {
    if (!connector) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      const provider = await connector.getProvider();
      await initFHE(provider, chainId);
    } catch (err) {
      console.error('FHE initialization failed:', err);
      alert('FHE initialization failed, please check console');
    }
  };

  if (instance) {
    return (
      <div style={{
        padding: '8px 16px',
        backgroundColor: '#28a745',
        color: 'white',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: 'bold'
      }}>
        ✓ FHE Ready
      </div>
    );
  }

  return (
    <button
      onClick={handleInitFHE}
      disabled={isInitializing}
      style={{
        padding: '8px 16px',
        backgroundColor: isInitializing ? '#6c757d' : '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: isInitializing ? 'not-allowed' : 'pointer',
        opacity: isInitializing ? 0.6 : 1
      }}
    >
      {isInitializing ? 'Initializing...' : 'Initialize FHE'}
    </button>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState<'register' | 'info' | 'queries' | 'auth'>('register');
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  // Permission check function
  const hasAccess = (tab: string): boolean => {
    if (!userRole) return false;

    switch (tab) {
      case 'register':
        return userRole === 'appraiser';
      case 'info':
        return userRole === 'user';
      case 'queries':
        return userRole === 'lending_platform';
      default:
        return false;
    }
  };

  // If no role selected, show role selection interface
  if (!userRole) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>RWAHouse - Confidential Property Management</h1>
          <p>Please select your role to continue using the system</p>
        </header>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '40px'
        }}>
          <h2 style={{ marginBottom: '30px', color: '#333' }}>Select Your Role</h2>
          <div style={{
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {(Object.keys(roleNames) as UserRole[]).map((role) => (
              <button
                key={role}
                onClick={() => setUserRole(role)}
                style={{
                  padding: '20px 30px',
                  fontSize: '16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  minWidth: '200px',
                  textAlign: 'center',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#0056b3';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#007bff';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {roleNames[role]}
              </button>
            ))}
          </div>
        </div>

        <footer className="app-footer">
          <p>Built with Zama FHE, React, Vite, and Rainbow Kit</p>
          <p>Your property data is encrypted and only accessible by authorized parties</p>
        </footer>
      </div>
    );
  }

  return (
    <FHEProvider>
      <div className="app">
        <header className="app-header">
          <h1>RWAHouse - Confidential Property Management</h1>
          <p>Securely store and manage property information using Zama's FHE technology</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              Current Role: {roleNames[userRole!]}
            </div>
            <button
              onClick={() => setUserRole(null)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Switch Role
            </button>
            <FHEInitButton />
            <div className="connect-wallet">
              <ConnectButton />
            </div>
          </div>
        </header>

        <nav className="app-nav">
          <button
            className={`nav-button ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            Register Property
          </button>
          <button
            className={`nav-button ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            My Property
          </button>
          <button
            className={`nav-button ${activeTab === 'queries' ? 'active' : ''}`}
            onClick={() => setActiveTab('queries')}
          >
            Property Queries
          </button>
        </nav>

        <main className="app-main">
          {activeTab === 'register' && (
            hasAccess('register') ?
              <PropertyRegistration /> :
              <AccessDenied role={roleNames[userRole!]} requiredRole={roleNames.appraiser} />
          )}
          {activeTab === 'info' && (
            hasAccess('info') ?
              <PropertyInfo /> :
              <AccessDenied role={roleNames[userRole!]} requiredRole={roleNames.user} />
          )}
          {activeTab === 'queries' && (
            hasAccess('queries') ?
              <PropertyQueries /> :
              <AccessDenied role={roleNames[userRole!]} requiredRole={roleNames.lending_platform} />
          )}
          {activeTab === 'auth' && <AuthorizationManager />}
        </main>

        <footer className="app-footer">
          <p>Built with Zama FHE, React, Vite, and Rainbow Kit</p>
          <p>Your property data is encrypted and only accessible by authorized parties</p>
        </footer>
      </div>
    </FHEProvider>
  );
}

export default App;
