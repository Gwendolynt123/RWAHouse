# RWAHouse Frontend

A React frontend application for the RWAHouse confidential property management system built with Zama's FHE technology.

## Features

- **Property Registration**: Securely store encrypted property information on the blockchain
- **Property Information**: View and decrypt your own property data
- **Property Queries**: Perform privacy-preserving queries on property data
- **Authorization Management**: Control who can access your encrypted property information

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Web3**: Viem + Wagmi + RainbowKit
- **FHE**: Zama FHE SDK (@zama-fhe/relayer-sdk)
- **Styling**: CSS3 (no external framework)

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Web3 wallet (MetaMask recommended)

### Installation

1. Clone the repository and navigate to the app folder:
```bash
cd app
npm install
```

2. Copy the environment file and configure:
```bash
cp .env.example .env
```

3. Get a WalletConnect Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/) and update `.env`:
```env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Configuration

### Contract Addresses

Update the contract addresses in `src/config/contracts.ts` after deploying the RWAHouse contract:

```typescript
export const CONTRACT_ADDRESSES = {
  localhost: '0x...', // Local development
  sepolia: '0x...', // Sepolia testnet
} as const;
```

### Network Configuration

The app is configured to work with:
- Sepolia Testnet (Chain ID: 11155111)
- Local Hardhat Network (Chain ID: 31337)

You can modify the supported networks in `src/config/wagmi.ts`.

## Usage

### 1. Property Registration

1. Connect your wallet using the "Connect Wallet" button
2. Navigate to the "Register Property" tab
3. Fill in your property information:
   - Country Code (numeric, e.g., 1 for USA)
   - City Code (numeric, e.g., 1 for New York)
   - Property Valuation (in USD)
4. Click "Store Property Info" to encrypt and store your data

### 2. View Property Information

1. Go to the "My Property" tab
2. Click "Decrypt Property Data" to view your encrypted information
3. Sign the decryption request with your wallet

### 3. Authorization Management

1. Navigate to the "Authorizations" tab
2. Grant access to specific addresses for permanent property access
3. Check authorization status between addresses
4. Revoke access when needed

### 4. Property Queries

1. Go to the "Property Queries" tab
2. As a property owner, authorize query access for specific requesters
3. As a requester, perform privacy-preserving queries:
   - Check if property is in a specific country
   - Check if property is in a specific city
   - Check if property valuation is above a threshold

## How FHE Works in This App

### Encryption Process

1. **Input Creation**: User data is encrypted using Zama's FHE public key
2. **On-Chain Storage**: Encrypted data (ciphertexts) are stored on the blockchain
3. **Access Control**: ACL (Access Control List) manages who can decrypt data

### Query Process

1. **Authorization**: Property owner grants single-use query permission
2. **Encrypted Comparison**: Queries are performed on encrypted data without decryption
3. **Result Decryption**: Only the boolean result (true/false) is decrypted and returned

### Data Privacy

- Property data never leaves the blockchain in plaintext
- Only authorized parties can decrypt specific information
- Queries reveal only yes/no answers, not the actual values
- Each query authorization is single-use for maximum security

## Development

### Project Structure

```
src/
├── components/           # React components
│   ├── PropertyRegistration.tsx
│   ├── PropertyInfo.tsx
│   ├── PropertyQueries.tsx
│   └── AuthorizationManager.tsx
├── config/              # Configuration files
│   ├── wagmi.ts        # Web3 configuration
│   └── contracts.ts    # Contract addresses and ABI
├── hooks/              # Custom React hooks
│   ├── useFHE.ts       # FHE SDK integration
│   └── useRWAHouse.ts  # Contract interaction hooks
├── App.tsx             # Main application component
├── main.tsx           # Application entry point
└── App.css            # Styling
```

### Available Scripts

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
npm run lint        # Run ESLint
```

### Building for Production

1. Update contract addresses in the configuration
2. Set the correct environment variables
3. Build the application:
```bash
npm run build
```

## Troubleshooting

### Common Issues

1. **FHE SDK Loading Issues**: Make sure to wait for the SDK initialization before using FHE functions
2. **Contract Not Found**: Verify the contract address is correct for your network
3. **Transaction Failures**: Ensure you have sufficient gas and the correct network selected
4. **Wallet Connection Issues**: Try refreshing the page and reconnecting your wallet

### Browser Compatibility

- Chrome/Chromium 88+
- Firefox 78+
- Safari 14+
- Edge 88+

WASM support is required for the FHE functionality.

## Security Considerations

- Never share your private keys
- Verify contract addresses before interacting
- Double-check transaction details before signing
- Use testnets for development and testing

## Support

For issues related to:
- **FHE Technology**: [Zama Documentation](https://docs.zama.ai)
- **Wallet Integration**: [RainbowKit Documentation](https://rainbowkit.com)
- **Contract Interaction**: [Wagmi Documentation](https://wagmi.sh)

## License

This project is part of the RWAHouse confidential property management system.