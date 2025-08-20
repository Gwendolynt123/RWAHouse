// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title RWAHouse - Real World Asset House Information Management
/// @notice This contract allows property owners to store encrypted property information on-chain
/// @dev Uses Zama's FHE technology to encrypt property data that only the owner can decrypt
contract RWAHouse is SepoliaConfig {
    
    /// @notice Structure to store encrypted property information
    struct PropertyInfo {
        euint32 country;        // Country code (encrypted)
        euint32 city;           // City code (encrypted)
        euint32 valuation;      // Property valuation (encrypted)
        bool exists;            // Whether the property exists
    }
    
    /// @notice Mapping from wallet address to their property information
    mapping(address => PropertyInfo) private properties;
    
    /// @notice Mapping to track which addresses are authorized to decrypt a property
    mapping(address => mapping(address => bool)) private authorizations;
    
    /// @notice Event emitted when property information is stored
    event PropertyStored(address indexed owner);
    
    /// @notice Event emitted when authorization is granted
    event AuthorizationGranted(address indexed owner, address indexed authorized);
    
    /// @notice Event emitted when authorization is revoked
    event AuthorizationRevoked(address indexed owner, address indexed authorized);
    
    /// @notice Store encrypted property information bound to the sender's wallet address
    /// @param encryptedCountry The encrypted country code where the property is located
    /// @param encryptedCity The encrypted city code where the property is located
    /// @param encryptedValuation The encrypted property valuation
    /// @param inputProof The proof for the encrypted input
    function storePropertyInfo(
        externalEuint32 encryptedCountry,
        externalEuint32 encryptedCity,
        externalEuint32 encryptedValuation,
        bytes calldata inputProof
    ) external {
        // Convert external encrypted inputs to internal encrypted values
        euint32 country = FHE.fromExternal(encryptedCountry, inputProof);
        euint32 city = FHE.fromExternal(encryptedCity, inputProof);
        euint32 valuation = FHE.fromExternal(encryptedValuation, inputProof);
        
        // Store the property information
        properties[msg.sender] = PropertyInfo({
            country: country,
            city: city,
            valuation: valuation,
            exists: true
        });
        
        // Grant access permissions
        FHE.allowThis(country);
        FHE.allow(country, msg.sender);
        FHE.allowThis(city);
        FHE.allow(city, msg.sender);
        FHE.allowThis(valuation);
        FHE.allow(valuation, msg.sender);
        
        emit PropertyStored(msg.sender);
    }
    
    /// @notice Get property information for a specific owner
    /// @param owner The address of the property owner
    /// @return country The encrypted country code
    /// @return city The encrypted city code
    /// @return valuation The encrypted valuation (only accessible if authorized)
    /// @return exists Whether the property exists
    function getPropertyInfo(address owner) 
        external 
        view 
        returns (euint32 country, euint32 city, euint32 valuation, bool exists) 
    {
        require(properties[owner].exists, "Property does not exist");
        require(
            owner == msg.sender || authorizations[owner][msg.sender], 
            "Unauthorized access"
        );
        
        PropertyInfo memory property = properties[owner];
        return (property.country, property.city, property.valuation, property.exists);
    }
    
    /// @notice Get only the encrypted valuation for a property owner
    /// @param owner The address of the property owner
    /// @return The encrypted valuation
    function getPropertyValuation(address owner) external view returns (euint32) {
        require(properties[owner].exists, "Property does not exist");
        require(
            owner == msg.sender || authorizations[owner][msg.sender], 
            "Unauthorized access"
        );
        
        return properties[owner].valuation;
    }
    
    /// @notice Get only the encrypted country for a property owner
    /// @param owner The address of the property owner
    /// @return The encrypted country code
    function getPropertyCountry(address owner) external view returns (euint32) {
        require(properties[owner].exists, "Property does not exist");
        require(
            owner == msg.sender || authorizations[owner][msg.sender], 
            "Unauthorized access"
        );
        
        return properties[owner].country;
    }
    
    /// @notice Get only the encrypted city for a property owner
    /// @param owner The address of the property owner
    /// @return The encrypted city code
    function getPropertyCity(address owner) external view returns (euint32) {
        require(properties[owner].exists, "Property does not exist");
        require(
            owner == msg.sender || authorizations[owner][msg.sender], 
            "Unauthorized access"
        );
        
        return properties[owner].city;
    }
    
    /// @notice Get encrypted property location information (country and city)
    /// @param owner The address of the property owner
    /// @return country The encrypted country code
    /// @return city The encrypted city code
    /// @return exists Whether the property exists
    function getPropertyLocation(address owner) 
        external 
        view 
        returns (euint32 country, euint32 city, bool exists) 
    {
        require(properties[owner].exists, "Property does not exist");
        require(
            owner == msg.sender || authorizations[owner][msg.sender], 
            "Unauthorized access"
        );
        
        PropertyInfo memory property = properties[owner];
        return (property.country, property.city, property.exists);
    }
    
    /// @notice Authorize another address to access encrypted property information
    /// @param authorized The address to grant authorization to
    function authorizeAccess(address authorized) external {
        require(properties[msg.sender].exists, "No property to authorize");
        require(authorized != address(0), "Invalid address");
        require(authorized != msg.sender, "Cannot authorize self");
        
        authorizations[msg.sender][authorized] = true;
        
        // Grant FHE access to the authorized address for all encrypted fields
        FHE.allow(properties[msg.sender].country, authorized);
        FHE.allow(properties[msg.sender].city, authorized);
        FHE.allow(properties[msg.sender].valuation, authorized);
        
        emit AuthorizationGranted(msg.sender, authorized);
    }
    
    /// @notice Revoke authorization for an address
    /// @param authorized The address to revoke authorization from
    function revokeAccess(address authorized) external {
        require(properties[msg.sender].exists, "No property to revoke");
        require(authorizations[msg.sender][authorized], "Not authorized");
        
        authorizations[msg.sender][authorized] = false;
        
        emit AuthorizationRevoked(msg.sender, authorized);
    }
    
    /// @notice Check if an address is authorized to access another address's property
    /// @param owner The property owner address
    /// @param accessor The address trying to access
    /// @return Whether the accessor is authorized
    function isAuthorized(address owner, address accessor) external view returns (bool) {
        if (owner == accessor) return true;
        return authorizations[owner][accessor];
    }
    
    /// @notice Update property valuation (only owner can update)
    /// @param newEncryptedValuation The new encrypted valuation
    /// @param inputProof The proof for the encrypted input
    function updatePropertyValuation(
        externalEuint32 newEncryptedValuation,
        bytes calldata inputProof
    ) external {
        require(properties[msg.sender].exists, "Property does not exist");
        
        // Convert external encrypted input to internal encrypted value
        euint32 newValuation = FHE.fromExternal(newEncryptedValuation, inputProof);
        
        // Update the valuation
        properties[msg.sender].valuation = newValuation;
        
        // Grant access permissions
        FHE.allowThis(newValuation);
        FHE.allow(newValuation, msg.sender);
        
    }
    
    /// @notice Update property location (country and city) (only owner can update)
    /// @param newEncryptedCountry The new encrypted country code
    /// @param newEncryptedCity The new encrypted city code
    /// @param inputProof The proof for the encrypted input
    function updatePropertyLocation(
        externalEuint32 newEncryptedCountry,
        externalEuint32 newEncryptedCity,
        bytes calldata inputProof
    ) external {
        require(properties[msg.sender].exists, "Property does not exist");
        
        // Convert external encrypted inputs to internal encrypted values
        euint32 newCountry = FHE.fromExternal(newEncryptedCountry, inputProof);
        euint32 newCity = FHE.fromExternal(newEncryptedCity, inputProof);
        
        // Update the location
        properties[msg.sender].country = newCountry;
        properties[msg.sender].city = newCity;
        
        // Grant access permissions
        FHE.allowThis(newCountry);
        FHE.allow(newCountry, msg.sender);
        FHE.allowThis(newCity);
        FHE.allow(newCity, msg.sender);
    }
    
    /// @notice Update all property information (only owner can update)
    /// @param newEncryptedCountry The new encrypted country code
    /// @param newEncryptedCity The new encrypted city code
    /// @param newEncryptedValuation The new encrypted valuation
    /// @param inputProof The proof for the encrypted input
    function updateCompletePropertyInfo(
        externalEuint32 newEncryptedCountry,
        externalEuint32 newEncryptedCity,
        externalEuint32 newEncryptedValuation,
        bytes calldata inputProof
    ) external {
        require(properties[msg.sender].exists, "Property does not exist");
        
        // Convert external encrypted inputs to internal encrypted values
        euint32 newCountry = FHE.fromExternal(newEncryptedCountry, inputProof);
        euint32 newCity = FHE.fromExternal(newEncryptedCity, inputProof);
        euint32 newValuation = FHE.fromExternal(newEncryptedValuation, inputProof);
        
        // Update all property information
        properties[msg.sender].country = newCountry;
        properties[msg.sender].city = newCity;
        properties[msg.sender].valuation = newValuation;
        
        // Grant access permissions
        FHE.allowThis(newCountry);
        FHE.allow(newCountry, msg.sender);
        FHE.allowThis(newCity);
        FHE.allow(newCity, msg.sender);
        FHE.allowThis(newValuation);
        FHE.allow(newValuation, msg.sender);
    }
    
    /// @notice Check if a property exists for an address
    /// @param owner The address to check
    /// @return Whether the property exists
    function hasProperty(address owner) external view returns (bool) {
        return properties[owner].exists;
    }
}