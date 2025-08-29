import React, { useState } from 'react';
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

// Luxury FHE Initialization Component
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
      <div className="badge badge-emerald">
        <span style={{ fontSize: '16px', marginRight: '6px' }}>🔐</span>
        FHE Ready
      </div>
    );
  }

  return (
    <button
      onClick={handleInitFHE}
      disabled={isInitializing}
      className={isInitializing ? "btn-secondary" : "btn-premium"}
      style={{ 
        fontSize: '14px',
        padding: '12px 24px',
        opacity: isInitializing ? 0.6 : 1
      }}
    >
      {isInitializing ? (
        <>
          <div className="luxury-spinner" style={{ width: '20px', height: '20px', marginRight: '8px' }}></div>
          Initializing...
        </>
      ) : (
        <>
          <span style={{ fontSize: '16px', marginRight: '6px' }}>🔐</span>
          Initialize FHE
        </>
      )}
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

  // Luxury Role Selection Interface
  if (!userRole) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* Floating Header */}
        <header style={{
          textAlign: 'center',
          padding: '30px 20px 20px',
          position: 'relative',
          zIndex: 10
        }}>
          <div style={{ 
            animation: 'float 6s ease-in-out infinite',
            marginBottom: '12px'
          }}>
            <h1 style={{ fontSize: '2rem', margin: 0 }}>RWAHouse</h1>
          </div>
          <p style={{ 
            fontSize: '1rem', 
            maxWidth: '600px', 
            margin: '0 auto',
            color: 'var(--color-platinum)',
            lineHeight: '1.4'
          }}>
            Confidential Property Management Platform
          </p>
          <p style={{ 
            fontSize: '0.9rem', 
            maxWidth: '500px', 
            margin: '8px auto 0',
            color: 'var(--color-silver)',
            fontStyle: 'italic'
          }}>
            Powered by Zama's Fully Homomorphic Encryption
          </p>
        </header>

        {/* Role Selection Section */}
        <main style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%'
        }}>
          <div className="luxury-card" style={{ 
            maxWidth: '800px', 
            width: '100%',
            textAlign: 'center'
          }}>
            <h2 style={{ 
              marginBottom: '20px', 
              fontSize: '1.8rem',
              background: 'linear-gradient(135deg, var(--color-gold), var(--color-sapphire))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Select Your Role
            </h2>
            
            <p style={{ 
              marginBottom: '30px', 
              fontSize: '1rem',
              color: 'var(--color-platinum)'
            }}>
              Choose your role to access the appropriate features
            </p>

            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px'
            }}>
              {(Object.keys(roleNames) as UserRole[]).map((role, index) => {
                const icons = {
                  appraiser: '🏗️',
                  user: '🏠', 
                  lending_platform: '🏦'
                };
                
                const descriptions = {
                  appraiser: 'Register and evaluate properties with encrypted valuations',
                  user: 'View your property information and manage access permissions',
                  lending_platform: 'Query property data for lending decisions'
                };

                return (
                  <div
                    key={role}
                    className="luxury-card"
                    style={{
                      cursor: 'pointer',
                      transition: 'all var(--transition-base)',
                      textAlign: 'center',
                      padding: '25px 20px',
                      animationDelay: `${index * 0.2}s`,
                      animation: 'fadeIn 0.8s ease-out both'
                    }}
                    onClick={() => setUserRole(role)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 70px 140px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 180px rgba(255, 215, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 50px 100px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 120px rgba(255, 215, 0, 0.05)';
                    }}
                  >
                    <div style={{ 
                      fontSize: '3rem', 
                      marginBottom: '12px',
                      filter: 'drop-shadow(0 4px 8px rgba(255, 215, 0, 0.3))'
                    }}>
                      {icons[role]}
                    </div>
                    
                    <h3 style={{ 
                      marginBottom: '8px',
                      fontSize: '1.2rem',
                      color: 'var(--color-ivory)'
                    }}>
                      {roleNames[role]}
                    </h3>
                    
                    <p style={{ 
                      color: 'var(--color-silver)',
                      fontSize: '0.9rem',
                      lineHeight: '1.4'
                    }}>
                      {descriptions[role]}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {/* Luxury Footer */}
        <footer style={{
          textAlign: 'center',
          padding: '20px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.01) 100%)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(255, 215, 0, 0.1)'
        }}>
          <p style={{ 
            margin: '8px 0',
            color: 'var(--color-silver)',
            fontSize: '0.85rem'
          }}>
            Built with <span style={{ color: 'var(--color-gold)' }}>Zama FHE</span>, <span style={{ color: 'var(--color-sapphire)' }}>React</span>, and <span style={{ color: 'var(--color-emerald)' }}>Rainbow Kit</span>
          </p>
          <p style={{ 
            margin: '4px 0',
            color: 'var(--color-platinum)',
            fontSize: '0.8rem',
            fontStyle: 'italic'
          }}>
            Your property data is encrypted and only accessible by authorized parties
          </p>
        </footer>
      </div>
    );
  }

  return (
    <FHEProvider>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Luxury Header */}
        <header style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
          backdropFilter: 'blur(30px)',
          borderBottom: '1px solid rgba(255, 215, 0, 0.1)',
          padding: '15px 20px',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ 
            maxWidth: '1400px', 
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            {/* Logo and Title */}
            <div>
              <h1 style={{ 
                fontSize: '1.8rem', 
                margin: '0 0 4px 0',
                background: 'linear-gradient(45deg, #FFD700, #0F52BA, #50C878)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                RWAHouse
              </h1>
              <p style={{ 
                margin: 0, 
                color: 'var(--color-silver)',
                fontSize: '0.85rem'
              }}>
                Confidential Property Management
              </p>
            </div>

            {/* Status and Controls */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '20px',
              flexWrap: 'wrap'
            }}>
              <div className="badge badge-gold" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                <span style={{ fontSize: '14px', marginRight: '4px' }}>👤</span>
                {roleNames[userRole!]}
              </div>
              
              <button
                onClick={() => setUserRole(null)}
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '8px 16px' }}
              >
                Switch Role
              </button>
              
              <FHEInitButton />
              
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                padding: '8px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 215, 0, 0.2)'
              }}>
                <ConnectButton />
              </div>
            </div>
          </div>
        </header>

        {/* Luxury Navigation */}
        <nav style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 215, 0, 0.1)',
          padding: '0 20px',
          overflow: 'hidden'
        }}>
          <div style={{ 
            maxWidth: '1400px', 
            margin: '0 auto',
            display: 'flex',
            gap: '0'
          }}>
            {[
              { key: 'register', label: 'Register Property', icon: '🏗️' },
              { key: 'info', label: 'My Property', icon: '🏠' },
              { key: 'queries', label: 'Property Queries', icon: '🔍' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  background: activeTab === tab.key 
                    ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%)'
                    : 'transparent',
                  border: 'none',
                  padding: '12px 20px',
                  color: activeTab === tab.key ? 'var(--color-gold)' : 'var(--color-silver)',
                  fontSize: '0.9rem',
                  fontWeight: activeTab === tab.key ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all var(--transition-base)',
                  borderBottom: activeTab === tab.key 
                    ? '3px solid var(--color-gold)' 
                    : '3px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'var(--font-primary)',
                  letterSpacing: '0.02em',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.key) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, 0.05) 0%, rgba(255, 215, 0, 0.02) 100%)';
                    e.currentTarget.style.color = 'var(--color-platinum)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.key) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--color-silver)';
                  }
                }}
              >
                <span style={{ fontSize: '16px' }}>{tab.icon}</span>
                {tab.label}
                {activeTab === tab.key && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, #FFD700, #0F52BA, #50C878)',
                    backgroundSize: '200% 100%',
                    animation: 'slideGradient 3s linear infinite'
                  }} />
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Main Content Area */}
        <main style={{
          flex: 1,
          padding: '20px',
          maxWidth: '1400px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div style={{
            animation: 'fadeIn 0.5s ease-out'
          }}>
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
          </div>
        </main>

        {/* Luxury Footer */}
        <footer style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255, 215, 0, 0.1)',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <p style={{ 
              margin: '8px 0',
              color: 'var(--color-silver)',
              fontSize: '0.85rem'
            }}>
              Built with <span style={{ color: 'var(--color-gold)', fontWeight: '600' }}>Zama FHE</span>, <span style={{ color: 'var(--color-sapphire)', fontWeight: '600' }}>React</span>, and <span style={{ color: 'var(--color-emerald)', fontWeight: '600' }}>Rainbow Kit</span>
            </p>
            <p style={{ 
              margin: '4px 0',
              color: 'var(--color-platinum)',
              fontSize: '0.8rem',
              fontStyle: 'italic'
            }}>
              Your property data is encrypted and only accessible by authorized parties
            </p>
          </div>
        </footer>
      </div>
    </FHEProvider>
  );
}

export default App;
