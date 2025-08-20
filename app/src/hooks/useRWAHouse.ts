import { useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
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
    return useContractRead({
      address: getContractAddress() as `0x${string}`,
      abi: RWA_HOUSE_ABI,
      functionName: 'hasProperty',
      args: address ? [address] : undefined,
      enabled: !!address,
    });
  };

  // Check if address is authorized
  const useIsAuthorized = (owner?: string, accessor?: string) => {
    return useContractRead({
      address: getContractAddress() as `0x${string}`,
      abi: RWA_HOUSE_ABI,
      functionName: 'isAuthorized',
      args: owner && accessor ? [owner, accessor] : undefined,
      enabled: !!(owner && accessor),
    });
  };

  // Store property info
  const useStoreProperty = () => {
    return useContractWrite({
      address: getContractAddress() as `0x${string}`,
      abi: RWA_HOUSE_ABI,
      functionName: 'storePropertyInfo',
    });
  };

  // Authorize access
  const useAuthorizeAccess = () => {
    return useContractWrite({
      address: getContractAddress() as `0x${string}`,
      abi: RWA_HOUSE_ABI,
      functionName: 'authorizeAccess',
    });
  };

  // Revoke access
  const useRevokeAccess = () => {
    return useContractWrite({
      address: getContractAddress() as `0x${string}`,
      abi: RWA_HOUSE_ABI,
      functionName: 'revokeAccess',
    });
  };

  // Authorize query
  const useAuthorizeQuery = () => {
    return useContractWrite({
      address: getContractAddress() as `0x${string}`,
      abi: RWA_HOUSE_ABI,
      functionName: 'authorizeQuery',
    });
  };

  // Query country
  const useQueryCountry = () => {
    return useContractWrite({
      address: getContractAddress() as `0x${string}`,
      abi: RWA_HOUSE_ABI,
      functionName: 'queryIsInCountry',
    });
  };

  // Query city
  const useQueryCity = () => {
    return useContractWrite({
      address: getContractAddress() as `0x${string}`,
      abi: RWA_HOUSE_ABI,
      functionName: 'queryIsInCity',
    });
  };

  // Query valuation
  const useQueryValuation = () => {
    return useContractWrite({
      address: getContractAddress() as `0x${string}`,
      abi: RWA_HOUSE_ABI,
      functionName: 'queryIsAboveValue',
    });
  };

  // Update valuation
  const useUpdateValuation = () => {
    return useContractWrite({
      address: getContractAddress() as `0x${string}`,
      abi: RWA_HOUSE_ABI,
      functionName: 'updatePropertyValuation',
    });
  };

  return {
    useHasProperty,
    useIsAuthorized,
    useStoreProperty,
    useAuthorizeAccess,
    useRevokeAccess,
    useAuthorizeQuery,
    useQueryCountry,
    useQueryCity,
    useQueryValuation,
    useUpdateValuation,
    contractAddress: getContractAddress(),
  };
};