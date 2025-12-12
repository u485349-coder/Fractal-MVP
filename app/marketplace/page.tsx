"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";

// ✅ RELATIVE IMPORT — matches your repo
import FractalShell from "../../components/FractalShell";

/* ==============================
   CONFIG
============================== */

const REGISTRY_ADDRESS =
  "0x1f10fB380ecB3465193B0d2B52af2C7cE20fdCCe";

const REGISTRY_ABI = [
  "function projectCount() view returns (uint256)",
  "function getProject(uint256 id) view returns (address creator, address fcat, address revenue, string assetURI)",
];

const REVENUE_ABI = [
  "function pricePerTokenWei() view returns (uint256)",
  "function buy(uint256 amount) payable",
];

type MarketProject = {
  id: number;
  creator: string;
  fcat: string;
  revenue: string;
  assetURI: string;
  priceETH: string;
};

export default function MarketplacePage() {
  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState<MarketProject[]>([]);
  const [buyingId, setBuyingId] = useState<number | null>(null);

  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    loadProjects();
  }, [mounted]);

  async function loadProjects() {
    const provider =
      (window as any).ethereum
        ? new ethers.BrowserProvider((window as any).ethereum)
        : new ethers.JsonRpcProvider("https://rpc.sepolia.org");

    const registry = new ethers.Contract(
      REGISTRY_ADDRESS,
      REGISTRY_ABI,
      provider
    );

    const count = Number(await registry.projectCount());
    const items: MarketProject[] = [];

    for (let i = 0; i < count; i++) {
      const p = await registry.getProject(i);

      const creator = p[0];
      const fcat = p[1];
      const revenue = p[2];
      const assetURI = p[3];

      const revenueContract = new ethers.Contract(
        revenue,
        REVENUE_ABI,
        provider
      );

      const priceWei: bigint =
        await revenueContract.pricePerTokenWei();

      items.push({
        id: i,
        creator,
        fcat,
        revenue,
        assetURI,
        priceETH: ethers.formatEther(priceWei),
      });
    }

    setProjects(items);
  }

  async function buyOne(p: MarketProject) {
    try {
      if (!(window as any).ethereum) {
        alert("Open this page inside MetaMask to buy");
        return;
      }

      setBuyingId(p.id);

      const provider = new ethers.BrowserProvider(
        (window as any).ethereum
      );
      const signer = await provider.getSigner();

      const revenue = new ethers.Contract(
        p.revenue,
        REVENUE_ABI,
        signer
      );

      const price: bigint = await revenue.pricePerTokenWei();

      const tx = await revenue.buy(1, { value: price });
      await tx.wait();

      alert("✅ FCAT purchased successfully");
    } catch (e: any) {
      console.error(e);
      alert(e?.reason || e?.message || "Purchase failed");
    } finally {
      setBuyingId(null);
    }
  }

  if (!mounted) return null;

  return (
    <FractalShell>
      <h1 className="text-2xl text-white mb-2">Fractal Marketplace</h1>

      <p className="text-sm text-zinc-400 mb-6">
        Browse live creator projects. Each FCAT lets you invest directly in a creator’s work.
      </p>

      {projects.length === 0 && (
        <p className="text-zinc-400">No projects yet.</p>
      )}

      <div className="flex flex-col gap-4">
        {projects.map((p) => {
          const expanded = expandedId === p.id;

          return (
            <div
              key={p.id}
              className="
                rounded-xl border border-zinc-800 
                bg-[#161819]
                overflow-hidden
                transition
              "
            >
              {/* HEADER */}
              <button
                onClick={() => setExpandedId(expanded ? null : p.id)}
                className="w-full text-left px-5 py-4 flex justify-between items-center"
              >
                <div>
                  <p className="text-xs text-zinc-500">Asset</p>
                  <p className="text-lg text-white tracking-wide">
                    {p.assetURI}
                  </p>
                </div>

                <span className="text-[#E3C463] text-sm">
                  {expanded ? "▲" : "▼"}
                </span>
              </button>

              {/* BODY */}
              {expanded && (
                <div className="px-5 pb-5 space-y-4 text-sm">
                  <div>
                    <p className="text-zinc-500">Creator</p>
                    <p className="text-white">
                      {p.creator.slice(0, 6)}…{p.creator.slice(-4)}
                    </p>
                  </div>

                  <div>
                    <p className="text-zinc-500">Price</p>
                    <p className="text-[#E3C463] font-semibold">
                      {p.priceETH} ETH / FCAT
                    </p>
                  </div>

                  <button
                    onClick={() => buyOne(p)}
                    disabled={buyingId === p.id}
                    className={`
                      w-full mt-3 py-2 rounded-full font-semibold text-sm
                      transition 
                      ${
                        buyingId === p.id
                          ? "bg-zinc-700 text-zinc-300 cursor-wait"
                          : "bg-gradient-to-r from-yellow-300 via-purple-500 to-sky-400 text-black hover:opacity-90"
                      }
                    `}
                  >
                    {buyingId === p.id ? "Buying…" : "Buy 1 FCAT"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </FractalShell>
  );
}
