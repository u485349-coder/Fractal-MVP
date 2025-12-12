"use client";

import { FormEvent, useEffect, useState } from "react";
import { ethers } from "ethers";
import FractalShell from "../../components/FractalShell";

/* ==============================
   CONFIG
============================== */

const FACTORY_ADDRESS =
  "0x4B6Cb0129962A423106DCE0ddf5e1c19051a67e7";

const FACTORY_ABI = [
  "function launchProject(string name, string symbol, string assetURI, uint256 initialSupply, uint256 pricePerTokenWei) external returns (uint256)",
];

/* ==============================
   PAGE
============================== */

export default function CreatorPage() {
  const [mounted, setMounted] = useState(false);

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [assetURI, setAssetURI] = useState("");
  const [initialSupply, setInitialSupply] = useState("60000");
  const [priceETH, setPriceETH] = useState("0.0003");

  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      if (!(window as any).ethereum) {
        alert("MetaMask not found");
        return;
      }

      setSubmitting(true);
      setStatus("Connecting to wallet…");

      const provider = new ethers.BrowserProvider(
        (window as any).ethereum
      );
      const signer = await provider.getSigner();

      const factory = new ethers.Contract(
        FACTORY_ADDRESS,
        FACTORY_ABI,
        signer
      );

      const supply = BigInt(initialSupply || "0");
      const pricePerTokenWei = ethers.parseEther(priceETH || "0");

      setStatus("Sending launchProject transaction…");

      const tx = await factory.launchProject(
        name,
        symbol,
        assetURI,
        supply,
        pricePerTokenWei
      );

      setStatus("Waiting for confirmation…");
      const receipt = await tx.wait();

      setStatus(`✅ Project created (tx ${receipt.hash.slice(0, 10)}…)`);

      setName("");
      setSymbol("");
      setAssetURI("");
    } catch (e: any) {
      console.error(e);
      setStatus(e?.reason || e?.message || "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted) return null;

  return (
    <FractalShell>
      <div className="max-w-xl mx-auto px-4">
        <h1 className="text-2xl text-white mb-2">Create Project</h1>

        <p className="text-sm text-zinc-400 mb-6">
          Deploy a new FCAT + revenue share pair and register it in the Fractal registry.
        </p>

        <form
          onSubmit={handleSubmit}
          className="
            flex flex-col gap-4 rounded-2xl 
            border border-zinc-800 
            bg-[#0d0d0d]/80 
            p-6
            shadow-[0_0_20px_rgba(212,175,55,0.08)]
            transition
          "
        >
          <label className="text-sm text-white">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              required
              className="
                mt-1 w-full px-3 py-2 rounded-lg bg-black 
                border border-zinc-700 text-white text-sm
                focus:outline-none focus:ring-2 focus:ring-[#E3C463]/40
              "
            />
          </label>

          <label className="text-sm text-white">
            Symbol
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.currentTarget.value)}
              required
              className="
                mt-1 w-full px-3 py-2 rounded-lg bg-black 
                border border-zinc-700 text-white text-sm
                focus:outline-none focus:ring-2 focus:ring-[#E3C463]/40
              "
            />
          </label>

          <label className="text-sm text-white">
            Asset URI
            <input
              value={assetURI}
              onChange={(e) => setAssetURI(e.currentTarget.value)}
              required
              className="
                mt-1 w-full px-3 py-2 rounded-lg bg-black 
                border border-zinc-700 text-white text-sm
                focus:outline-none focus:ring-2 focus:ring-[#E3C463]/40
              "
            />
          </label>

          <label className="text-sm text-white">
            Initial Supply
            <input
              type="number"
              min={0}
              value={initialSupply}
              onChange={(e) => setInitialSupply(e.target.value)}
              required
              className="
                mt-1 w-full px-3 py-2 rounded-lg bg-black 
                border border-zinc-700 text-white text-sm
                focus:outline-none focus:ring-2 focus:ring-[#E3C463]/40
              "
            />
          </label>

          <label className="text-sm text-white">
            Price per FCAT (ETH)
            <input
              type="number"
              step="0.000001"
              min={0}
              value={priceETH}
              onChange={(e) => setPriceETH(e.target.value)}
              required
              className="
                mt-1 w-full px-3 py-2 rounded-lg bg-black 
                border border-zinc-700 text-white text-sm
                focus:outline-none focus:ring-2 focus:ring-[#E3C463]/40
              "
            />
          </label>

          {/* ✔ RAINBOW BUTTON (corrected) */}
          <button
            type="submit"
            disabled={submitting}
            className={`
              mt-3 w-full py-2 rounded-full font-semibold text-sm
              transition
              ${
                submitting
                  ? "bg-zinc-700 text-zinc-300 cursor-wait"
                  : "bg-gradient-to-r from-yellow-300 via-purple-500 to-sky-400 text-black hover:opacity-90"
              }
            `}
          >
            {submitting ? "Creating…" : "Create Project"}
          </button>

          {status && (
            <p className="text-sm text-zinc-400 mt-1">{status}</p>
          )}
        </form>
      </div>
    </FractalShell>
  );
}
