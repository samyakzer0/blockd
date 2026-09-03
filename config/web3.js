/**
 * BlockD Web3 Configuration
 * Centralized settings for smart contract address, network chain IDs,
 * IPFS gateways, and blockchain explorer URLs.
 */

// Replace this with your deployed contract address from Remix IDE on Sepolia
export const CONTRACT_ADDRESS =
  process.env.REACT_APP_BLOCKD_CONTRACT_ADDRESS ||
  "0x0000000000000000000000000000000000000000";

export const EXPECTED_CHAIN_ID = 11155111; // Ethereum Sepolia Testnet
export const EXPECTED_CHAIN_HEX = "0xaa36a7";
export const CHAIN_NAME = "Sepolia";

export const EXPLORER_BASE_URL = "https://sepolia.etherscan.io/tx/";

export const IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
];

export function getTxExplorerUrl(txHash) {
  return `${EXPLORER_BASE_URL}${txHash}`;
}
