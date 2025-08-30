# RWAHouse - Confidential Real World Asset Management Platform

## 🏠 Project Overview

RWAHouse is a revolutionary blockchain-based platform that enables secure, confidential management of real-world asset (RWA) information, specifically focused on property assets. Built using Zama's Fully Homomorphic Encryption (FHE) technology, the platform allows property information to be stored encrypted on-chain while enabling controlled queries without revealing sensitive data.

## ✨ Key Features

### 🔐 Confidential Data Storage
- **Encrypted Property Information**: All property data (country, city, valuation) is encrypted using FHE and stored on-chain
- **Owner-Controlled Access**: Only the property owner's wallet address can decrypt their property information
- **Zero-Knowledge Queries**: External parties can query property information without accessing actual values

### 🏢 Multi-Role Architecture
The platform supports three distinct user roles:

1. **Property Appraisal Companies**: Input and verify property information
2. **Property Owners**: View their on-chain property data and manage authorization
3. **Lending Companies**: Query property information for loan assessment

### 🔍 Secure Query System
- **Country Verification**: Check if a property is located in a specific country
- **City Verification**: Verify if a property is in a particular city  
- **Valuation Threshold**: Determine if property value meets minimum requirements
- **Single-Use Authorization**: Each query requires fresh authorization from the property owner
- **Asynchronous Results**: Queries use FHE decryption with callback mechanism

### 🛡️ Advanced Security Features
- **Access Control Lists (ACL)**: Granular permission management for encrypted data
- **Single-Use Permissions**: Query authorizations are consumed after one use
- **Request-Response Pattern**: Secure asynchronous decryption for query results
- **Owner Verification**: All property operations require proper ownership validation

## 🏗️ Technical Architecture

### Smart Contract Layer
```
contracts/
├── RWAHouse.sol          # Main contract with FHE property management
└── FHECounter.sol        # Example FHE counter implementation
```

### Frontend Application
```
app/
├── src/
│   ├── components/       # React components for each role
│   ├── hooks/           # Custom React hooks for FHE operations
│   ├── utils/           # Utility functions and helpers
│   └── types/           # TypeScript type definitions
```

## 🚀 Technology Stack

### Blockchain & Encryption
- **Smart Contract Framework**: Hardhat
- **FHE Library**: Zama FHEVM Solidity (`@fhevm/solidity`)
- **Network**: Ethereum Sepolia Testnet
- **Oracle Integration**: Zama Decryption Oracle

### Frontend Development  
- **Framework**: React 18+ with Vite
- **Wallet Integration**: RainbowKit + Wagmi + Viem
- **FHE Client**: Zama Relayer SDK (`@zama-fhe/relayer-sdk`)
- **Language**: TypeScript
- **State Management**: React Query (TanStack Query)

### Development Tools
- **Package Manager**: npm
- **Testing**: Hardhat Testing Framework
- **Code Quality**: ESLint, Prettier, Solhint
- **Deployment**: Hardhat Deploy

## 📦 Installation & Setup

### Prerequisites
- **Node.js**: Version 20 or higher
- **npm**: Version 7.0.0 or higher
- **Git**: Latest version

### 1. Clone Repository
```bash
git clone <repository-url>
cd RWAHouse
```

### 2. Install Dependencies
```bash
# Install contract dependencies
npm install

# Install frontend dependencies
cd app
npm install
cd ..
```

### 3. Environment Configuration
```bash
# Set up contract environment variables
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY
npx hardhat vars set ETHERSCAN_API_KEY

# Configure frontend environment
cd app
cp .env.example .env
# Edit .env with your configuration
```

### 4. Compile Contracts
```bash
npm run compile
```

### 5. Run Tests
```bash
npm run test
```

## 🚢 Deployment Guide

### Local Development Network
```bash
# Start local FHEVM node
npx hardhat node

# Deploy contracts to local network
npx hardhat deploy --network localhost

# Start frontend development server
cd app
npm run dev
```

### Sepolia Testnet Deployment
```bash
# Deploy to Sepolia
npx hardhat deploy --network sepolia

# Verify contract on Etherscan
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>

# Test on Sepolia
npx hardhat test --network sepolia
```

### Frontend Production Build
```bash
cd app
npm run build
npm run preview
```

## 📋 Smart Contract Interface

### Core Functions

