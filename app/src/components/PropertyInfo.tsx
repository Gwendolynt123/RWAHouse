import React, { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { useFHE } from '../contexts/FHEContext';
import { useRWAHouse } from '../hooks/useRWAHouse';
import { getCountryName, getCityName } from '../data/locationCodes';

// Format currency helper
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

// Lending and Real Estate Companies
interface Company {
  id: string;
  name: string;
  address: string;
  description: string;
  type: 'lending' | 'real_estate';
}

const COMPANIES: Company[] = [
  {
    id: '1',
    name: 'Prime Capital Lending',
    address: '0xdcaa8735f58F247E39Ab18301f3221d39b76a8af',
    description: 'Leading mortgage lender specializing in residential and commercial property financing with over 20 years of experience.',
    type: 'lending'
  },
  {
    id: '2',
    name: 'SecureHome Finance',
    address: '0x8B4A2E4F3D9C1B7A6E5F8D2C4A9B7E3F1C5D8A92',
    description: 'Digital-first lending platform offering competitive rates for home purchases and refinancing.',
    type: 'lending'
  },
  {
    id: '3',
    name: 'Liberty Real Estate Group',
    address: '0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B',
    description: 'Full-service real estate company providing property valuation, investment consulting, and asset management.',
    type: 'real_estate'
  },
  {
    id: '4',
    name: 'Global Property Trust',
    address: '0x9F8E7D6C5B4A3928F7E6D5C4B3A2918E7D6C5B4A',
    description: 'International property investment firm focusing on high-value residential and commercial assets.',
    type: 'real_estate'
  },
  {
    id: '5',
    name: 'NextGen Mortgage Solutions',
    address: '0x3C2D1E0F9A8B7C6D5E4F3210987654321ABCDEF0',
    description: 'Innovative mortgage provider using blockchain technology for transparent and efficient lending processes.',
    type: 'lending'
  },
  {
    id: '6',
    name: 'Pinnacle Realty Partners',
    address: '0x5A4B3C2D1E0F9876543210FEDCBA9876543210FE',
    description: 'Premium real estate advisory firm specializing in luxury properties and investment portfolio management.',
    type: 'real_estate'
  }
];

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
    authorizeQuery,
    writeAuthorizeQuery,
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

  // Authorization form state
  const [authForm, setAuthForm] = useState({
    requester: '',
    queryType: '0', // 0=COUNTRY, 1=CITY, 2=VALUATION
  });
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const handleDecryptProperty = async () => {
    if (!address || !contractAddress || !fheInstance || !walletClient) {
      alert('Please ensure your wallet is connected and FHE is initialized');
      return;
    }

    try {
      setIsDecrypting(true);

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
        domain: eip712.domain as any,
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
        country: typeof decryptedCountry === 'bigint' ? Number(decryptedCountry) : Number(decryptedCountry),
        city: typeof decryptedCity === 'bigint' ? Number(decryptedCity) : Number(decryptedCity),
        valuation: typeof decryptedValuation === 'bigint' ? Number(decryptedValuation) : Number(decryptedValuation),
      });

      console.log('✅ Property decryption completed successfully!');

    } catch (error) {
      console.error('❌ Error decrypting property:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown decryption error';
      console.error(errorMessage);
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleAuthorizeQuery = () => {
    if (!authForm.requester) {
      alert('Please enter requester address');
      return;
    }

    writeAuthorizeQuery([authForm.requester as `0x${string}`, parseInt(authForm.queryType)]);
  };

  if (fheLoading || !fheInstance) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #000000, #1a0f1a), linear-gradient(135deg, #0a0a0f 0%, #1f1f2e 50%, #0a0a0f 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '120px',
            height: '120px',
            margin: '0 auto 30px',
            background: 'conic-gradient(from 0deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57, #ff9ff3, #ff6b6b)',
            borderRadius: '50%',
            animation: 'spin 3s linear infinite',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: '#000000',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '30px'
            }}>
              🏰
            </div>
          </div>
          <h2 style={{ fontSize: '2rem', marginBottom: '10px', background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Initializing Luxury Estate Platform
          </h2>
          <p style={{ color: '#8892b0', fontSize: '1.1rem' }}>
            {fheLoading ? 'Loading premium security protocols...' : 'Please initialize the security system first'}
          </p>
        </div>
      </div>
    );
  }

  if (!address) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at center, #1a0d2e, #000000), linear-gradient(135deg, #0a0a0f 0%, #1f1f2e 50%, #0a0a0f 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '600px', padding: '0 20px' }}>
          <div style={{ fontSize: '100px', marginBottom: '30px' }}>🔐</div>
          <h2 style={{
            fontSize: '3rem',
            marginBottom: '20px',
            background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '800'
          }}>
            Premium Access Required
          </h2>
          <p style={{ color: '#8892b0', fontSize: '1.3rem', lineHeight: '1.6' }}>
            Connect your exclusive wallet to access your luxury property portfolio
          </p>
        </div>
      </div>
    );
  }

  if (!hasProperty) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at center, #2d1b5a, #000000), linear-gradient(135deg, #0a0a0f 0%, #1f1f2e 50%, #0a0a0f 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '700px', padding: '0 20px' }}>
          <div style={{ fontSize: '120px', marginBottom: '30px' }}>🏛️</div>
          <h2 style={{
            fontSize: '3.5rem',
            marginBottom: '20px',
            background: 'linear-gradient(45deg, #ffd700, #ff6b6b, #4ecdc4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '900'
          }}>
            No Properties Found
          </h2>
          <p style={{ color: '#8892b0', fontSize: '1.4rem', lineHeight: '1.6' }}>
            Register your first premium property to begin your luxury portfolio journey
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `
        radial-gradient(ellipse 80% 80% at 50% -20%, rgba(120, 119, 198, 0.3), transparent),
        radial-gradient(ellipse 80% 80% at 80% 50%, rgba(255, 107, 107, 0.15), transparent),
        radial-gradient(ellipse 80% 80% at 20% 50%, rgba(78, 205, 196, 0.15), transparent),
        linear-gradient(135deg, #0a0a0f 0%, #1a0d2e 25%, #2d1b5a 50%, #1a0d2e 75%, #0a0a0f 100%)
      `,
      padding: '0',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Animated Background Elements */}
      <div style={{
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        background: `
          radial-gradient(circle at 20% 30%, rgba(255, 107, 107, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(78, 205, 196, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, rgba(69, 183, 209, 0.1) 0%, transparent 50%)
        `,
        animation: 'float 20s ease-in-out infinite'
      }} />

      {/* Main Content Container */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '40px 20px',
        position: 'relative',
        zIndex: 1
      }}>

        {/* Luxury Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '60px',
          padding: '60px 40px',
          background: `
            linear-gradient(135deg, 
              rgba(255, 255, 255, 0.1) 0%, 
              rgba(255, 255, 255, 0.05) 50%, 
              rgba(255, 255, 255, 0.02) 100%
            )
          `,
          backdropFilter: 'blur(20px)',
          borderRadius: '30px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: `
            0 40px 80px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 0 100px rgba(120, 119, 198, 0.2)
          `,
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100px',
            height: '6px',
            background: 'linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #ffd700)',
            borderRadius: '3px',
            boxShadow: '0 0 20px rgba(255, 107, 107, 0.5)'
          }} />

          <div style={{
            fontSize: '120px',
            marginBottom: '20px',
            filter: 'drop-shadow(0 0 30px rgba(255, 215, 0, 0.5))'
          }}>🏰</div>

          <h1 style={{
            fontSize: 'clamp(3rem, 8vw, 6rem)',
            fontWeight: '900',
            marginBottom: '20px',
            background: 'linear-gradient(45deg, #ffd700, #ff6b6b, #4ecdc4, #45b7d1, #ff9ff3)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 60px rgba(255, 215, 0, 0.3)',
            letterSpacing: '2px',
            backgroundSize: '200% 200%',
            animation: 'gradient 8s ease infinite'
          }}>
            LUXURY ESTATE PORTFOLIO
          </h1>

          <div style={{
            height: '4px',
            width: '200px',
            margin: '30px auto',
            background: 'linear-gradient(90deg, #ffd700, #ff6b6b, #4ecdc4)',
            borderRadius: '2px',
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)'
          }} />

          <p style={{
            color: '#b8c5d1',
            fontSize: 'clamp(1.1rem, 3vw, 1.5rem)',
            fontWeight: '300',
            letterSpacing: '1px',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Confidential High-Value Asset Management Platform
          </p>
        </div>

        {/* Property Information Card */}
        <div style={{
          background: `
            linear-gradient(135deg, 
              rgba(255, 255, 255, 0.08) 0%, 
              rgba(255, 255, 255, 0.02) 50%, 
              rgba(255, 255, 255, 0.08) 100%
            )
          `,
          backdropFilter: 'blur(30px)',
          borderRadius: '30px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: `
            0 30px 60px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 0 80px rgba(78, 205, 196, 0.15)
          `,
          marginBottom: '20px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {/* Top Accent */}
          <div style={{
            height: '4px',
            background: 'linear-gradient(90deg, #ffd700, #ff6b6b, #4ecdc4, #45b7d1)',
            backgroundSize: '300% 100%',
            animation: 'slideGradient 8s linear infinite'
          }} />

          <div style={{ padding: '25px' }}>
            {/* Property Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px',
              gap: '15px'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '15px',
                background: 'linear-gradient(135deg, #ffd700, #ff6b6b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '30px',
                boxShadow: '0 15px 30px rgba(255, 215, 0, 0.3)'
              }}>
                💎
              </div>
              <div>
                <h2 style={{
                  margin: '0',
                  color: '#ffffff',
                  fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
                  fontWeight: '700',
                  letterSpacing: '0.5px'
                }}>
                  Premium Property Assets
                </h2>
                <p style={{
                  margin: '4px 0 0 0',
                  color: '#8892b0',
                  fontSize: '0.9rem',
                  fontWeight: '300'
                }}>
                  {decryptedData ? '✨ Decrypted & Authenticated' : '🔐 Encrypted & Secured'}
                </p>
              </div>
            </div>

            {/* Property Data Grid */}
            <div style={{
              display: 'grid',
              gap: '15px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              marginBottom: '20px'
            }}>
              {/* Country Card */}
              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.15) 0%, rgba(255, 107, 107, 0.05) 100%)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 107, 107, 0.2)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 15px 30px rgba(255, 107, 107, 0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '24px' }}>🌍</span>
                  <strong style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: '600' }}>Location</strong>
                </div>
                <div style={{
                  color: decryptedData ? '#ff6b6b' : '#6b7280',
                  fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
                  fontWeight: '700',
                  fontFamily: 'Monaco, monospace',
                  textShadow: decryptedData ? '0 0 8px rgba(255, 107, 107, 0.3)' : 'none'
                }}>
                  {decryptedData ? getCountryName(decryptedData.country!) : '████████████'}
                </div>
              </div>

              {/* City Card */}
              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.15) 0%, rgba(78, 205, 196, 0.05) 100%)',
                borderRadius: '20px',
                border: '1px solid rgba(78, 205, 196, 0.2)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 15px 30px rgba(78, 205, 196, 0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '24px' }}>🏙️</span>
                  <strong style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: '600' }}>District</strong>
                </div>
                <div style={{
                  color: decryptedData ? '#4ecdc4' : '#6b7280',
                  fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
                  fontWeight: '700',
                  fontFamily: 'Monaco, monospace',
                  textShadow: decryptedData ? '0 0 8px rgba(78, 205, 196, 0.3)' : 'none'
                }}>
                  {decryptedData ? getCityName(decryptedData.city!) : '███████████'}
                </div>
              </div>

              {/* Valuation Card */}
              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 215, 0, 0.05) 100%)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 215, 0, 0.2)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 15px 30px rgba(255, 215, 0, 0.1)',
                gridColumn: 'span 2'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                  <span style={{ fontSize: '30px' }}>💰</span>
                  <strong style={{ color: '#ffffff', fontSize: '1.3rem', fontWeight: '600' }}>Asset Valuation</strong>
                </div>
                <div style={{
                  color: decryptedData ? '#ffd700' : '#6b7280',
                  fontSize: 'clamp(2rem, 5vw, 3rem)',
                  fontWeight: '900',
                  fontFamily: 'Monaco, monospace',
                  textShadow: decryptedData ? '0 0 20px rgba(255, 215, 0, 0.4)' : 'none'
                }}>
                  {decryptedData ? formatCurrency(decryptedData.valuation!) : '$██,███,███'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decrypt Action */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <button
            onClick={handleDecryptProperty}
            disabled={isDecrypting || !encryptedPropertyData}
            style={{
              padding: '20px 60px',
              background: isDecrypting
                ? 'linear-gradient(135deg, #4b5563 0%, #374151 100%)'
                : 'linear-gradient(135deg, #ffd700 0%, #ff6b6b 50%, #4ecdc4 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '60px',
              cursor: isDecrypting ? 'not-allowed' : 'pointer',
              fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
              fontWeight: '700',
              boxShadow: isDecrypting
                ? 'none'
                : '0 20px 40px rgba(255, 215, 0, 0.3), 0 0 60px rgba(255, 107, 107, 0.2)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isDecrypting ? 'scale(0.95)' : 'scale(1)',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <span style={{ position: 'relative', zIndex: 2 }}>
              {isDecrypting ? (
                <>🔄 Decrypting Premium Assets...</>
              ) : (
                <>🔓 Unlock Property Vault</>
              )}
            </span>
          </button>
        </div>

        {/* Authorization Section */}
        <div style={{
          background: `
            linear-gradient(135deg, 
              rgba(255, 255, 255, 0.08) 0%, 
              rgba(255, 255, 255, 0.02) 50%, 
              rgba(255, 255, 255, 0.08) 100%
            )
          `,
          backdropFilter: 'blur(30px)',
          borderRadius: '40px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: `
            0 50px 100px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 0 120px rgba(69, 183, 209, 0.15)
          `,
          overflow: 'hidden',
          position: 'relative'
        }}>
          {/* Top Accent */}
          <div style={{
            height: '6px',
            background: 'linear-gradient(90deg, #45b7d1, #4ecdc4, #ffd700)',
            backgroundSize: '300% 100%',
            animation: 'slideGradient 8s linear infinite'
          }} />

          <div style={{ padding: '50px' }}>
            {/* Authorization Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '40px',
              gap: '25px'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #45b7d1, #4ecdc4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                boxShadow: '0 20px 40px rgba(69, 183, 209, 0.3)'
              }}>
                🛡️
              </div>
              <div>
                <h2 style={{
                  margin: '0',
                  color: '#ffffff',
                  fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                  fontWeight: '700',
                  letterSpacing: '1px'
                }}>
                  Exclusive Access Control
                </h2>
                <p style={{
                  margin: '8px 0 0 0',
                  color: '#8892b0',
                  fontSize: '1.1rem',
                  fontWeight: '300'
                }}>
                  Grant selective permissions to premium partners
                </p>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gap: '30px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))'
            }}>
              {/* Company Selection */}
              <div style={{ position: 'relative' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '15px',
                  color: '#ffffff',
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  letterSpacing: '0.5px'
                }}>
                  🏢 Select Premium Partner:
                </label>
                <select
                  value={authForm.requester}
                  onChange={(e) => {
                    const company = COMPANIES.find(c => c.address === e.target.value);
                    setAuthForm(prev => ({ ...prev, requester: e.target.value }));
                    setSelectedCompany(company || null);
                  }}
                  style={{
                    width: '100%',
                    padding: '20px 25px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '2px solid rgba(69, 183, 209, 0.3)',
                    borderRadius: '20px',
                    fontSize: '1.1rem',
                    color: '#ffffff',
                    backdropFilter: 'blur(20px)',
                    fontWeight: '500'
                  }}
                >
                  <option value="" style={{ background: '#1a1a2e', color: '#ffffff' }}>Select a premium partner...</option>
                  {COMPANIES.map(company => (
                    <option key={company.id} value={company.address} style={{ background: '#1a1a2e', color: '#ffffff' }}>
                      {company.name} ({company.type === 'lending' ? 'Elite Lending' : 'Luxury Real Estate'})
                    </option>
                  ))}
                </select>

                {selectedCompany && (
                  <div style={{
                    marginTop: '20px',
                    padding: '25px',
                    background: 'linear-gradient(135deg, rgba(69, 183, 209, 0.15) 0%, rgba(78, 205, 196, 0.08) 100%)',
                    border: '1px solid rgba(69, 183, 209, 0.3)',
                    borderRadius: '20px',
                    backdropFilter: 'blur(20px)'
                  }}>
                    <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <strong style={{ color: '#ffffff', fontSize: '1.2rem' }}>🏢 {selectedCompany.name}</strong>
                      <span style={{
                        padding: '6px 15px',
                        background: selectedCompany.type === 'lending'
                          ? 'linear-gradient(135deg, #ffd700, #ff6b6b)'
                          : 'linear-gradient(135deg, #4ecdc4, #45b7d1)',
                        color: 'white',
                        borderRadius: '15px',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}>
                        {selectedCompany.type === 'lending' ? '💰 ELITE LENDING' : '🏠 LUXURY REALTY'}
                      </span>
                    </div>
                    <div style={{ marginBottom: '12px', fontSize: '1rem', color: '#b8c5d1' }}>
                      <strong>📍 Contract:</strong>
                      <code style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        padding: '6px 12px',
                        borderRadius: '10px',
                        fontSize: '0.9rem',
                        color: '#4ecdc4',
                        marginLeft: '10px',
                        border: '1px solid rgba(78, 205, 196, 0.2)',
                        fontWeight: '600'
                      }}>
                        {selectedCompany.address}
                      </code>
                    </div>
                    <div style={{ fontSize: '1rem', color: '#9ca3af', lineHeight: '1.6' }}>
                      <strong>ℹ️ Profile:</strong> {selectedCompany.description}
                    </div>
                  </div>
                )}
              </div>

              {/* Query Type Selection */}
              <div style={{ position: 'relative' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '15px',
                  color: '#ffffff',
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  letterSpacing: '0.5px'
                }}>
                  🎯 Access Level:
                </label>
                <select
                  value={authForm.queryType}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, queryType: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '20px 25px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '2px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '20px',
                    fontSize: '1.1rem',
                    color: '#ffffff',
                    backdropFilter: 'blur(20px)',
                    fontWeight: '500'
                  }}
                >
                  <option value="0" style={{ background: '#1a1a2e', color: '#ffffff' }}>🌍 Geographic Intelligence</option>
                  <option value="1" style={{ background: '#1a1a2e', color: '#ffffff' }}>🏙️ Metropolitan Analysis</option>
                  <option value="2" style={{ background: '#1a1a2e', color: '#ffffff' }}>💎 Valuation Intelligence</option>
                </select>

                <div style={{
                  marginTop: '15px',
                  padding: '15px',
                  background: 'linear-gradient(135deg, rgba(120, 119, 198, 0.15) 0%, rgba(139, 92, 246, 0.08) 100%)',
                  border: '1px solid rgba(120, 119, 198, 0.2)',
                  borderRadius: '15px',
                  fontSize: '0.95rem',
                  color: '#c7d2fe'
                }}>
                  <strong>🔒 Privacy Guarantee:</strong> Partners receive only binary verification results, never specific property details.
                  Example: Confirmation of geographic criteria without revealing exact location.
                </div>
              </div>
            </div>

            {/* Authorization Button */}
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <button
                onClick={handleAuthorizeQuery}
                disabled={authorizeQuery.isPending || !authForm.requester}
                style={{
                  padding: '18px 50px',
                  background: authorizeQuery.isPending || !authForm.requester
                    ? 'linear-gradient(135deg, #4b5563 0%, #374151 100%)'
                    : 'linear-gradient(135deg, #45b7d1 0%, #4ecdc4 50%, #ffd700 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50px',
                  cursor: authorizeQuery.isPending || !authForm.requester ? 'not-allowed' : 'pointer',
                  fontSize: '1.2rem',
                  fontWeight: '700',
                  boxShadow: authorizeQuery.isPending || !authForm.requester
                    ? 'none'
                    : '0 20px 40px rgba(69, 183, 209, 0.3), 0 0 60px rgba(78, 205, 196, 0.2)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}
              >
                {authorizeQuery.isPending ? '⏳ Processing Authorization...' : '✅ Grant Premium Access'}
              </button>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {authorizeQuery.isSuccess && (
          <div style={{
            marginTop: '30px',
            padding: '25px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '20px',
            color: '#10B981',
            fontSize: '1.2rem',
            fontWeight: '600',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(16, 185, 129, 0.1)'
          }}>
            ✨ Premium authorization granted successfully! Partner now has exclusive query access.
          </div>
        )}

        {authorizeQuery.error && (
          <div style={{
            marginTop: '30px',
            padding: '25px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
            border: '2px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '20px',
            color: '#EF4444',
            fontSize: '1.2rem',
            fontWeight: '600',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(239, 68, 68, 0.1)'
          }}>
            ❌ Authorization failed: {authorizeQuery.error.message}
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes slideGradient {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(1deg); }
          66% { transform: translateY(-10px) rotate(-1deg); }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};