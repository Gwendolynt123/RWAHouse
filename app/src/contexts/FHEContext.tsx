import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { createInstance, initSDK, SepoliaConfig } from '@zama-fhe/relayer-sdk/bundle';
import type { FhevmInstance } from '@zama-fhe/relayer-sdk/bundle';

interface FHEContextType {
  instance: FhevmInstance | null;
  error: string | null;
  isInitializing: boolean;
  initFHE: (provider: any, chainId: any) => Promise<void>;
  createEncryptedInput: (contractAddress: string, userAddress: string) => any;
  userDecrypt: (
    handleContractPairs: Array<{ handle: string; contractAddress: string }>,
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: string,
    startTimeStamp: string,
    durationDays: string
  ) => Promise<any>;
  generateKeypair: () => any;
  createEIP712: (
    publicKey: string,
    contractAddresses: string[],
    startTimeStamp: string,
    durationDays: string
  ) => any;
}

const FHEContext = createContext<FHEContextType | undefined>(undefined);

export const FHEProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [instance, setInstance] = useState<FhevmInstance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const initFHE = async (provider: any, chainId: any) => {
    if (instance) {
      console.log("FHE already initialized, skipping...");
      return;
    }

    if (isInitializing) {
      console.log("FHE initialization already in progress, skipping...");
      return;
    }

    setIsInitializing(true);
    try {
      setError(null);
      console.log("init FHE", provider, chainId);

      // Initialize SDK first
      await initSDK();
      const fheInstance = await createInstance({
        ...SepoliaConfig,
        network: provider,
        chainId: chainId
      });
      setInstance(fheInstance);
      console.log("FHE init success");
    } catch (err) {
      console.error('Failed to initialize FHE:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize FHE');
    } finally {
      setIsInitializing(false);
    }
  };

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

  const value: FHEContextType = {
    instance,
    error,
    isInitializing,
    initFHE,
    createEncryptedInput,
    userDecrypt,
    generateKeypair,
    createEIP712
  };

  return <FHEContext.Provider value={value}>{children}</FHEContext.Provider>;
};

export const useFHE = () => {
  const context = useContext(FHEContext);
  if (context === undefined) {
    throw new Error('useFHE must be used within a FHEProvider');
  }
  return context;
};