#### Property Management
```solidity
// Store encrypted property information (Project Owner only)
function storePropertyInfo(
    address userAddress,
    externalEuint32 encryptedCountry,
    externalEuint32 encryptedCity, 
    externalEuint32 encryptedValuation,
    bytes calldata inputProof
) external onlyProjectOwner

// Retrieve property information
function getPropertyInfo(address owner) 
    external view returns (euint32, euint32, euint32, bool)

// Check if property exists
function hasProperty(address owner) external view returns (bool)
```

#### Access Control
```solidity
// Grant authorization to another address
function authorizeAccess(address authorized) external

// Revoke authorization
function revokeAccess(address authorized) external

// Check authorization status
function isAuthorized(address owner, address accessor) 
    external view returns (bool)
```

#### Query System
```solidity
// Grant single-use query authorization
function authorizeQuery(address requester, QueryType queryType) external

// Query if property is in specific country
function queryIsInCountry(address propertyOwner, uint32 countryCode) 
    external returns (uint256 requestId)

// Query if property is in specific city  
function queryIsInCity(address propertyOwner, uint32 cityCode)
    external returns (uint256 requestId)

// Query if property value is above threshold
function queryIsAboveValue(address propertyOwner, uint32 minValue)
    external returns (uint256 requestId)

// Get query request details
function getQueryRequest(uint256 requestId) external view 
    returns (address, address, QueryType, uint32, bool)
```

### Events
```solidity
event PropertyStored(address indexed owner);
event PropertyStoredByProject(address indexed projectOwner, address indexed userAddress);
event AuthorizationGranted(address indexed owner, address indexed authorized);
event AuthorizationRevoked(address indexed owner, address indexed authorized);
event QueryAuthorizationGranted(address indexed owner, address indexed requester, QueryType queryType);
event QueryRequested(address indexed requester, address indexed owner, QueryType queryType, uint256 requestId);
event QueryResultReady(uint256 indexed requestId, bool result);
```

## 🖥️ Frontend Usage Guide

### For Property Appraisal Companies
1. Connect wallet using RainbowKit
2. Navigate to "Property Input" section
3. Enter property details (country code, city code, valuation)
4. Submit encrypted property information to blockchain
5. Confirm transaction and wait for confirmation

### For Property Owners
1. Connect wallet to view owned properties
2. Review encrypted property information
3. Grant query authorizations to lending companies
4. Monitor query requests and results
5. Manage access permissions

### For Lending Companies  
1. Connect wallet and navigate to "Query" section
2. Enter property owner's address
3. Request specific query authorization from property owner
4. Execute queries (country, city, or valuation threshold)
5. Monitor asynchronous query results via events

## 🔧 Development Scripts

### Contract Development
```bash
npm run compile         # Compile smart contracts
npm run test           # Run contract tests
npm run test:sepolia   # Run tests on Sepolia
npm run lint           # Lint contracts and TypeScript
npm run clean          # Clean build artifacts
npm run coverage       # Generate test coverage report
```

### Frontend Development
```bash
cd app
npm run dev            # Start development server
npm run build          # Build for production
npm run preview        # Preview production build
npm run lint           # Lint frontend code
```

## 📁 Project Structure

```
RWAHouse/
├── contracts/                 # Smart contracts
│   ├── RWAHouse.sol          # Main FHE property management contract
│   └── FHECounter.sol        # Example FHE implementation
├── deploy/                    # Hardhat deployment scripts
├── tasks/                     # Custom Hardhat tasks
├── test/                      # Contract test files
├── app/                       # Frontend React application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── PropertyAppraisal/
│   │   │   ├── PropertyOwner/
│   │   │   └── LendingCompany/
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Utility functions
│   │   ├── types/           # TypeScript definitions
│   │   └── constants/       # Application constants
│   ├── public/              # Static assets
│   └── dist/                # Built application
├── docs/                     # Documentation
│   ├── zama_llm.md          # Zama FHE development guide
│   └── zama_doc_relayer.md  # Relayer SDK documentation
├── hardhat.config.ts        # Hardhat configuration
├── package.json             # Contract dependencies
├── tsconfig.json            # TypeScript configuration
├── .env.example             # Environment variable template
└── README.md               # This file
```

## 🌐 Network Configuration

