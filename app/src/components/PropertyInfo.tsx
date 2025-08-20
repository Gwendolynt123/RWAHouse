import React, { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { useFHE } from '../contexts/FHEContext';
import { useRWAHouse } from '../hooks/useRWAHouse';

export const PropertyInfo: React.FC = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { 
    instance: fheInstance,
    isInitializing: fheLoading 
  } = useFHE();
  const { 
    useHasProperty, 
    useGetPropertyInfoForDecryption,
    contractAddress 
  } = useRWAHouse();
  
  const { data: hasProperty } = useHasProperty(address);
  const { data: encryptedPropertyData, refetch: refetchPropertyData } = useGetPropertyInfoForDecryption(address);
  
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedData, setDecryptedData] = useState<{
    country?: number;
    city?: number;
    valuation?: number;
  } | null>(null);
  const [decryptionError, setDecryptionError] = useState<string | null>(null);

  const handleDecryptProperty = async () => {
    if (!address || !contractAddress || !fheInstance || !walletClient) {
      alert('Please ensure your wallet is connected and FHE is initialized');
      return;
    }

    try {
      setIsDecrypting(true);
      setDecryptionError(null);
      
      console.log('🔍 Starting property decryption...');
      
      // First, get the encrypted property data from the contract
      await refetchPropertyData();
      
      if (!encryptedPropertyData) {
        throw new Error('Could not fetch encrypted property data');
      }

      console.log('📊 Encrypted property data:', encryptedPropertyData);

      // The encrypted property data should be an array: [country, city, valuation, exists]
      const [countryHandle, cityHandle, valuationHandle] = encryptedPropertyData as [string, string, string, boolean];

      console.log('🔑 Decryption handles:', {
        country: countryHandle,
        city: cityHandle,
        valuation: valuationHandle,
      });

      // Generate keypair for user decryption
      const keypair = fheInstance.generateKeypair();
      
      // Prepare handles for decryption
      const handleContractPairs = [
        { handle: countryHandle, contractAddress },
        { handle: cityHandle, contractAddress },
        { handle: valuationHandle, contractAddress },
      ];

      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = "10";
      const contractAddresses = [contractAddress];

      // Create EIP712 message for signing
      const eip712 = fheInstance.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTimeStamp,
        durationDays
      );

      console.log('📝 Signing EIP712 message...');

      // Sign the message
      const signature = await walletClient.signTypedData({
        domain: eip712.domain,
        types: {
          UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
        },
        primaryType: 'UserDecryptRequestVerification',
        message: eip712.message,
      });

      console.log('✅ Message signed, performing decryption...');

      // Perform user decryption
      const result = await fheInstance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace('0x', ''),
        contractAddresses,
        address,
        startTimeStamp,
        durationDays
      );

      console.log('🎉 Decryption result:', result);

      // Extract decrypted values
      const decryptedCountry = result[countryHandle];
      const decryptedCity = result[cityHandle];
      const decryptedValuation = result[valuationHandle];

      setDecryptedData({
        country: typeof decryptedCountry === 'bigint' ? Number(decryptedCountry) : decryptedCountry,
        city: typeof decryptedCity === 'bigint' ? Number(decryptedCity) : decryptedCity,
        valuation: typeof decryptedValuation === 'bigint' ? Number(decryptedValuation) : decryptedValuation,
      });

      console.log('✅ Property decryption completed successfully!');
      
    } catch (error) {
      console.error('❌ Error decrypting property:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown decryption error';
      setDecryptionError(errorMessage);
    } finally {
      setIsDecrypting(false);
    }
  };

  if (fheLoading || !fheInstance) {
    return (
      <div className="property-info">
        <h2>Your Property Information</h2>
        <p>{fheLoading ? 'Loading FHE system...' : 'FHE system not initialized. Please initialize it in the registration tab.'}</p>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="property-info">
        <h2>Your Property Information</h2>
        <p>Please connect your wallet to view your property information.</p>
      </div>
    );
  }

  if (!hasProperty) {
    return (
      <div className="property-info">
        <h2>Your Property Information</h2>
        <p>You haven't registered any property yet. Please use the registration form above.</p>
      </div>
    );
  }

  return (
    <div className="property-info">
      <h2>Your Property Information</h2>
      <p>You have a registered property. Click below to decrypt and view your data.</p>
      
      <button 
        onClick={handleDecryptProperty}
        disabled={isDecrypting || !encryptedPropertyData}
        className="decrypt-button"
        style={{
          padding: '12px 24px',
          backgroundColor: isDecrypting ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: isDecrypting ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          marginBottom: '20px'
        }}
      >
        {isDecrypting ? 'Decrypting...' : 'Decrypt Property Data'}
      </button>

      {decryptionError && (
        <div style={{
          backgroundColor: '#ffe6e6',
          border: '1px solid #ffcccc',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '20px',
          color: '#cc0000'
        }}>
          <h4>Decryption Error:</h4>
          <p>{decryptionError}</p>
          <button 
            onClick={() => setDecryptionError(null)}
            style={{
              backgroundColor: '#cc0000',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {decryptedData && (
        <div style={{
          backgroundColor: '#e8f5e8',
          border: '1px solid #4CAF50',
          borderRadius: '8px',
          padding: '20px',
          marginTop: '20px'
        }}>
          <h3 style={{ color: '#2e7d2e', marginTop: '0' }}>🎉 Decrypted Property Data:</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{
              padding: '12px',
              backgroundColor: 'white',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}>
              <strong>🌍 Country Code:</strong> {decryptedData.country}
            </div>
            <div style={{
              padding: '12px',
              backgroundColor: 'white',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}>
              <strong>🏙️ City Code:</strong> {decryptedData.city}
            </div>
            <div style={{
              padding: '12px',
              backgroundColor: 'white',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}>
              <strong>💰 Valuation:</strong> ${decryptedData.valuation?.toLocaleString()}
            </div>
          </div>
          <button 
            onClick={() => setDecryptedData(null)}
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '14px',
              marginTop: '16px'
            }}
          >
            Clear Decrypted Data
          </button>
        </div>
      )}

      {!encryptedPropertyData && hasProperty && (
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeeba',
          borderRadius: '8px',
          padding: '12px',
          marginTop: '20px',
          color: '#856404'
        }}>
          <p>⚠️ Could not load encrypted property data from the contract. This might be due to network issues or contract configuration.</p>
        </div>
      )}
    </div>
  );
};