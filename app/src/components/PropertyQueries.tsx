import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useRWAHouse } from '../hooks/useRWAHouse';

interface QueryResult {
  requestId: string;
  type: 'country' | 'city' | 'valuation';
  value: number;
  isPending: boolean;
  result?: boolean;
}

export const PropertyQueries: React.FC = () => {
  const { address } = useAccount();
  const { 
    queryCountry,
    queryCity, 
    queryValuation,
    authorizeQuery,
    writeQueryCountry,
    writeQueryCity,
    writeQueryValuation,
    writeAuthorizeQuery
  } = useRWAHouse();

  const [queries, setQueries] = useState<QueryResult[]>([]);
  const [queryForm, setQueryForm] = useState({
    propertyOwner: '',
    countryCode: '',
    cityCode: '',
    minValuation: '',
  });

  const [authForm, setAuthForm] = useState({
    requester: '',
    queryType: '0', // 0=COUNTRY, 1=CITY, 2=VALUATION
  });

  const handleQueryCountry = () => {
    if (!queryForm.propertyOwner || !queryForm.countryCode) {
      alert('Please fill in property owner address and country code');
      return;
    }

    writeQueryCountry([queryForm.propertyOwner, parseInt(queryForm.countryCode)]);

    // Add to pending queries
    const newQuery: QueryResult = {
      requestId: Date.now().toString(), // Temporary ID
      type: 'country',
      value: parseInt(queryForm.countryCode),
      isPending: true,
    };
    setQueries(prev => [...prev, newQuery]);
  };

  const handleQueryCity = () => {
    if (!queryForm.propertyOwner || !queryForm.cityCode) {
      alert('Please fill in property owner address and city code');
      return;
    }

    writeQueryCity([queryForm.propertyOwner, parseInt(queryForm.cityCode)]);

    const newQuery: QueryResult = {
      requestId: Date.now().toString(),
      type: 'city',
      value: parseInt(queryForm.cityCode),
      isPending: true,
    };
    setQueries(prev => [...prev, newQuery]);
  };

  const handleQueryValuation = () => {
    if (!queryForm.propertyOwner || !queryForm.minValuation) {
      alert('Please fill in property owner address and minimum valuation');
      return;
    }

    writeQueryValuation([queryForm.propertyOwner, parseInt(queryForm.minValuation)]);

    const newQuery: QueryResult = {
      requestId: Date.now().toString(),
      type: 'valuation',
      value: parseInt(queryForm.minValuation),
      isPending: true,
    };
    setQueries(prev => [...prev, newQuery]);
  };

  const handleAuthorizeQuery = () => {
    if (!authForm.requester) {
      alert('Please enter requester address');
      return;
    }

    writeAuthorizeQuery([authForm.requester, parseInt(authForm.queryType)]);
  };

  if (!address) {
    return (
      <div className="property-queries">
        <h2>Property Queries</h2>
        <p>Please connect your wallet to perform property queries.</p>
      </div>
    );
  }

  return (
    <div className="property-queries">
      <h2>Property Verification Queries</h2>
      
      {/* Authorization Section */}
      <div className="auth-section">
        <h3>Authorize Query Access</h3>
        <p>As a property owner, authorize others to query your property:</p>
        
        <div className="auth-form">
          <div className="form-group">
            <label>Requester Address:</label>
            <input
              type="text"
              value={authForm.requester}
              onChange={(e) => setAuthForm(prev => ({ ...prev, requester: e.target.value }))}
              placeholder="0x..."
            />
          </div>
          
          <div className="form-group">
            <label>Query Type:</label>
            <select
              value={authForm.queryType}
              onChange={(e) => setAuthForm(prev => ({ ...prev, queryType: e.target.value }))}
            >
              <option value="0">Country Query</option>
              <option value="1">City Query</option>
              <option value="2">Valuation Query</option>
            </select>
          </div>
          
          <button 
            onClick={handleAuthorizeQuery}
            disabled={authorizeQuery.isPending}
            className="auth-button"
          >
            {authorizeQuery.isPending ? 'Authorizing...' : 'Authorize Query'}
          </button>
        </div>
      </div>

      {/* Query Section */}
      <div className="query-section">
        <h3>Perform Queries</h3>
        <p>Query properties (requires authorization from property owner):</p>
        
        <div className="query-form">
          <div className="form-group">
            <label>Property Owner Address:</label>
            <input
              type="text"
              value={queryForm.propertyOwner}
              onChange={(e) => setQueryForm(prev => ({ ...prev, propertyOwner: e.target.value }))}
              placeholder="0x..."
            />
          </div>

          <div className="query-buttons">
            <div className="query-option">
              <h4>Country Query</h4>
              <div className="form-group">
                <label>Country Code:</label>
                <input
                  type="number"
                  value={queryForm.countryCode}
                  onChange={(e) => setQueryForm(prev => ({ ...prev, countryCode: e.target.value }))}
                  placeholder="e.g., 1"
                />
              </div>
              <button 
                onClick={handleQueryCountry}
                disabled={queryCountry.isPending}
                className="query-button"
              >
                {queryCountry.isPending ? 'Querying...' : 'Query Country'}
              </button>
            </div>

            <div className="query-option">
              <h4>City Query</h4>
              <div className="form-group">
                <label>City Code:</label>
                <input
                  type="number"
                  value={queryForm.cityCode}
                  onChange={(e) => setQueryForm(prev => ({ ...prev, cityCode: e.target.value }))}
                  placeholder="e.g., 1"
                />
              </div>
              <button 
                onClick={handleQueryCity}
                disabled={queryCity.isPending}
                className="query-button"
              >
                {queryCity.isPending ? 'Querying...' : 'Query City'}
              </button>
            </div>

            <div className="query-option">
              <h4>Valuation Query</h4>
              <div className="form-group">
                <label>Minimum Value (USD):</label>
                <input
                  type="number"
                  value={queryForm.minValuation}
                  onChange={(e) => setQueryForm(prev => ({ ...prev, minValuation: e.target.value }))}
                  placeholder="e.g., 500000"
                />
              </div>
              <button 
                onClick={handleQueryValuation}
                disabled={queryValuation.isPending}
                className="query-button"
              >
                {queryValuation.isPending ? 'Querying...' : 'Query Valuation'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Query Results */}
      {queries.length > 0 && (
        <div className="query-results">
          <h3>Query Results</h3>
          {queries.map((query, index) => (
            <div key={index} className="query-result">
              <div className="result-header">
                <strong>{query.type.toUpperCase()} Query</strong>
                <span className={`status ${query.isPending ? 'pending' : 'completed'}`}>
                  {query.isPending ? 'Pending' : 'Completed'}
                </span>
              </div>
              <div className="result-details">
                <p>Query Value: {query.value}</p>
                <p>Request ID: {query.requestId}</p>
                {query.result !== undefined && (
                  <p className="result">
                    Result: <strong>{query.result ? 'Yes' : 'No'}</strong>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};