### Sepolia Testnet (Primary)
- **Network**: Ethereum Sepolia
- **Chain ID**: 11155111
- **FHE Executor**: `0x848B0066793BcC60346Da1F49049357399B8D595`
- **ACL Contract**: `0x687820221192C5B662b25367F70076A37bc79b6c`
- **KMS Verifier**: `0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC`
- **Input Verifier**: `0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4`
- **Decryption Oracle**: `0xa02Cda4Ca3a71D7C46997716F4283aa851C28812`
- **Relayer URL**: `https://relayer.testnet.zama.cloud`

### Gateway Chain
- **Chain ID**: 55815
- **Decryption Address**: `0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1`
- **Input Verification**: `0x7048C39f048125eDa9d678AEbaDfB22F7900a29F`

## 🔐 Security Considerations

### Smart Contract Security
- **Access Control**: Role-based permissions with modifier restrictions
- **Input Validation**: Comprehensive validation of all external inputs
- **Reentrancy Protection**: Safe interaction patterns throughout
- **Integer Overflow**: Solidity 0.8+ built-in protection
- **FHE Security**: Proper ACL management and permission handling

### Frontend Security
- **Wallet Security**: Secure wallet connection via RainbowKit
- **Private Key Management**: Keys never leave user's browser
- **Input Sanitization**: All user inputs properly validated
- **HTTPS Communication**: Secure communication with relayer services

### Operational Security
- **Single-Use Authorizations**: Prevent replay attacks on queries
- **Owner-Only Operations**: Critical functions restricted to property owners
- **Audit Trail**: Comprehensive event logging for all operations

## 📊 Testing & Quality Assurance

### Contract Testing
- **Unit Tests**: Comprehensive test coverage for all functions
- **Integration Tests**: End-to-end testing with FHE operations
- **Gas Optimization**: Analysis and optimization of gas usage
- **Security Testing**: Vulnerability assessment and mitigation

### Frontend Testing
- **Component Testing**: Individual component functionality
- **Integration Testing**: Wallet connection and contract interaction
- **User Experience Testing**: Multi-role workflow validation
- **Cross-Browser Testing**: Compatibility across modern browsers

## 🐛 Troubleshooting

### Common Issues

#### Contract Deployment
```bash
# If deployment fails
npm run clean
npm run compile
npx hardhat deploy --network sepolia --reset
```

#### Frontend Connection Issues
```bash
# Clear cache and reinstall
cd app
rm -rf node_modules package-lock.json
npm install
```

#### FHE Operations Errors
- Ensure proper network configuration in both contract and frontend
- Verify Zama relayer service availability
- Check ACL permissions for encrypted data access

### Debug Commands
```bash
# Contract debugging
npx hardhat console --network sepolia

# Frontend debugging
cd app
npm run dev -- --debug

# Gas usage analysis
npm run test -- --gas-reporter
```

## 📚 Documentation & Resources

### Official Documentation
- [Zama FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Zama Relayer SDK Guide](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat)
- [RainbowKit Documentation](https://rainbowkit.com/)
- [Wagmi Documentation](https://wagmi.sh/)

### Development Resources
- [Hardhat Documentation](https://hardhat.org/docs)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

### Community & Support
- [Zama Discord Community](https://discord.gg/zama)
- [Zama Community Forum](https://community.zama.ai/)
- [GitHub Issues](https://github.com/zama-ai/fhevm/issues)

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Follow existing code style and conventions
- Add comprehensive tests for new functionality
- Update documentation for API changes
- Ensure all linting and tests pass

### Contribution Areas
- Smart contract enhancements
- Frontend user experience improvements
- Documentation and tutorials
- Testing and quality assurance
- Performance optimizations

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License. See the [LICENSE](LICENSE) file for details.

## 🏆 Acknowledgments

- **Zama Team**: For developing the revolutionary FHE technology
- **Ethereum Community**: For providing robust blockchain infrastructure
- **Open Source Contributors**: For the amazing tools and libraries used

## 🔮 Future Roadmap

### Planned Features
- Multi-property support per owner
- Property transfer mechanisms
- Integration with real estate marketplaces
- Mobile application development
- Advanced analytics and reporting

### Technical Improvements
- Gas optimization strategies
- Enhanced query system
- Real-time notification system
- Advanced access control patterns

---

**Built with ❤️ using Zama's FHE technology for a more private and secure future**

*For questions, support, or contributions, please reach out through our community channels or create an issue on GitHub.*