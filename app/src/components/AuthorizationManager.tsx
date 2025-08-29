import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useRWAHouse } from '../hooks/useRWAHouse';

interface Authorization {
  address: string;
  isAuthorized: boolean;
}

export const AuthorizationManager: React.FC = () => {
  const { address } = useAccount();
  const { 
    authorizeAccess,
    revokeAccess, 
    useIsAuthorized,
    useHasProperty,
    writeAuthorizeAccess,
    writeRevokeAccess
  } = useRWAHouse();

  const { data: hasProperty } = useHasProperty(address);

  const [authForm, setAuthForm] = useState({
    address: '',
  });

  const [checkForm, setCheckForm] = useState({
    ownerAddress: '',
    accessorAddress: '',
  });

  const { data: isAuthorized } = useIsAuthorized(
    checkForm.ownerAddress || undefined,
    checkForm.accessorAddress || undefined
  );

  const [authorizations, setAuthorizations] = useState<Authorization[]>([]);

  const handleAuthorize = () => {
    if (!authForm.address) {
      alert('Please enter an address to authorize');
      return;
    }

    if (!address) {
      alert('Please connect your wallet');
      return;
    }

    if (authForm.address.toLowerCase() === address.toLowerCase()) {
      alert('You cannot authorize yourself');
      return;
    }

    writeAuthorizeAccess([authForm.address as `0x${string}`]);

    // Add to local state (in real app, this would be updated from contract events)
    setAuthorizations(prev => [
      ...prev.filter(auth => auth.address !== authForm.address),
      { address: authForm.address, isAuthorized: true }
    ]);

    setAuthForm({ address: '' });
  };

  const handleRevoke = (targetAddress: string) => {
    if (!address) {
      alert('Please connect your wallet');
      return;
    }

    writeRevokeAccess([targetAddress as `0x${string}`]);

    // Update local state
    setAuthorizations(prev => 
      prev.map(auth => 
        auth.address === targetAddress 
          ? { ...auth, isAuthorized: false }
          : auth
      )
    );
  };

  if (!address) {
    return (
      <div className="luxury-card text-center">
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔐</div>
        <h2>Authorization Management</h2>
        <p style={{ 
          fontSize: '1.2rem',
          color: 'var(--color-platinum)',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          Connect your wallet to manage property access authorizations
        </p>
        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: 'linear-gradient(135deg, rgba(224, 17, 95, 0.1) 0%, rgba(224, 17, 95, 0.05) 100%)',
          border: '2px solid rgba(224, 17, 95, 0.2)',
          borderRadius: '16px'
        }}>
          <span style={{ fontSize: '24px', marginRight: '10px' }}>⚠️</span>
          <strong>Wallet connection required to manage authorizations.</strong>
        </div>
      </div>
    );
  }

  if (!hasProperty) {
    return (
      <div className="luxury-card text-center">
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🏠</div>
        <h2>Authorization Management</h2>
        <p style={{ 
          fontSize: '1.2rem',
          color: 'var(--color-platinum)',
          maxWidth: '500px',
          margin: '0 auto 30px'
        }}>
          You need to register a property first before managing authorizations
        </p>
        <div style={{
          padding: '25px',
          background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%)',
          border: '2px solid rgba(255, 215, 0, 0.2)',
          borderRadius: '20px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '12px',
            fontSize: '1.2rem',
            color: 'var(--color-gold)',
            fontWeight: '600',
            marginBottom: '10px'
          }}>
            <span style={{ fontSize: '24px' }}>💡</span>
            Next Steps
          </div>
          <p style={{ 
            color: 'var(--color-platinum)',
            margin: 0,
            lineHeight: '1.5'
          }}>
            Switch to the <strong style={{ color: 'var(--color-gold)' }}>Property Appraiser</strong> role and register a property first, then return here to manage access permissions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header Section */}
      <div className="luxury-card text-center" style={{ marginBottom: '40px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔐</div>
        <h2>Authorization Management</h2>
        <p style={{ 
          fontSize: '1.2rem',
          color: 'var(--color-platinum)',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Control access to your encrypted property information with granular permissions
        </p>
      </div>

      <div className="grid grid-cols-1" style={{ gap: '40px' }}>
        {/* Grant Access Section */}
        <div className="luxury-card">
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🔓</div>
            <h3 style={{ marginBottom: '10px' }}>Grant Access</h3>
            <p style={{ color: 'var(--color-silver)', fontSize: '1rem' }}>
              Authorize an address to access your encrypted property data
            </p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="authorizeAddress">
              <span style={{ fontSize: '18px', marginRight: '6px' }}>👤</span>
              Address to Authorize
            </label>
            <input
              id="authorizeAddress"
              type="text"
              value={authForm.address}
              onChange={(e) => setAuthForm({ address: e.target.value })}
              placeholder="0x1234567890abcdef1234567890abcdef12345678"
              className="luxury-input"
            />
            <span className="form-hint">
              Enter the wallet address you want to grant access to
            </span>
          </div>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button 
              onClick={handleAuthorize}
              disabled={authorizeAccess.isPending || !authForm.address}
              className="btn-premium"
              style={{ 
                opacity: (authorizeAccess.isPending || !authForm.address) ? 0.6 : 1,
                fontSize: '0.9rem',
                padding: '10px 20px'
              }}
            >
              {authorizeAccess.isPending ? (
                <>
                  <div className="luxury-spinner" style={{ width: '16px', height: '16px', marginRight: '8px' }}></div>
                  Granting Access...
                </>
              ) : (
                <>
                  <span style={{ fontSize: '16px', marginRight: '6px' }}>🔓</span>
                  Grant Access
                </>
              )}
            </button>
          </div>

          {/* Success/Error Messages */}
          {authorizeAccess.error && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              background: 'linear-gradient(135deg, rgba(224, 17, 95, 0.1) 0%, rgba(224, 17, 95, 0.05) 100%)',
              border: '2px solid rgba(224, 17, 95, 0.2)',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '20px', marginRight: '8px' }}>⚠️</span>
              <strong style={{ color: 'var(--color-ruby)' }}>
                Authorization failed: {authorizeAccess.error.message}
              </strong>
            </div>
          )}
        </div>

        {/* Check Authorization Status */}
        <div className="luxury-card">
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🔍</div>
            <h3 style={{ marginBottom: '10px' }}>Check Authorization Status</h3>
            <p style={{ color: 'var(--color-silver)', fontSize: '1rem' }}>
              Verify if an address has access to a property owner's data
            </p>
          </div>

          <div style={{ display: 'grid', gap: '20px', marginBottom: '30px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="ownerAddress">
                <span style={{ fontSize: '20px', marginRight: '8px' }}>🏠</span>
                Property Owner Address
              </label>
              <input
                id="ownerAddress"
                type="text"
                value={checkForm.ownerAddress}
                onChange={(e) => setCheckForm(prev => ({ ...prev, ownerAddress: e.target.value }))}
                placeholder="0x1234567890abcdef1234567890abcdef12345678"
                className="luxury-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="accessorAddress">
                <span style={{ fontSize: '20px', marginRight: '8px' }}>👤</span>
                Accessor Address
              </label>
              <input
                id="accessorAddress"
                type="text"
                value={checkForm.accessorAddress}
                onChange={(e) => setCheckForm(prev => ({ ...prev, accessorAddress: e.target.value }))}
                placeholder="0x1234567890abcdef1234567890abcdef12345678"
                className="luxury-input"
              />
            </div>
          </div>

          {/* Authorization Status Display */}
          {checkForm.ownerAddress && checkForm.accessorAddress && (
            <div style={{
              padding: '25px',
              background: isAuthorized ?
                'linear-gradient(135deg, rgba(80, 200, 120, 0.1) 0%, rgba(80, 200, 120, 0.05) 100%)' :
                'linear-gradient(135deg, rgba(224, 17, 95, 0.1) 0%, rgba(224, 17, 95, 0.05) 100%)',
              border: isAuthorized ?
                '2px solid rgba(80, 200, 120, 0.2)' :
                '2px solid rgba(224, 17, 95, 0.2)',
              borderRadius: '20px',
              textAlign: 'center'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                fontSize: '1.3rem',
                fontWeight: '600',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '28px' }}>
                  {isAuthorized ? '✅' : '❌'}
                </span>
                <span style={{ 
                  color: isAuthorized ? 'var(--color-emerald)' : 'var(--color-ruby)' 
                }}>
                  {isAuthorized ? 'AUTHORIZED' : 'NOT AUTHORIZED'}
                </span>
              </div>
              <p style={{
                color: 'var(--color-platinum)',
                margin: 0,
                fontSize: '1rem'
              }}>
                {isAuthorized ? 
                  'This address has permission to access the property data' :
                  'This address does not have access to the property data'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Current Authorizations */}
      {authorizations.length > 0 && (
        <div className="luxury-card" style={{ marginTop: '40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📋</div>
            <h3>Active Authorizations</h3>
            <p style={{ color: 'var(--color-silver)', fontSize: '1rem' }}>
              Manage existing access permissions for your property
            </p>
          </div>

          <div style={{ display: 'grid', gap: '20px' }}>
            {authorizations.map((auth, index) => (
              <div
                key={index}
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                  border: '1px solid rgba(255, 215, 0, 0.1)',
                  borderRadius: '20px',
                  padding: '25px',
                  position: 'relative'
                }}
              >
                {/* Status Indicator Bar */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: auth.isAuthorized ?
                    'linear-gradient(90deg, #50C878, #32CD32)' :
                    'linear-gradient(90deg, #E0115F, #DC143C)',
                  borderRadius: '20px 20px 0 0'
                }} />

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '15px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '10px'
                    }}>
                      <span style={{ fontSize: '24px' }}>
                        {auth.isAuthorized ? '🔓' : '🔒'}
                      </span>
                      <div>
                        <p style={{
                          color: 'var(--color-ivory)',
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          margin: '0 0 5px 0',
                          fontFamily: 'var(--font-mono)',
                          letterSpacing: '0.5px'
                        }}>
                          {auth.address}
                        </p>
                        <div className={`badge ${auth.isAuthorized ? 'badge-emerald' : 'badge-ruby'}`} style={{
                          fontSize: '0.8rem',
                          padding: '4px 12px'
                        }}>
                          <span style={{ fontSize: '14px', marginRight: '4px' }}>
                            {auth.isAuthorized ? '✅' : '🚫'}
                          </span>
                          {auth.isAuthorized ? 'Authorized' : 'Revoked'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {auth.isAuthorized && (
                    <button 
                      onClick={() => handleRevoke(auth.address)}
                      disabled={revokeAccess.isPending}
                      className="btn-secondary"
                      style={{
                        borderColor: 'var(--color-ruby)',
                        color: 'var(--color-ruby)',
                        opacity: revokeAccess.isPending ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(224, 17, 95, 0.1) 0%, rgba(224, 17, 95, 0.05) 100%)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {revokeAccess.isPending ? (
                        <>
                          <div className="luxury-spinner" style={{ width: '16px', height: '16px', marginRight: '8px' }}></div>
                          Revoking...
                        </>
                      ) : (
                        <>
                          <span style={{ fontSize: '16px', marginRight: '6px' }}>🔒</span>
                          Revoke Access
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Information Section */}
      <div className="luxury-card" style={{ marginTop: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📚</div>
          <h3>How Authorization Works</h3>
          <p style={{ color: 'var(--color-silver)', fontSize: '1rem' }}>
            Understanding the authorization and encryption system
          </p>
        </div>

        <div style={{
          display: 'grid',
          gap: '25px'
        }}>
          {[
            {
              icon: '🔐',
              title: 'Permanent Access',
              description: 'When you grant access to an address, they can view your encrypted property information until you explicitly revoke it.',
              color: 'var(--color-emerald)'
            },
            {
              icon: '🔍',
              title: 'Query Permissions',
              description: 'Separate from permanent access, you can grant single-use query permissions for specific property verification checks.',
              color: 'var(--color-sapphire)'
            },
            {
              icon: '🛡️',
              title: 'Encryption Security',
              description: 'Your property data remains encrypted at all times. Authorized users can only decrypt it with proper permissions through the FHE system.',
              color: 'var(--color-gold)'
            }
          ].map((item, index) => (
            <div
              key={index}
              style={{
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                border: '1px solid rgba(255, 215, 0, 0.05)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '15px'
              }}
            >
              <div style={{
                fontSize: '2rem',
                padding: '10px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${item.color}20 0%, ${item.color}10 100%)`,
                border: `1px solid ${item.color}30`
              }}>
                {item.icon}
              </div>
              <div>
                <h4 style={{
                  color: item.color,
                  margin: '0 0 10px 0',
                  fontSize: '1.3rem'
                }}>
                  {item.title}
                </h4>
                <p style={{
                  color: 'var(--color-platinum)',
                  margin: 0,
                  fontSize: '1rem',
                  lineHeight: '1.6'
                }}>
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};