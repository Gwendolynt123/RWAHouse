import React, { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useChainId } from 'wagmi';
import { useFHE } from '../contexts/FHEContext';
import { useRWAHouse } from '../hooks/useRWAHouse';
import { COUNTRIES, CITIES, getCitiesByCountry } from '../data/locationCodes';

interface PropertyData {
  userAddress: string;
  country: number;
  city: number;
  valuation: number;
}

export const PropertyRegistration: React.FC = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const { createEncryptedInput, error: fheError, initFHE, instance: fheInstance, isInitializing } = useFHE();
  const { storeProperty, writeStoreProperty, contractAddress } = useRWAHouse();

  const [formData, setFormData] = useState<PropertyData>({
    userAddress: '',
    country: 0,
    city: 0,
    valuation: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState(CITIES.filter(city => city.countryCode === 1)); // Default to US cities

  // Monitor wallet connection and contract status
  useEffect(() => {
    console.log(`🔍 Wallet connected: ${!!address} (${address || 'None'})`);
  }, [address]);

  useEffect(() => {
    console.log(`🔍 Contract address: ${contractAddress || 'Not set'}`);
  }, [contractAddress]);

  useEffect(() => {
    console.log(`🔍 FHE is null: ${fheInstance == null}, FHE error: ${fheError || 'None'}, FHE initializing: ${isInitializing}`);
  }, [fheInstance, fheError, isInitializing]);

  useEffect(() => {
    if (storeProperty.error) {
      console.log(`❌ Store property error: ${storeProperty.error.message}`);
    }
    if (storeProperty.isSuccess) {
      console.log(`✅ Store property success! Hash: ${storeProperty.data}`);
    }
    if (storeProperty.isPending) {
      console.log(`🔄 Store property transaction pending...`);
    }
  }, [storeProperty.error, storeProperty.isSuccess, storeProperty.isPending, storeProperty.data]);

  const handleInputChange = (field: keyof PropertyData, value: string) => {
    if (field === 'userAddress') {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    } else if (field === 'country') {
      const countryCode = parseInt(value) || 0;
      const citiesForCountry = getCitiesByCountry(countryCode);
      setAvailableCities(citiesForCountry);
      
      setFormData(prev => ({
        ...prev,
        country: countryCode,
        city: 0, // Reset city selection
      }));
    } else {
      const numValue = parseInt(value) || 0;
      setFormData(prev => ({
        ...prev,
        [field]: numValue,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🔍 Form submission started');
    console.log(`🔍 Current form data: ${JSON.stringify(formData)}`);

    if (!address || !contractAddress) {
      console.log('❌ Missing wallet or contract address');
      alert('Please connect your wallet');
      return;
    }

    if (!formData.userAddress || formData.country === 0 || formData.city === 0 || formData.valuation === 0) {
      console.log('❌ Invalid form data - missing required fields');
      alert('Please fill in all fields with valid values');
      return;
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(formData.userAddress)) {
      console.log(`❌ Invalid Ethereum address format: ${formData.userAddress}`);
      alert('Please enter a valid Ethereum address');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('🔄 Starting encryption process...');

      // Create encrypted input
      console.log('🔄 Creating encrypted input...');
      const input = createEncryptedInput(contractAddress, address);

      // Add encrypted values - show both names and codes for verification
      const selectedCountry = COUNTRIES.find(c => c.code === formData.country);
      const selectedCity = availableCities.find(c => c.code === formData.city);
      console.log(`🔄 Adding encrypted values:`);
      console.log(`   Country: ${selectedCountry?.name} - Code: ${formData.country}`);
      console.log(`   City: ${selectedCity?.name} - Code: ${formData.city}`);
      console.log(`   Valuation: $${formData.valuation.toLocaleString()}`);
      
      input.add32(formData.country);
      input.add32(formData.city);
      input.add32(formData.valuation);

      // Encrypt the input
      console.log('🔄 Starting encryption...');
      const encryptedInput = await input.encrypt();
      console.log('✅ Encryption completed');
      console.log(`🔍 Encrypted handles count: ${encryptedInput.handles.length}`);

      // Convert Uint8Array handles to proper uint256 format
      const convertHandleToUint256 = (handle: any): string => {
        let formattedHandle: string;
        if (typeof handle === 'string') {
          formattedHandle = handle.startsWith('0x') ? handle : `0x${handle}`;
        } else if (handle instanceof Uint8Array) {
          formattedHandle = `0x${Array.from(handle).map(b => b.toString(16).padStart(2, '0')).join('')}`;
        } else {
          formattedHandle = `0x${handle.toString()}`;
        }
        return formattedHandle
      };

      console.log('🔄 Converting handles to uint256 format...');
      const handle1 = convertHandleToUint256(encryptedInput.handles[0]);
      const handle2 = convertHandleToUint256(encryptedInput.handles[1]);
      const handle3 = convertHandleToUint256(encryptedInput.handles[2]);

      console.log(`🔍 Converted handles: ${handle1.slice(0, 10)}..., ${handle2.slice(0, 10)}..., ${handle3.slice(0, 10)}...`);

      // Call the contract with user address
      console.log(`🔄 Calling contract function for user: ${formData.userAddress}`);
      let formattedProof: string;
      let proof: any = encryptedInput.inputProof
      if (typeof proof === 'string') {
        formattedProof = proof.startsWith('0x') ? proof : `0x${proof}`;
      } else if (proof instanceof Uint8Array) {
        formattedProof = `0x${Array.from(proof).map(b => b.toString(16).padStart(2, '0')).join('')}`;
      } else {
        formattedProof = `0x${proof.toString()}`;
      }

      writeStoreProperty(formData.userAddress, [
        handle1 as `0x${string}`, // country
        handle2 as `0x${string}`, // city
        handle3 as `0x${string}`, // valuation
        formattedProof as `0x${string}`,
      ]);

      console.log('✅ Contract call initiated');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`❌ Error during property storage: ${errorMessage}`);
      alert(`Failed to store property: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
      console.log('🔄 Form submission process completed');
    }
  };


  return (
    <div>
      {fheInstance == null ?
        <div className="luxury-card text-center">
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🏗️</div>
          <h2 style={{ fontSize: '1.5rem', margin: '0 0 12px 0' }}>Property Registration</h2>
          <p style={{ fontSize: '0.9rem' }}>Initialize the FHE system to begin secure property registration</p>
          <button
            onClick={() => initFHE(publicClient, chainId)}
            disabled={isInitializing}
            className={isInitializing ? "btn-secondary" : "btn-premium"}
            style={{ marginTop: '15px', fontSize: '0.9rem', padding: '10px 20px' }}
          >
            {isInitializing ? (
              <>
                <div className="luxury-spinner" style={{ width: '16px', height: '16px', marginRight: '8px' }}></div>
                Initializing FHE...
              </>
            ) : (
              <>
                <span style={{ fontSize: '16px', marginRight: '6px' }}>🔐</span>
                Initialize FHE System
              </>
            )}
          </button>
        </div> :
        <div>
          <div className="luxury-card">
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🏗️</div>
              <h2 style={{ fontSize: '1.5rem', margin: '0 0 12px 0' }}>Property Registration</h2>
              <p style={{ 
                fontSize: '1rem',
                color: 'var(--color-platinum)',
                maxWidth: '500px',
                margin: '0 auto'
              }}>
                Store property information securely on the blockchain using encrypted data
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ maxWidth: '500px', margin: '0 auto' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="userAddress">
                  <span style={{ fontSize: '18px', marginRight: '6px' }}>👤</span>
                  Property Owner Address
                </label>
                <input
                  type="text"
                  id="userAddress"
                  value={formData.userAddress}
                  onChange={(e) => handleInputChange('userAddress', e.target.value)}
                  placeholder="0x1234567890abcdef1234567890abcdef12345678"
                  pattern="^0x[a-fA-F0-9]{40}$"
                  required
                  className="luxury-input"
                />
                <span className="form-hint">Enter the property owner's Ethereum address</span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="country">
                  <span style={{ fontSize: '18px', marginRight: '6px' }}>🌍</span>
                  Country
                </label>
                <select
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  required
                  className="luxury-select"
                >
                  <option value={0}>Select Country</option>
                  {COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
                <span className="form-hint">Select the country where the property is located</span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="city">
                  <span style={{ fontSize: '18px', marginRight: '6px' }}>🏙️</span>
                  City
                </label>
                <select
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  required
                  disabled={formData.country === 0 || availableCities.length === 0}
                  className="luxury-select"
                  style={{
                    opacity: formData.country === 0 ? 0.6 : 1,
                    cursor: formData.country === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <option value={0}>
                    {formData.country === 0 ? 'Please select country first' : 'Select City'}
                  </option>
                  {availableCities.map((city) => (
                    <option key={city.code} value={city.code}>
                      {city.name}
                    </option>
                  ))}
                </select>
                <span className="form-hint">Select the city where the property is located</span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="valuation">
                  <span style={{ fontSize: '20px', marginRight: '8px' }}>💰</span>
                  Property Valuation (USD)
                </label>
                <input
                  type="number"
                  id="valuation"
                  value={formData.valuation}
                  onChange={(e) => handleInputChange('valuation', e.target.value)}
                  placeholder="e.g., 500,000"
                  min="1"
                  required
                  className="luxury-input"
                />
                <span className="form-hint">Enter the current market value of the property in USD</span>
              </div>

              <div style={{ textAlign: 'center', marginTop: '40px' }}>
                <button
                  type="submit"
                  disabled={isSubmitting || storeProperty.isPending || !address}
                  className="btn-premium"
                  style={{ 
                    fontSize: '1.1rem',
                    padding: '20px 50px',
                    opacity: (isSubmitting || storeProperty.isPending || !address) ? 0.6 : 1
                  }}
                >
                  {isSubmitting || storeProperty.isPending ? (
                    <>
                      <div className="luxury-spinner" style={{ width: '24px', height: '24px', marginRight: '12px' }}></div>
                      Storing Property...
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '20px', marginRight: '10px' }}>🔒</span>
                      Store Property Information
                    </>
                  )}
                </button>
              </div>
            </form>

            {!address && (
              <div style={{
                marginTop: '30px',
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(224, 17, 95, 0.1) 0%, rgba(224, 17, 95, 0.05) 100%)',
                border: '2px solid rgba(224, 17, 95, 0.2)',
                borderRadius: '16px',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '24px', marginRight: '10px' }}>⚠️</span>
                <strong>Please connect your wallet to register a property.</strong>
              </div>
            )}
          </div>

          {/* Luxury Debug Information Panel */}
          <div className="luxury-card" style={{
            marginTop: '40px',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '20px' 
            }}>
              <h3 style={{ 
                margin: 0, 
                color: 'var(--color-sapphire)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '24px' }}>🛠️</span>
                Debug Information
              </h3>
              <button
                onClick={() => setDebugInfo([])}
                className="btn-secondary"
                style={{
                  padding: '8px 16px',
                  fontSize: '12px'
                }}
              >
                Clear Logs
              </button>
            </div>

            <div style={{ 
              maxHeight: '200px', 
              overflowY: 'auto',
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 215, 0, 0.1)',
              borderRadius: '12px',
              padding: '15px'
            }}>
              {debugInfo.length === 0 ? (
                <p style={{ 
                  margin: 0, 
                  color: 'var(--color-silver)',
                  fontStyle: 'italic',
                  textAlign: 'center'
                }}>
                  No debug information yet...
                </p>
              ) : (
                debugInfo.map((info, index) => (
                  <div key={index} style={{
                    marginBottom: '8px',
                    padding: '4px 0',
                    borderBottom: '1px solid rgba(255, 215, 0, 0.1)',
                    color: 'var(--color-platinum)',
                    lineHeight: '1.4'
                  }}>
                    {info}
                  </div>
                ))
              )}
            </div>

            {/* Luxury Status Section */}
            <div style={{ 
              marginTop: '25px', 
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
              border: '1px solid rgba(255, 215, 0, 0.1)',
              borderRadius: '16px'
            }}>
              <h4 style={{ 
                margin: '0 0 15px 0',
                color: 'var(--color-ivory)',
                fontSize: '1.1rem'
              }}>
                Current Status:
              </h4>
              
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>
                    {address ? '✅' : '❌'}
                  </span>
                  <span style={{ color: 'var(--color-platinum)' }}>
                    <strong>Wallet:</strong> {address ? 
                      `Connected (${address.slice(0, 6)}...${address.slice(-4)})` : 
                      'Not connected'
                    }
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>
                    {contractAddress ? '✅' : '❌'}
                  </span>
                  <span style={{ color: 'var(--color-platinum)' }}>
                    <strong>Contract:</strong> {contractAddress ? 
                      `Available (${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)})` : 
                      'Not available'
                    }
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>
                    {fheInstance == null ? (isInitializing ? '🔄' : '⏳') : fheError ? '❌' : '✅'}
                  </span>
                  <span style={{ color: 'var(--color-platinum)' }}>
                    <strong>FHE:</strong> {
                      fheInstance == null ? 
                        (isInitializing ? 'Initializing' : 'Not initialized') : 
                        fheError ? `Error: ${fheError}` : 'Ready'
                    }
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>
                    {storeProperty.isPending ? '🔄' : 
                     storeProperty.isSuccess ? '✅' : 
                     storeProperty.error ? '❌' : '⏳'}
                  </span>
                  <span style={{ color: 'var(--color-platinum)' }}>
                    <strong>Transaction:</strong> {
                      storeProperty.isPending ? 'Pending' : 
                      storeProperty.isSuccess ? `Success (${storeProperty.data})` : 
                      storeProperty.error ? `Failed: ${storeProperty.error.message}` : 'Ready'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Enhanced Error Details */}
            {storeProperty.error && (
              <div style={{ 
                marginTop: '20px', 
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(224, 17, 95, 0.1) 0%, rgba(224, 17, 95, 0.05) 100%)',
                border: '2px solid rgba(224, 17, 95, 0.2)',
                borderRadius: '16px'
              }}>
                <h4 style={{ 
                  color: 'var(--color-ruby)', 
                  margin: '0 0 10px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '20px' }}>🚨</span>
                  Transaction Error Details:
                </h4>
                <pre style={{ 
                  margin: '10px 0 0 0', 
                  fontSize: '11px', 
                  whiteSpace: 'pre-wrap',
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '15px',
                  borderRadius: '8px',
                  color: 'var(--color-platinum)',
                  lineHeight: '1.4',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(storeProperty.error, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>}
    </div>

  );
};