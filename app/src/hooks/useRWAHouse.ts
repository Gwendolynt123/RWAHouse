import { useReadContract, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESSES, RWA_HOUSE_ABI } from '../config/contracts';
import { useChainId } from 'wagmi';

export const useRWAHouse = () => {
  const chainId = useChainId();

  const getContractAddress = () => {
    if (chainId === 11155111) return CONTRACT_ADDRESSES.sepolia;
    return CONTRACT_ADDRESSES.localhost;
  };

  // Check if user has a property
  const useHasProperty = (address?: string) => {
    return useReadContract({
      address: getContractAddress() as `0x${string}`,
      abi: RWA_HOUSE_ABI,
      functionName: 'hasProperty',
      args: address ? [address as `0x${string}`] : undefined,
      query: {
        enabled: !!address,
      },
    });
  };

  // Check if address is authorized
  const useIsAuthorized = (owner?: string, accessor?: string) => {
    return useReadContract({
      address: getContractAddress() as `0x${string}`,
      abi: RWA_HOUSE_ABI,
      functionName: 'isAuthorized',
      args: owner && accessor ? [owner as `0x${string}`, accessor as `0x${string}`] : undefined,
      query: {
        enabled: !!(owner && accessor),
      },
    });
  };

  // Store property info
  const storeProperty = useWriteContract();

  // Authorize access
  const authorizeAccess = useWriteContract();

  // Revoke access
  const revokeAccess = useWriteContract();

  // Authorize query
  const authorizeQuery = useWriteContract();

  // Query country
  const queryCountry = useWriteContract();

  // Query city
  const queryCity = useWriteContract();

  // Query valuation
  const queryValuation = useWriteContract();

  // Update valuation
  const updateValuation = useWriteContract();

  // Get property info for decryption (using existing function)
  const useGetPropertyInfoForDecryption = (address?: string) => {
    return useReadContract({
      address: getContractAddress() as `0x${string}`,
      abi: RWA_HOUSE_ABI,
      functionName: 'getPropertyInfo',
      args: address ? [address as `0x${string}`] : undefined,
      query: {
        enabled: !!address,
      },
    });
  };

  // Helper functions to call write contracts with proper parameters
  const writeStoreProperty = (userAddress: string, args: [`0x${string}`, `0x${string}`, `0x${string}`, `0x${string}`]) => {
    const contractAddress = getContractAddress();
    const fullArgs: [`0x${string}`, `0x${string}`, `0x${string}`, `0x${string}`, `0x${string}`] = [userAddress as `0x${string}`, ...args];
    
    console.log('🔍 useRWAHouse: writeStoreProperty called with:');
    console.log('  - Contract address:', contractAddress);
    console.log('  - User address:', userAddress);
    console.log('  - Full args:', fullArgs);
    console.log('  - Args length:', fullArgs.length);
    
    storeProperty.writeContract({
      address: contractAddress as `0x${string}`,
      abi: RWA_HOUSE_ABI,
      functionName: 'storePropertyInfo',
      args: fullArgs,
    });
  };

  const writeAuthorizeAccess = (args: [`0x${string}`]) => {
    authorizeAccess.writeContract({
      address: getContractAddress() as `0x${string}`,
      abi: RWA_HOUSE_ABI,
      functionName: 'authorizeAccess',
      args,
    });
  };

  const writeRevokeAccess = (args: [`0x${string}`]) => {
    revokeAccess.writeContract({
      address: getContractAddress() as `0x${string}`,
      abi: RWA_HOUSE_ABI,
      functionName: 'revokeAccess',
      args,
    });
  };

  const writeAuthorizeQuery = (args: [`0x${string}`, number]) => {
    authorizeQuery.writeContract({
      address: getContractAddress() as `0x${string}`,
      abi: RWA_HOUSE_ABI,
      functionName: 'authorizeQuery',
      args,
    });
  };

  const writeQueryCountry = (args: [`0x${string}`, number]) => {
    queryCountry.writeContract({
      address: getContractAddress() as `0x${string}`,
      abi: RWA_HOUSE_ABI,
      functionName: 'queryIsInCountry',
      args,
    });
  };

  const writeQueryCity = (args: [`0x${string}`, number]) => {
    queryCity.writeContract({
      address: getContractAddress() as `0x${string}`,
      abi: RWA_HOUSE_ABI,
      functionName: 'queryIsInCity',
      args,
    });
  };

  const writeQueryValuation = (args: [`0x${string}`, number]) => {
    queryValuation.writeContract({
      address: getContractAddress() as `0x${string}`,
      abi: RWA_HOUSE_ABI,
      functionName: 'queryIsAboveValue',
      args,
    });
  };

  const writeUpdateValuation = (args: [`0x${string}`, `0x${string}`, `0x${string}`, `0x${string}`, `0x${string}`]) => {
    updateValuation.writeContract({
      address: getContractAddress() as `0x${string}`,
      abi: RWA_HOUSE_ABI,
      functionName: 'storePropertyInfo',
      args,
    });
  };

  return {
    useHasProperty,
    useIsAuthorized,
    useGetPropertyInfoForDecryption,
    storeProperty,
    authorizeAccess,
    revokeAccess,
    authorizeQuery,
    queryCountry,
    queryCity,
    queryValuation,
    updateValuation,
    writeStoreProperty,
    writeAuthorizeAccess,
    writeRevokeAccess,
    writeAuthorizeQuery,
    writeQueryCountry,
    writeQueryCity,
    writeQueryValuation,
    writeUpdateValuation,
    contractAddress: getContractAddress(),
  };
};