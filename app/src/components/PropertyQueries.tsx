import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRWAHouse } from '../hooks/useRWAHouse';
import { useWatchContractEvent } from 'wagmi';
import { RWA_HOUSE_ABI, CONTRACT_ADDRESSES } from '../config/contracts';
import { useChainId } from 'wagmi';

interface QueryResult {
  requestId: string;
  type: 'country' | 'city' | 'valuation';
  value: number;
  isPending: boolean;
  result?: boolean;
}

export const PropertyQueries: React.FC = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const {
    queryCountry,
    queryCity,
    queryValuation,
    writeQueryCountry,
    writeQueryCity,
    writeQueryValuation,
    useGetLatestRequestId,
    useGetQueryRequest
  } = useRWAHouse();

  const getContractAddress = () => {
    if (chainId === 11155111) return CONTRACT_ADDRESSES.sepolia;
    return CONTRACT_ADDRESSES.localhost;
  };

  const [queries, setQueries] = useState<QueryResult[]>([]);
  const [queryForm, setQueryForm] = useState({
    propertyOwner: '',
    countryCode: '',
    cityCode: '',
    minValuation: '',
  });
  const [currentRequestId, setCurrentRequestId] = useState<bigint | null>(null);

  // Get latest request ID for current user
  const { data: latestRequestId, refetch: refetchLatestRequestId } = useGetLatestRequestId(address);
  
  // Get query request details for the latest request
  const { data: queryRequestData, refetch: refetchQueryRequest } = useGetQueryRequest(
    latestRequestId ? BigInt(latestRequestId.toString()) : undefined
  );

  // Watch for QueryResultReady events
  useWatchContractEvent({
    address: getContractAddress() as `0x${string}`,
    abi: RWA_HOUSE_ABI,
    eventName: 'QueryResultReady',
    onLogs(logs) {
      console.log('QueryResultReady events received:', logs);
      logs.forEach((log) => {
        const { requestId, result } = log.args as { requestId: bigint; result: boolean };
        
        // Update the query in our local state
        setQueries(prevQueries => 
          prevQueries.map(query => 
            query.requestId === requestId.toString() 
              ? { ...query, isPending: false, result } 
              : query
          )
        );
      });
      
      // Refetch the latest request data
      refetchLatestRequestId();
      refetchQueryRequest();
    },
  });

  // Effect to update queries when contract data changes
  useEffect(() => {
    if (latestRequestId && queryRequestData) {
      const [requester, propertyOwner, queryType, compareValue, isPending] = queryRequestData;
      
      // Only update if this is our request
      if (requester === address) {
        setQueries(prevQueries => {
          const existingQuery = prevQueries.find(q => q.requestId === latestRequestId.toString());
          
          if (!existingQuery) {
            // Add new query if it doesn't exist
            const queryTypeMap = { 0: 'country', 1: 'city', 2: 'valuation' } as const;
            const newQuery: QueryResult = {
              requestId: latestRequestId.toString(),
              type: queryTypeMap[queryType as 0 | 1 | 2] || 'country',
              value: compareValue,
              isPending,
            };
            return [...prevQueries, newQuery];
          } else {
            // Update existing query
            return prevQueries.map(query => 
              query.requestId === latestRequestId.toString()
                ? { ...query, isPending }
                : query
            );
          }
        });
      }
    }
  }, [latestRequestId, queryRequestData, address]);


  const handleQueryCountry = async () => {
    if (!queryForm.propertyOwner || !queryForm.countryCode) {
      alert('Please fill in property owner address and country code');
      return;
    }

    try {
      const result = await writeQueryCountry([queryForm.propertyOwner as `0x${string}`, parseInt(queryForm.countryCode)]);
      
      // After transaction succeeds, refetch to get the latest request ID
      setTimeout(() => {
        refetchLatestRequestId();
      }, 2000);
    } catch (error) {
      console.error('Query country failed:', error);
      alert('Query failed. Please try again.');
    }
  };

  const handleQueryCity = async () => {
    if (!queryForm.propertyOwner || !queryForm.cityCode) {
      alert('Please fill in property owner address and city code');
      return;
    }

    try {
      const result = await writeQueryCity([queryForm.propertyOwner as `0x${string}`, parseInt(queryForm.cityCode)]);
      
      // After transaction succeeds, refetch to get the latest request ID
      setTimeout(() => {
        refetchLatestRequestId();
      }, 2000);
    } catch (error) {
      console.error('Query city failed:', error);
      alert('Query failed. Please try again.');
    }
  };

  const handleQueryValuation = async () => {
    if (!queryForm.propertyOwner || !queryForm.minValuation) {
      alert('Please fill in property owner address and minimum valuation');
      return;
    }

    try {
      const result = await writeQueryValuation([queryForm.propertyOwner as `0x${string}`, parseInt(queryForm.minValuation)]);
      
      // After transaction succeeds, refetch to get the latest request ID
      setTimeout(() => {
        refetchLatestRequestId();
      }, 2000);
    } catch (error) {
      console.error('Query valuation failed:', error);
      alert('Query failed. Please try again.');
    }
  };


  if (!address) {
    return (
      <div className="luxury-card text-center" style={{ padding: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>🔍</span>
          <h2 style={{ fontSize: '0.95rem', margin: 0 }}>Property Queries - Connect Wallet Required</h2>
        </div>
        <div style={{
          padding: '8px 12px',
          background: 'linear-gradient(135deg, rgba(224, 17, 95, 0.1) 0%, rgba(224, 17, 95, 0.05) 100%)',
          border: '1px solid rgba(224, 17, 95, 0.2)',
          borderRadius: '8px'
        }}>
          <span style={{ fontSize: '1rem', marginRight: '6px' }}>⚠️</span>
          <span style={{ fontSize: '0.85rem' }}>Wallet connection required</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Ultra Compact Header */}
      <div className="luxury-card" style={{ marginBottom: '10px', padding: '8px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>🔍</span>
          <h2 style={{ fontSize: '0.95rem', margin: 0 }}>Property Verification Queries</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-silver)', marginLeft: 'auto' }}>
            Confidential queries with owner auth
          </span>
        </div>
      </div>

      {/* Current Request Status */}
      {latestRequestId && queryRequestData && (
        <div className="luxury-card" style={{ marginBottom: '10px', padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1rem' }}>📊</span>
            <h3 style={{ margin: 0, fontSize: '0.9rem' }}>Current Request Status</h3>
            <span style={{ 
              color: queryRequestData[4] ? 'var(--color-gold)' : 'var(--color-emerald)', 
              fontSize: '0.75rem', 
              marginLeft: 'auto' 
            }}>
              Request ID: {latestRequestId.toString()}
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 12px',
            background: queryRequestData[4] 
              ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(80, 200, 120, 0.1) 0%, rgba(80, 200, 120, 0.05) 100%)',
            border: queryRequestData[4] 
              ? '1px solid rgba(255, 215, 0, 0.2)'
              : '1px solid rgba(80, 200, 120, 0.2)',
            borderRadius: '6px'
          }}>
            <span style={{ fontSize: '0.8rem' }}>
              {queryRequestData[4] ? '⏳ Pending decryption...' : '✅ Query completed'}
            </span>
            
            {queryRequestData[4] && (
              <div className="luxury-spinner" style={{ width: '12px', height: '12px' }}></div>
            )}
          </div>
        </div>
      )}

      {/* Property Owner Input */}
      <div className="luxury-card" style={{ marginBottom: '10px', padding: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '1rem' }}>👤</span>
          <h3 style={{ margin: 0, fontSize: '0.9rem' }}>Property Owner</h3>
          <span style={{ color: 'var(--color-silver)', fontSize: '0.75rem', marginLeft: 'auto' }}>Required</span>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <input
            id="propertyOwner"
            type="text"
            value={queryForm.propertyOwner}
            onChange={(e) => setQueryForm(prev => ({ ...prev, propertyOwner: e.target.value }))}
            placeholder="0x1234567890abcdef1234567890abcdef12345678"
            className="luxury-input"
            style={{ textAlign: 'center', fontSize: '0.85rem', padding: '8px 12px' }}
          />
          <span className="form-hint" style={{ fontSize: '0.7rem' }}>
            Owner must authorize queries
          </span>
        </div>
      </div>

      {/* Query Options */}
      <div className="grid grid-cols-1" style={{ gap: '10px', marginBottom: '15px' }}>
        {/* Country Query */}
        <div className="luxury-card" style={{ padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1rem' }}>🌍</span>
            <h3 style={{ margin: 0, fontSize: '0.9rem' }}>Country Verification</h3>
            <span style={{ color: 'var(--color-silver)', fontSize: '0.75rem', marginLeft: 'auto' }}>Location check</span>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <input
                id="countryCode"
                type="number"
                value={queryForm.countryCode}
                onChange={(e) => setQueryForm(prev => ({ ...prev, countryCode: e.target.value }))}
                placeholder="e.g., 1 for USA"
                className="luxury-input"
                style={{ fontSize: '0.85rem', padding: '8px 12px' }}
              />
            </div>
            <button
              onClick={handleQueryCountry}
              disabled={queryCountry.isPending || !queryForm.propertyOwner || !queryForm.countryCode}
              className="btn-premium"
              style={{ 
                opacity: (queryCountry.isPending || !queryForm.propertyOwner || !queryForm.countryCode) ? 0.6 : 1,
                fontSize: '0.8rem',
                padding: '8px 16px',
                minWidth: '100px'
              }}
            >
              {queryCountry.isPending ? (
                <>
                  <div className="luxury-spinner" style={{ width: '12px', height: '12px', marginRight: '6px' }}></div>
                  Querying...
                </>
              ) : (
                'Verify'
              )}
            </button>
          </div>
        </div>

        {/* City Query */}
        <div className="luxury-card" style={{ padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1rem' }}>🏙️</span>
            <h3 style={{ margin: 0, fontSize: '0.9rem' }}>City Verification</h3>
            <span style={{ color: 'var(--color-silver)', fontSize: '0.75rem', marginLeft: 'auto' }}>City check</span>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <input
                id="cityCode"
                type="number"
                value={queryForm.cityCode}
                onChange={(e) => setQueryForm(prev => ({ ...prev, cityCode: e.target.value }))}
                placeholder="e.g., 1 for New York"
                className="luxury-input"
                style={{ fontSize: '0.85rem', padding: '8px 12px' }}
              />
            </div>
            <button
              onClick={handleQueryCity}
              disabled={queryCity.isPending || !queryForm.propertyOwner || !queryForm.cityCode}
              className="btn-premium"
              style={{ 
                opacity: (queryCity.isPending || !queryForm.propertyOwner || !queryForm.cityCode) ? 0.6 : 1,
                fontSize: '0.8rem',
                padding: '8px 16px',
                minWidth: '100px'
              }}
            >
              {queryCity.isPending ? (
                <>
                  <div className="luxury-spinner" style={{ width: '12px', height: '12px', marginRight: '6px' }}></div>
                  Querying...
                </>
              ) : (
                'Verify'
              )}
            </button>
          </div>
        </div>

        {/* Valuation Query */}
        <div className="luxury-card" style={{ padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1rem' }}>💰</span>
            <h3 style={{ margin: 0, fontSize: '0.9rem' }}>Valuation Verification</h3>
            <span style={{ color: 'var(--color-silver)', fontSize: '0.75rem', marginLeft: 'auto' }}>Value check</span>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <input
                id="minValuation"
                type="number"
                value={queryForm.minValuation}
                onChange={(e) => setQueryForm(prev => ({ ...prev, minValuation: e.target.value }))}
                placeholder="e.g., 500,000"
                className="luxury-input"
                style={{ fontSize: '0.85rem', padding: '8px 12px' }}
              />
            </div>
            <button
              onClick={handleQueryValuation}
              disabled={queryValuation.isPending || !queryForm.propertyOwner || !queryForm.minValuation}
              className="btn-premium"
              style={{ 
                opacity: (queryValuation.isPending || !queryForm.propertyOwner || !queryForm.minValuation) ? 0.6 : 1,
                fontSize: '0.8rem',
                padding: '8px 16px',
                minWidth: '100px'
              }}
            >
              {queryValuation.isPending ? (
                <>
                  <div className="luxury-spinner" style={{ width: '12px', height: '12px', marginRight: '6px' }}></div>
                  Querying...
                </>
              ) : (
                'Verify'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Query Results Section */}
      {queries.length > 0 && (
        <div className="luxury-card" style={{ padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '1rem' }}>📊</span>
            <h3 style={{ fontSize: '0.9rem', margin: 0 }}>Query Results</h3>
            <span style={{ color: 'var(--color-silver)', fontSize: '0.75rem', marginLeft: 'auto' }}>
              {queries.length} total queries
            </span>
          </div>

          <div style={{ display: 'grid', gap: '8px' }}>
            {queries.map((query, index) => {
              const queryConfig = {
                country: { icon: '🌍', label: 'Country', color: 'var(--color-sapphire)' },
                city: { icon: '🏙️', label: 'City', color: 'var(--color-emerald)' },
                valuation: { icon: '💰', label: 'Valuation', color: 'var(--color-gold)' }
              };

              const config = queryConfig[query.type];

              return (
                <div
                  key={index}
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                    border: '1px solid rgba(255, 215, 0, 0.1)',
                    borderRadius: '8px',
                    padding: '10px',
                    position: 'relative'
                  }}
                >
                  {/* Status Indicator */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: query.isPending ? 
                      'linear-gradient(90deg, #FFD700, #0F52BA, #FFD700)' :
                      query.result ? 
                        'linear-gradient(90deg, #50C878, #32CD32)' :
                        'linear-gradient(90deg, #E0115F, #DC143C)',
                    backgroundSize: query.isPending ? '200% 100%' : '100% 100%',
                    animation: query.isPending ? 'slideGradient 2s linear infinite' : 'none'
                  }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.9rem' }}>{config.icon}</span>
                      <h4 style={{ margin: 0, fontSize: '0.85rem' }}>{config.label}</h4>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-silver)' }}>
                        {query.isPending ? 'Pending...' : query.result !== undefined ? 'Complete' : 'Processing'}
                      </span>
                      <span style={{ fontSize: '0.8rem' }}>
                        {query.isPending ? '⏳' : query.result ? '✅' : '❌'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--color-silver)' }}>
                      Value: <span style={{ color: 'var(--color-ivory)' }}>
                        {query.type === 'valuation' ? `$${query.value.toLocaleString()}+` : query.value}
                      </span>
                    </span>

                    {query.result !== undefined && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        background: query.result ?
                          'rgba(80, 200, 120, 0.15)' :
                          'rgba(224, 17, 95, 0.15)',
                        border: query.result ?
                          '1px solid rgba(80, 200, 120, 0.25)' :
                          '1px solid rgba(224, 17, 95, 0.25)'
                      }}>
                        <span style={{ fontSize: '0.7rem' }}>
                          {query.result ? '✅' : '❌'}
                        </span>
                        <span style={{
                          color: query.result ? 'var(--color-emerald)' : 'var(--color-ruby)',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          {query.result ? 'MATCH' : 'NO MATCH'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Results Summary */}
          <div style={{
            marginTop: '10px',
            padding: '8px 12px',
            background: 'rgba(255, 215, 0, 0.05)',
            border: '1px solid rgba(255, 215, 0, 0.1)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem' }}>📋</span>
              <span style={{ fontSize: '0.8rem' }}>Summary:</span>
            </div>
            <span style={{ 
              color: 'var(--color-silver)', 
              fontSize: '0.75rem'
            }}>
              Total: {queries.length} | 
              Pending: {queries.filter(q => q.isPending).length} | 
              Done: {queries.filter(q => !q.isPending).length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};