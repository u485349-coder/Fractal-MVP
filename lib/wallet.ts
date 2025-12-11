// lib/wallet.ts
import { ethers } from "ethers";
import EthereumProvider from "@walletconnect/ethereum-provider";

const SEPOLIA_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_SEPOLIA_CHAIN_ID || "11155111"
);
const SEPOLIA_RPC =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC || "https://rpc.sepolia.org";

const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID!;

export type ConnectedWallet = {
  provider: ethers.BrowserProvider;
  signer: ethers.Signer;
  address: string;
};

/**
 * MetaMask-only connection
 */
export async function connectWithMetaMask(): Promise<ConnectedWallet> {
  const anyWindow = window as any;

  if (!anyWindow.ethereum) {
    throw new Error("MetaMask not found in this browser.");
  }

  await anyWindow.ethereum.request({
    method: "eth_requestAccounts",
  });

  const provider = new ethers.BrowserProvider(anyWindow.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  return { provider, signer, address };
}

/**
 * WalletConnect v2 connection (QR / deep link)
 */
export async function connectWithWalletConnect(): Promise<ConnectedWallet> {
  if (!WC_PROJECT_ID) {
    throw new Error("WalletConnect project ID missing.");
  }

  const wc = await EthereumProvider.init({
    projectId: WC_PROJECT_ID,
    chains: [SEPOLIA_CHAIN_ID],
    showQrModal: true,
    methods: [
      "eth_sendTransaction",
      "eth_signTransaction",
      "eth_sign",
      "personal_sign",
      "eth_signTypedData",
    ],
    events: ["chainChanged", "accountsChanged"],
    optionalChains: [SEPOLIA_CHAIN_ID],
    rpcMap: {
      [SEPOLIA_CHAIN_ID]: SEPOLIA_RPC,
    },
  });

  await wc.enable();

  const provider = new ethers.BrowserProvider(wc as any);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  return { provider, signer, address };
}
