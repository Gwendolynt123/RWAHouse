import { useState, useEffect } from 'react';
import { createInstance, initSDK, SepoliaConfig } from '@zama-fhe/relayer-sdk/bundle';
import type { FhevmInstance } from '@zama-fhe/relayer-sdk/bundle';
import type { FhevmInstanceConfig } from "@zama-fhe/relayer-sdk/web";

export const useFHE = () => {
  const [instance, setInstance] = useState<FhevmInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeFHE = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Initialize SDK first
        await initSDK();
        const fheInstance = await createInstance({
          ...SepoliaConfig,
          network: window.ethereum
        });
        setInstance(fheInstance);
      } catch (err) {
        console.error('Failed to initialize FHE:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize FHE');
      } finally {
        setIsLoading(false);
        console.log("FHE init success");

      }
    };

    initializeFHE();
  }, []);

  const createEncryptedInput = (contractAddress: string, userAddress: string) => {
    if (!instance) {
      throw new Error('FHE instance not initialized');
    }
    return instance.createEncryptedInput(contractAddress, userAddress);
  };

  const userDecrypt = async (
    handleContractPairs: Array<{ handle: string; contractAddress: string }>,
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: string,
    startTimeStamp: string,
    durationDays: string
  ) => {
    if (!instance) {
      throw new Error('FHE instance not initialized');
    }

    return instance.userDecrypt(
      handleContractPairs,
      privateKey,
      publicKey,
      signature,
      contractAddresses,
      userAddress,
      startTimeStamp,
      durationDays
    );
  };

  const generateKeypair = () => {
    if (!instance) {
      throw new Error('FHE instance not initialized');
    }
    return instance.generateKeypair();
  };

  const createEIP712 = (
    publicKey: string,
    contractAddresses: string[],
    startTimeStamp: string,
    durationDays: string
  ) => {
    if (!instance) {
      throw new Error('FHE instance not initialized');
    }
    return instance.createEIP712(publicKey, contractAddresses, startTimeStamp, durationDays);
  };

  return {
    instance,
    isLoading,
    error,
    createEncryptedInput,
    userDecrypt,
    generateKeypair,
    createEIP712,
  };
};