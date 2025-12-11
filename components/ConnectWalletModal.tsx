// components/ConnectWalletModal.tsx
"use client";

import React from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onMetaMask: () => void;
  onWalletConnect: () => void;
};

export default function ConnectWalletModal({
  open,
  onClose,
  onMetaMask,
  onWalletConnect,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-5">
        <h2 className="mb-2 text-lg font-semibold text-white">
          Connect Wallet
        </h2>
        <p className="mb-4 text-sm text-zinc-400">
          Choose how you want to connect. Use MetaMask on desktop, or
          WalletConnect for any mobile wallet.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onMetaMask}
            className="w-full rounded-full bg-zinc-100 px-4 py-2 text-sm font-semibold text-black hover:bg-white"
          >
            MetaMask
          </button>

          <button
            onClick={onWalletConnect}
            className="w-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
          >
            WalletConnect
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full text-center text-xs text-zinc-500 hover:text-zinc-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
