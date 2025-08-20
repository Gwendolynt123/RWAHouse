import React, { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useChainId } from 'wagmi';
import { useFHE } from '../hooks/useFHE';
import { useRWAHouse } from '../hooks/useRWAHouse';

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
  const { createEncryptedInput, isLoading: fheLoading, error: fheError,initFHE } = useFHE();
  const { storeProperty, writeStoreProperty, contractAddress } = useRWAHouse();

  const [formData, setFormData] = useState<PropertyData>({
    userAddress: '',
    country: 0,
    city: 0,
    valuation: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Monitor wallet connection and contract status
  useEffect(() => {
    console.log(`🔍 Wallet connected: ${!!address} (${address || 'None'})`);
  }, [address]);

  useEffect(() => {
    console.log(`🔍 Contract address: ${contractAddress || 'Not set'}`);
  }, [contractAddress]);

  useEffect(() => {
    console.log(`🔍 FHE loading: ${fheLoading}, FHE error: ${fheError || 'None'}`);
  }, [fheLoading, fheError]);

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
      
      // Add encrypted values
      console.log(`🔄 Adding encrypted values - country:${formData.country}, city:${formData.city}, valuation:${formData.valuation}`);
      input.add32(BigInt(formData.country));
      input.add32(BigInt(formData.city));
      input.add32(BigInt(formData.valuation));

      // Encrypt the input
      console.log('🔄 Starting encryption...');
      const encryptedInput = await input.encrypt();
      console.log('✅ Encryption completed');
      console.log(`🔍 Encrypted handles count: ${encryptedInput.handles.length}`);

      // Convert Uint8Array handles to proper uint256 format
      const convertHandleToUint256 = (handle: Uint8Array): string => {
        // Convert Uint8Array to hex string, then to BigInt
        const hexString = '0x' + Array.from(handle).map(b => b.toString(16).padStart(2, '0')).join('');
        return hexString;
      };

      console.log('🔄 Converting handles to uint256 format...');
      const handle1 = convertHandleToUint256(encryptedInput.handles[0]);
      const handle2 = convertHandleToUint256(encryptedInput.handles[1]); 
      const handle3 = convertHandleToUint256(encryptedInput.handles[2]);
      
      console.log(`🔍 Converted handles: ${handle1.slice(0,10)}..., ${handle2.slice(0,10)}..., ${handle3.slice(0,10)}...`);

      // Call the contract with user address
      console.log(`🔄 Calling contract function for user: ${formData.userAddress}`);
      let formattedProof: string;
      let proof:any= encryptedInput.inputProof
      if (typeof proof === 'string') {
        formattedProof = proof.startsWith('0x') ? proof : `0x${proof}`;
      } else if (proof instanceof Uint8Array) {
        formattedProof = `0x${Array.from(proof).map(b => b.toString(16).padStart(2, '0')).join('')}`;
      } else {
        formattedProof = `0x${proof.toString()}`;
      }
      
      writeStoreProperty(formData.userAddress, [
        handle1, // country
        handle2, // city
        handle3, // valuation
        formattedProof,
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

  if (fheLoading) {
    return (
      <div className="property-registration">
        <h2>Property Registration</h2>
        <button onClick={()=>initFHE(publicClient, chainId)}>Init FHE</button>

      </div>
    );
  }

  return (
    <div className="property-registration">
      <h2>Register Your Property</h2>
      <p>Store your property information securely on the blockchain using encrypted data.</p>
      <form onSubmit={handleSubmit} className="property-form">
        <div className="form-group">
          <label htmlFor="userAddress">User Address:</label>
          <input
            type="text"
            id="userAddress"
            value={formData.userAddress}
            onChange={(e) => handleInputChange('userAddress', e.target.value)}
            placeholder="0x..."
            pattern="^0x[a-fA-F0-9]{40}$"
            required
          />
          <small>Enter the Ethereum address for whom to store property information</small>
        </div>

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

      {/* Debug Information Panel */}
      <div className="debug-panel" style={{ 
        marginTop: '20px', 
        padding: '15px', 
        border: '2px solid #007acc', 
        borderRadius: '8px', 
        backgroundColor: '#f8f9fa',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0, color: '#007acc' }}>🛠️ Debug Information</h3>
          <button 
            onClick={() => setDebugInfo([])}
            style={{ 
              padding: '5px 10px', 
              fontSize: '10px', 
              border: '1px solid #007acc', 
              backgroundColor: 'white', 
              color: '#007acc',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
        </div>
        
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {debugInfo.length === 0 ? (
            <p style={{ margin: 0, color: '#666' }}>No debug information yet...</p>
          ) : (
            debugInfo.map((info, index) => (
              <div key={index} style={{ 
                marginBottom: '5px', 
                padding: '2px 0',
                borderBottom: '1px solid #e9ecef' 
              }}>
                {info}
              </div>
            ))
          )}
        </div>
        
        {/* Current Status */}
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
          <strong>Current Status:</strong>
          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
            <li>Wallet: {address ? `✅ Connected (${address.slice(0,6)}...${address.slice(-4)})` : '❌ Not connected'}</li>
            <li>Contract: {contractAddress ? `✅ Available (${contractAddress.slice(0,6)}...${contractAddress.slice(-4)})` : '❌ Not available'}</li>
            <li>FHE: {fheLoading ? '🔄 Loading' : fheError ? `❌ Error: ${fheError}` : '✅ Ready'}</li>
            <li>Transaction: {storeProperty.isPending ? '🔄 Pending' : storeProperty.isSuccess ? `✅ Success (${storeProperty.data})` : storeProperty.error ? `❌ Failed: ${storeProperty.error.message}` : '⏳ Ready'}</li>
          </ul>
        </div>
        
        {/* Additional Error Details */}
        {storeProperty.error && (
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fee', borderRadius: '4px', border: '1px solid #fcc' }}>
            <strong style={{ color: '#c33' }}>Transaction Error Details:</strong>
            <pre style={{ margin: '5px 0', fontSize: '10px', whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(storeProperty.error, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};