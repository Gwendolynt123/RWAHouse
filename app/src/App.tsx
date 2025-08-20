import React, { useState } from 'react';
import './App.css';
import { PropertyRegistration } from './components/PropertyRegistration';
import { PropertyInfo } from './components/PropertyInfo';
import { PropertyQueries } from './components/PropertyQueries';
import { AuthorizationManager } from './components/AuthorizationManager';
import { ConnectButton } from '@rainbow-me/rainbowkit';

function App() {
  const [activeTab, setActiveTab] = useState<'register' | 'info' | 'queries' | 'auth'>('register');

  return (
    <div className="app">
      <header className="app-header">
        <h1>RWAHouse - Confidential Property Management</h1>
        <p>Securely store and manage property information using Zama's FHE technology</p>
        <div className="connect-wallet">
          <ConnectButton />
        </div>
      </header>

      <nav className="app-nav">
        <button 
          className={`nav-button ${activeTab === 'register' ? 'active' : ''}`}
          onClick={() => setActiveTab('register')}
        >
          Register Property
        </button>
        <button 
          className={`nav-button ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          My Property
        </button>
        <button 
          className={`nav-button ${activeTab === 'queries' ? 'active' : ''}`}
          onClick={() => setActiveTab('queries')}
        >
          Property Queries
        </button>
        <button 
          className={`nav-button ${activeTab === 'auth' ? 'active' : ''}`}
          onClick={() => setActiveTab('auth')}
        >
          Authorizations
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'register' && <PropertyRegistration />}
        {activeTab === 'info' && <PropertyInfo />}
        {activeTab === 'queries' && <PropertyQueries />}
        {activeTab === 'auth' && <AuthorizationManager />}
      </main>

      <footer className="app-footer">
        <p>Built with Zama FHE, React, Vite, and Rainbow Kit</p>
        <p>Your property data is encrypted and only accessible by authorized parties</p>
      </footer>
    </div>
  );
}

export default App;
