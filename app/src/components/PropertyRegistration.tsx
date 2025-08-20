import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useFHE } from '../hooks/useFHE';
import { useRWAHouse } from '../hooks/useRWAHouse';

interface PropertyData {
  country: number;
  city: number;
  valuation: number;
}

export const PropertyRegistration: React.FC = () => {
  const { address } = useAccount();
  const { createEncryptedInput, isLoading: fheLoading } = useFHE();
  const { storeProperty, writeStoreProperty, contractAddress } = useRWAHouse();

  const [formData, setFormData] = useState<PropertyData>({
    country: 0,
    city: 0,
    valuation: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof PropertyData, value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({
      ...prev,
      [field]: numValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address || !contractAddress) {
      alert('Please connect your wallet');
      return;
    }

    if (formData.country === 0 || formData.city === 0 || formData.valuation === 0) {
      alert('Please fill in all fields with valid values');
      return;
    }

    try {
      setIsSubmitting(true);

      // Create encrypted input
      const input = createEncryptedInput(contractAddress, address);
      
      // Add encrypted values
      input.add32(BigInt(formData.country));
      input.add32(BigInt(formData.city));
      input.add32(BigInt(formData.valuation));

      // Encrypt the input
      const encryptedInput = await input.encrypt();

      // Call the contract
      writeStoreProperty([
        encryptedInput.handles[0], // country
        encryptedInput.handles[1], // city
        encryptedInput.handles[2], // valuation
        encryptedInput.inputProof,
      ]);

    } catch (error) {
      console.error('Error storing property:', error);
      alert('Failed to store property. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (fheLoading) {
    return (
      <div className="property-registration">
        <h2>Property Registration</h2>
        <p>Loading FHE system...</p>
      </div>
    );
  }

  return (
    <div className="property-registration">
      <h2>Register Your Property</h2>
      <p>Store your property information securely on the blockchain using encrypted data.</p>
      
      <form onSubmit={handleSubmit} className="property-form">
        <div className="form-group">
          <label htmlFor="country">Country Code:</label>
          <input
            type="number"
            id="country"
            value={formData.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            placeholder="e.g., 1 for USA, 86 for China"
            min="1"
            required
          />
          <small>Use numeric country codes (e.g., 1 for USA, 86 for China)</small>
        </div>

        <div className="form-group">
          <label htmlFor="city">City Code:</label>
          <input
            type="number"
            id="city"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            placeholder="e.g., 1 for New York, 2 for Los Angeles"
            min="1"
            required
          />
          <small>Use numeric city codes within your country</small>
        </div>

        <div className="form-group">
          <label htmlFor="valuation">Property Valuation (USD):</label>
          <input
            type="number"
            id="valuation"
            value={formData.valuation}
            onChange={(e) => handleInputChange('valuation', e.target.value)}
            placeholder="e.g., 500000"
            min="1"
            required
          />
          <small>Property value in USD</small>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting || storeProperty.isPending || !address}
          className="submit-button"
        >
          {isSubmitting || storeProperty.isPending ? 'Storing Property...' : 'Store Property Info'}
        </button>
      </form>

      {!address && (
        <p className="warning">Please connect your wallet to register a property.</p>
      )}
    </div>
  );
};