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

    writeAuthorizeAccess([authForm.address]);

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

    writeRevokeAccess([targetAddress]);

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
      <div className="authorization-manager">
        <h2>Authorization Management</h2>
        <p>Please connect your wallet to manage property access authorizations.</p>
      </div>
    );
  }

  if (!hasProperty) {
    return (
      <div className="authorization-manager">
        <h2>Authorization Management</h2>
        <p>You need to register a property first before you can manage authorizations.</p>
      </div>
    );
  }

  return (
    <div className="authorization-manager">
      <h2>Authorization Management</h2>
      <p>Manage who can access your encrypted property information.</p>

      {/* Authorize New Access */}
      <div className="authorize-section">
        <h3>Grant Access</h3>
        <div className="authorize-form">
          <div className="form-group">
            <label>Address to Authorize:</label>
            <input
              type="text"
              value={authForm.address}
              onChange={(e) => setAuthForm({ address: e.target.value })}
              placeholder="0x..."
            />
          </div>
          <button 
            onClick={handleAuthorize}
            disabled={authorizeAccess.isPending}
            className="authorize-button"
          >
            {authorizeAccess.isPending ? 'Authorizing...' : 'Grant Access'}
          </button>
        </div>
      </div>

      {/* Check Authorization Status */}
      <div className="check-section">
        <h3>Check Authorization Status</h3>
        <div className="check-form">
          <div className="form-group">
            <label>Property Owner:</label>
            <input
              type="text"
              value={checkForm.ownerAddress}
              onChange={(e) => setCheckForm(prev => ({ ...prev, ownerAddress: e.target.value }))}
              placeholder="0x..."
            />
          </div>
          <div className="form-group">
            <label>Accessor Address:</label>
            <input
              type="text"
              value={checkForm.accessorAddress}
              onChange={(e) => setCheckForm(prev => ({ ...prev, accessorAddress: e.target.value }))}
              placeholder="0x..."
            />
          </div>
          {checkForm.ownerAddress && checkForm.accessorAddress && (
            <div className="authorization-status">
              <strong>Status:</strong> 
              <span className={`status ${isAuthorized ? 'authorized' : 'not-authorized'}`}>
                {isAuthorized ? 'Authorized' : 'Not Authorized'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Current Authorizations */}
      {authorizations.length > 0 && (
        <div className="current-authorizations">
          <h3>Current Authorizations</h3>
          <div className="auth-list">
            {authorizations.map((auth, index) => (
              <div key={index} className="auth-item">
                <div className="auth-info">
                  <div className="auth-address">{auth.address}</div>
                  <div className={`auth-status ${auth.isAuthorized ? 'authorized' : 'revoked'}`}>
                    {auth.isAuthorized ? 'Authorized' : 'Revoked'}
                  </div>
                </div>
                {auth.isAuthorized && (
                  <button 
                    onClick={() => handleRevoke(auth.address)}
                    disabled={revokeAccess.isPending}
                    className="revoke-button"
                  >
                    {revokeAccess.isPending ? 'Revoking...' : 'Revoke'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="info-section">
        <h3>How Authorization Works</h3>
        <div className="info-content">
          <p><strong>Permanent Access:</strong> When you grant access to an address, they can view your encrypted property information until you revoke it.</p>
          <p><strong>Query Access:</strong> Separate from permanent access, you can grant single-use query permissions for specific property checks.</p>
          <p><strong>Encryption:</strong> Your property data remains encrypted. Authorized users can only decrypt it with proper permissions.</p>
        </div>
      </div>
    </div>
  );
};