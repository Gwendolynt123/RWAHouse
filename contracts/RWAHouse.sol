// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title RWAHouse - Real World Asset House Information Management
/// @notice This contract allows project administrators to store encrypted property information for users on-chain
/// @dev Uses Zama's FHE technology to encrypt property data that only the owner can decrypt
contract RWAHouse is SepoliaConfig {
    
    /// @notice Address of the project administrator (deployer)
    address public immutable projectOwner;
    
    /// @notice Modifier to restrict access to project owner only
    modifier onlyProjectOwner() {
        require(msg.sender == projectOwner, "Only project owner can call this function");
        _;
    }
    
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
    
    /// @notice Mapping to track single-use query permissions
    /// @dev propertyOwner => queryContract => queryType => isUsed
    mapping(address => mapping(address => mapping(uint8 => bool))) private queryUsed;
    
    /// @notice Enum for different query types
    enum QueryType { COUNTRY, CITY, VALUATION }
    
    /// @notice Struct to store pending decryption requests
    struct DecryptionRequest {
        address requester;
        address propertyOwner;
        QueryType queryType;
        uint32 compareValue;
        bool isPending;
        uint256 requestId;
    }
    
    /// @notice Mapping to track decryption requests
    mapping(uint256 => DecryptionRequest) private decryptionRequests;
    mapping(address => uint256) private latestRequestId;
    
    /// @notice Event emitted when property information is stored
    event PropertyStored(address indexed owner);
    
    /// @notice Event emitted when property information is stored by project owner
    event PropertyStoredByProject(address indexed projectOwner, address indexed userAddress);
    
    /// @notice Event emitted when authorization is granted
    event AuthorizationGranted(address indexed owner, address indexed authorized);
    
    /// @notice Event emitted when authorization is revoked
    event AuthorizationRevoked(address indexed owner, address indexed authorized);
    
    /// @notice Event emitted when query authorization is granted
    event QueryAuthorizationGranted(address indexed owner, address indexed requester, QueryType queryType);
    
    /// @notice Event emitted when a query is requested
    event QueryRequested(address indexed requester, address indexed owner, QueryType queryType, uint256 requestId);
    
    /// @notice Event emitted when a query result is ready
    event QueryResultReady(uint256 indexed requestId, bool result);
    
    /// @notice Constructor sets the project owner to the deployer
    constructor() {
        projectOwner = msg.sender;
    }
    
    /// @notice Store encrypted property information bound to the specified user's wallet address
    /// @param userAddress The wallet address of the property owner
    /// @param encryptedCountry The encrypted country code where the property is located
    /// @param encryptedCity The encrypted city code where the property is located
    /// @param encryptedValuation The encrypted property valuation
    /// @param inputProof The proof for the encrypted input
    function storePropertyInfo(
        address userAddress,
        externalEuint32 encryptedCountry,
        externalEuint32 encryptedCity,
        externalEuint32 encryptedValuation,
        bytes calldata inputProof
    ) external onlyProjectOwner {
        // Convert external encrypted inputs to internal encrypted values
        euint32 country = FHE.fromExternal(encryptedCountry, inputProof);
        euint32 city = FHE.fromExternal(encryptedCity, inputProof);
        euint32 valuation = FHE.fromExternal(encryptedValuation, inputProof);
        
        require(userAddress != address(0), "Invalid user address");
        require(!properties[userAddress].exists, "Property already exists for this user");
        
        // Store the property information for the specified user
        properties[userAddress] = PropertyInfo({
            country: country,
            city: city,
            valuation: valuation,
            exists: true
        });
        
        // Grant access permissions to both contract and user
        FHE.allowThis(country);
        FHE.allow(country, userAddress);
        FHE.allowThis(city);
        FHE.allow(city, userAddress);
        FHE.allowThis(valuation);
        FHE.allow(valuation, userAddress);
        
        emit PropertyStored(userAddress);
        emit PropertyStoredByProject(msg.sender, userAddress);
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
    
    // ============= QUERY INTERFACES =============
    
    /// @notice Grant single-use authorization for a specific query type
    /// @param requester The address allowed to make the query
    /// @param queryType The type of query to authorize (0=COUNTRY, 1=CITY, 2=VALUATION)
    function authorizeQuery(address requester, QueryType queryType) external {
        require(properties[msg.sender].exists, "Property does not exist");
        require(requester != address(0), "Invalid requester address");
        require(!queryUsed[msg.sender][requester][uint8(queryType)], "Query already used");
        
        // Mark this query type as available for the requester
        queryUsed[msg.sender][requester][uint8(queryType)] = false;
        
        emit QueryAuthorizationGranted(msg.sender, requester, queryType);
    }
    
    /// @notice Check if property is in a specific country (external interface)
    /// @param propertyOwner The owner of the property to check
    /// @param countryCode The country code to compare against
    /// @return requestId The ID of the decryption request
    function queryIsInCountry(address propertyOwner, uint32 countryCode) external returns (uint256 requestId) {
        require(properties[propertyOwner].exists, "Property does not exist");
        require(!queryUsed[propertyOwner][msg.sender][uint8(QueryType.COUNTRY)], "Query authorization already used");
        
        // Mark the query as used
        queryUsed[propertyOwner][msg.sender][uint8(QueryType.COUNTRY)] = true;
        
        // Create encrypted comparison
        euint32 encryptedCountryCode = FHE.asEuint32(countryCode);
        ebool isInCountry = FHE.eq(properties[propertyOwner].country, encryptedCountryCode);
        
        // Request decryption for the boolean result
        bytes32[] memory cts = new bytes32[](1);
        cts[0] = FHE.toBytes32(isInCountry);
        
        requestId = FHE.requestDecryption(cts, this.countryQueryCallback.selector);
        
        // Store the request details
        decryptionRequests[requestId] = DecryptionRequest({
            requester: msg.sender,
            propertyOwner: propertyOwner,
            queryType: QueryType.COUNTRY,
            compareValue: countryCode,
            isPending: true,
            requestId: requestId
        });
        
        latestRequestId[msg.sender] = requestId;
        
        emit QueryRequested(msg.sender, propertyOwner, QueryType.COUNTRY, requestId);
        
        return requestId;
    }
    
    /// @notice Check if property is in a specific city (external interface)
    /// @param propertyOwner The owner of the property to check
    /// @param cityCode The city code to compare against
    /// @return requestId The ID of the decryption request
    function queryIsInCity(address propertyOwner, uint32 cityCode) external returns (uint256 requestId) {
        require(properties[propertyOwner].exists, "Property does not exist");
        require(!queryUsed[propertyOwner][msg.sender][uint8(QueryType.CITY)], "Query authorization already used");
        
        // Mark the query as used
        queryUsed[propertyOwner][msg.sender][uint8(QueryType.CITY)] = true;
        
        // Create encrypted comparison
        euint32 encryptedCityCode = FHE.asEuint32(cityCode);
        ebool isInCity = FHE.eq(properties[propertyOwner].city, encryptedCityCode);
        
        // Request decryption for the boolean result
        bytes32[] memory cts = new bytes32[](1);
        cts[0] = FHE.toBytes32(isInCity);
        
        requestId = FHE.requestDecryption(cts, this.cityQueryCallback.selector);
        
        // Store the request details
        decryptionRequests[requestId] = DecryptionRequest({
            requester: msg.sender,
            propertyOwner: propertyOwner,
            queryType: QueryType.CITY,
            compareValue: cityCode,
            isPending: true,
            requestId: requestId
        });
        
        latestRequestId[msg.sender] = requestId;
        
        emit QueryRequested(msg.sender, propertyOwner, QueryType.CITY, requestId);
        
        return requestId;
    }
    
    /// @notice Check if property valuation is above a threshold (external interface)
    /// @param propertyOwner The owner of the property to check
    /// @param minValue The minimum valuation threshold
    /// @return requestId The ID of the decryption request
    function queryIsAboveValue(address propertyOwner, uint32 minValue) external returns (uint256 requestId) {
        require(properties[propertyOwner].exists, "Property does not exist");
        require(!queryUsed[propertyOwner][msg.sender][uint8(QueryType.VALUATION)], "Query authorization already used");
        
        // Mark the query as used
        queryUsed[propertyOwner][msg.sender][uint8(QueryType.VALUATION)] = true;
        
        // Create encrypted comparison
        euint32 encryptedMinValue = FHE.asEuint32(minValue);
        ebool isAboveValue = FHE.ge(properties[propertyOwner].valuation, encryptedMinValue);
        
        // Request decryption for the boolean result
        bytes32[] memory cts = new bytes32[](1);
        cts[0] = FHE.toBytes32(isAboveValue);
        
        requestId = FHE.requestDecryption(cts, this.valuationQueryCallback.selector);
        
        // Store the request details
        decryptionRequests[requestId] = DecryptionRequest({
            requester: msg.sender,
            propertyOwner: propertyOwner,
            queryType: QueryType.VALUATION,
            compareValue: minValue,
            isPending: true,
            requestId: requestId
        });
        
        latestRequestId[msg.sender] = requestId;
        
        emit QueryRequested(msg.sender, propertyOwner, QueryType.VALUATION, requestId);
        
        return requestId;
    }
    
    // ============= DECRYPTION CALLBACKS =============
    
    /// @notice Callback for country query decryption
    function countryQueryCallback(
        uint256 requestId,
        bool result,
        bytes[] memory signatures
    ) public {
        require(decryptionRequests[requestId].isPending, "Request not pending");
        FHE.checkSignatures(requestId, signatures);
        
        decryptionRequests[requestId].isPending = false;
        
        emit QueryResultReady(requestId, result);
    }
    
    /// @notice Callback for city query decryption
    function cityQueryCallback(
        uint256 requestId,
        bool result,
        bytes[] memory signatures
    ) public {
        require(decryptionRequests[requestId].isPending, "Request not pending");
        FHE.checkSignatures(requestId, signatures);
        
        decryptionRequests[requestId].isPending = false;
        
        emit QueryResultReady(requestId, result);
    }
    
    /// @notice Callback for valuation query decryption
    function valuationQueryCallback(
        uint256 requestId,
        bool result,
        bytes[] memory signatures
    ) public {
        require(decryptionRequests[requestId].isPending, "Request not pending");
        FHE.checkSignatures(requestId, signatures);
        
        decryptionRequests[requestId].isPending = false;
        
        emit QueryResultReady(requestId, result);
    }
    
    // ============= QUERY RESULT FUNCTIONS =============
    
    /// @notice Get the result of a query request
    /// @param requestId The request ID to check
    /// @return requester The requester address
    /// @return propertyOwner The property owner address
    /// @return queryType The query type
    /// @return compareValue The comparison value used
    /// @return isPending Whether the request is still pending
    function getQueryRequest(uint256 requestId) external view returns (
        address requester,
        address propertyOwner,
        QueryType queryType,
        uint32 compareValue,
        bool isPending
    ) {
        DecryptionRequest memory request = decryptionRequests[requestId];
        return (
            request.requester,
            request.propertyOwner,
            request.queryType,
            request.compareValue,
            request.isPending
        );
    }
    
    /// @notice Get the latest request ID for an address
    /// @param requester The address to check
    /// @return The latest request ID
    function getLatestRequestId(address requester) external view returns (uint256) {
        return latestRequestId[requester];
    }
    
    /// @notice Check if a query authorization has been used
    /// @param propertyOwner The property owner
    /// @param requester The requester address
    /// @param queryType The query type to check
    /// @return Whether the authorization has been used
    function isQueryUsed(address propertyOwner, address requester, QueryType queryType) external view returns (bool) {
        return queryUsed[propertyOwner][requester][uint8(queryType)];
    }
}