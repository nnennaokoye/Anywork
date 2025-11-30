// Contract Addresses
export const CONTRACT_ADDRESS = "0xF154f7B8685d4EE64BfaA13CEa28f06ba30c6123";

// ABI - This should match your contract's ABI
export const MARKETPLACE_ABI = [
  // Events
  "event ArtisanRegistered(address indexed artisan, string metadataURI)",
  "event ArtisanVerificationUpdated(address indexed artisan, bool verified)",
  "event JobCreated(uint256 indexed jobId, address indexed client, address indexed artisan, uint256 amount, string description)",
  "event JobCompleted(uint256 indexed jobId)",
  "event PaymentReleased(uint256 indexed jobId, uint256 amount)",
  "event IdentityVerified(address indexed artisan, uint256 timestamp)",

  // Functions
  "function registerArtisan(string memory metadataURI) external",
  "function verifyIdentity() external",
  "function createJob(address payable _artisan, string memory _description) external payable returns (uint256)",
  "function completeJob(uint256 _jobId) external",
  "function withdrawPayment(uint256 _jobId) external",
  "function getArtisan(address _artisan) external view returns (bool registered, bool verified, string memory metadataURI)",
  "function getJob(uint256 _jobId) external view returns (address client, address payable artisan, uint256 amount, string memory description, bool completed, bool paymentReleased)",
  "function setArtisanVerified(address artisan, bool verified) external"
] as const;

// Chain configuration
export const CHAIN_CONFIG = {
  id: 84532, // Base Sepolia testnet
  name: 'Base Sepolia',
  rpcUrls: {
    default: { http: ['https://base-sepolia.drpc.org'] },
  },
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  blockExplorers: {
    default: { name: 'Basescan', url: 'https://sepolia.basescan.org' },
  },
  testnet: true,
};
