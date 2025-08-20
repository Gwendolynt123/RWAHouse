import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useFHE } from '../hooks/useFHE';
import { useRWAHouse } from '../hooks/useRWAHouse';

export const PropertyInfo: React.FC = () => {
  const { address } = useAccount();
  const { 
    generateKeypair, 
    createEIP712, 
    userDecrypt, 
    isLoading: fheLoading 
  } = useFHE();
  const { useHasProperty, contractAddress } = useRWAHouse();
  
  const { data: hasProperty } = useHasProperty(address);
  
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedData, setDecryptedData] = useState<{
    country?: number;
    city?: number;
    valuation?: number;
  } | null>(null);

  const handleDecryptProperty = async () => {
    if (!address || !contractAddress) {
      alert('Please connect your wallet');
      return;
    }

    try {
      setIsDecrypting(true);
      
      // This is a placeholder for the actual decryption process
      // In a real implementation, you would:
      // 1. Call getPropertyInfo contract method to get encrypted handles
      // 2. Use the FHE SDK to decrypt the values
      
      // For now, we'll show a placeholder
      alert('Property decryption would happen here. You need to implement the full decryption flow with contract calls.');
      
    } catch (error) {
      console.error('Error decrypting property:', error);
      alert('Failed to decrypt property data.');
    } finally {
      setIsDecrypting(false);
    }
  };

  if (fheLoading) {
    return (
      <div className="property-info">
        <h2>Your Property Information</h2>
        <p>Loading FHE system...</p>
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
        disabled={isDecrypting}
        className="decrypt-button"
      >
        {isDecrypting ? 'Decrypting...' : 'Decrypt Property Data'}
      </button>

      {decryptedData && (
        <div className="decrypted-data">
          <h3>Decrypted Property Data:</h3>
          <div className="data-item">
            <strong>Country Code:</strong> {decryptedData.country}
          </div>
          <div className="data-item">
            <strong>City Code:</strong> {decryptedData.city}
          </div>
          <div className="data-item">
            <strong>Valuation:</strong> ${decryptedData.valuation?.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};