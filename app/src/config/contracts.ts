export const CONTRACT_ADDRESSES = {
  // Update these addresses after deployment
  localhost: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Default hardhat first contract address
  sepolia: '0x81FBfE76bae1bec525bD6A5a8950Ff2F38f75FdD', // Add deployed contract address on Sepolia
} as const;

export const RWA_HOUSE_ABI = [
  // Property Management Functions
  {
    "inputs": [
      { "name": "encryptedCountry", "type": "uint256" },
      { "name": "encryptedCity", "type": "uint256" },
      { "name": "encryptedValuation", "type": "uint256" },
      { "name": "inputProof", "type": "bytes" }
    ],
    "name": "storePropertyInfo",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "owner", "type": "address" }
    ],
    "name": "getPropertyInfo",
    "outputs": [
      { "name": "country", "type": "uint256" },
      { "name": "city", "type": "uint256" },
      { "name": "valuation", "type": "uint256" },
      { "name": "exists", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "owner", "type": "address" }
    ],
    "name": "hasProperty",
    "outputs": [
      { "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Authorization Functions
  {
    "inputs": [
      { "name": "authorized", "type": "address" }
    ],
    "name": "authorizeAccess",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "authorized", "type": "address" }
    ],
    "name": "revokeAccess",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "owner", "type": "address" },
      { "name": "accessor", "type": "address" }
    ],
    "name": "isAuthorized",
    "outputs": [
      { "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Query Functions
  {
    "inputs": [
      { "name": "requester", "type": "address" },
      { "name": "queryType", "type": "uint8" }
    ],
    "name": "authorizeQuery",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "propertyOwner", "type": "address" },
      { "name": "countryCode", "type": "uint32" }
    ],
    "name": "queryIsInCountry",
    "outputs": [
      { "name": "requestId", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "propertyOwner", "type": "address" },
      { "name": "cityCode", "type": "uint32" }
    ],
    "name": "queryIsInCity",
    "outputs": [
      { "name": "requestId", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "propertyOwner", "type": "address" },
      { "name": "minValue", "type": "uint32" }
    ],
    "name": "queryIsAboveValue",
    "outputs": [
      { "name": "requestId", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Update Functions
  {
    "inputs": [
      { "name": "newEncryptedValuation", "type": "uint256" },
      { "name": "inputProof", "type": "bytes" }
    ],
    "name": "updatePropertyValuation",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Events
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "owner", "type": "address" }
    ],
    "name": "PropertyStored",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "owner", "type": "address" },
      { "indexed": true, "name": "authorized", "type": "address" }
    ],
    "name": "AuthorizationGranted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "requester", "type": "address" },
      { "indexed": true, "name": "owner", "type": "address" },
      { "indexed": false, "name": "queryType", "type": "uint8" },
      { "indexed": false, "name": "requestId", "type": "uint256" }
    ],
    "name": "QueryRequested",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "requestId", "type": "uint256" },
      { "indexed": false, "name": "result", "type": "bool" }
    ],
    "name": "QueryResultReady",
    "type": "event"
  }
] as const;