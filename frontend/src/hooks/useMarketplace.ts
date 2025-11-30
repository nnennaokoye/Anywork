import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { MARKETPLACE_ABI, CONTRACT_ADDRESS } from '@/config/contracts';

export function useMarketplace() {
  const [isClient, setIsClient] = useState(false);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  useEffect(() => {
    const init = async () => {
      if (typeof window === 'undefined') return;
      const anyWindow = window as any;
      if (!anyWindow.ethereum) return;

      const browserProvider = new ethers.BrowserProvider(anyWindow.ethereum);
      setProvider(browserProvider);

      try {
        const signer = await browserProvider.getSigner();
        setSigner(signer);
      } catch (err) {
        console.error('Failed to get signer', err);
      }
    };

    init();
    setIsClient(true);
  }, []);

  const getContract = () => {
    if (!provider || !signer) {
      throw new Error('Wallet not connected');
    }
    return new ethers.Contract(CONTRACT_ADDRESS, MARKETPLACE_ABI, signer);
  };

  // Register as an artisan
  const registerArtisan = async (metadataURI: string) => {
    const contract = getContract();
    const tx = await contract.registerArtisan(metadataURI);
    await tx.wait();
    return tx;
  };

  // Verify identity (for artisans)
  const verifyIdentity = async () => {
    const contract = getContract();
    const tx = await contract.verifyIdentity();
    await tx.wait();
    return tx;
  };

  // Create a new job
  const createJob = async (artisanAddress: string, description: string, amount: string) => {
    const contract = getContract();
    const tx = await contract.createJob(artisanAddress, description, {
      value: ethers.parseEther(amount),
    });
    await tx.wait();
    return tx;
  };

  // Complete a job (for artisans)
  const completeJob = async (jobId: number) => {
    const contract = getContract();
    const tx = await contract.completeJob(jobId);
    await tx.wait();
    return tx;
  };

  // Withdraw payment (for clients)
  const withdrawPayment = async (jobId: number) => {
    const contract = getContract();
    const tx = await contract.withdrawPayment(jobId);
    await tx.wait();
    return tx;
  };

  // Get artisan info
  const getArtisan = async (address: string) => {
    const contract = getContract();
    return await contract.getArtisan(address);
  };

  // Get job info
  const getJob = async (jobId: number) => {
    const contract = getContract();
    return await contract.getJob(jobId);
  };

  // Set artisan verification (owner only)
  const setArtisanVerified = async (artisanAddress: string, verified: boolean) => {
    const contract = getContract();
    const tx = await contract.setArtisanVerified(artisanAddress, verified);
    await tx.wait();
    return tx;
  };

  return {
    registerArtisan,
    verifyIdentity,
    createJob,
    completeJob,
    withdrawPayment,
    getArtisan,
    getJob,
    setArtisanVerified,
    isReady: !!provider && !!signer && isClient,
  };
}
