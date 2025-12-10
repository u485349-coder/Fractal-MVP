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

/* ==============================
   TYPES
============================== */

type MarketProject = {
  id: number;
  creator: string;
  fcat: string;
  revenue: string;
  assetURI: string;
};

/* ==============================
   PAGE
============================== */

export default function MarketplacePage() {
  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState<MarketProject[]>([]);
  const [buyingId, setBuyingId] = useState<number | null>(null);

  // ✅ hydration guard
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    loadProjects();
  }, [mounted]);

  async function loadProjects() {
    if (!(window as any).ethereum) return;

    const provider = new ethers.BrowserProvider(
      (window as any).ethereum
    );

    const registry = new ethers.Contract(
      REGISTRY_ADDRESS,
      REGISTRY_ABI,
      provider
    );

    const count = Number(await registry.projectCount());
    const items: MarketProject[] = [];

    for (let i = 0; i < count; i++) {
      const p = await registry.getProject(i);

      // ✅ ethers v6 positional returns
      items.push({
        id: i,
        creator: p[0],
        fcat: p[1],
        revenue: p[2],
        assetURI: p[3],
      });
    }

    setProjects(items);
  }

  async function buyOne(p: MarketProject) {
    try {
      if (!(window as any).ethereum) {
        alert("MetaMask not found");
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
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>
        Fractal Marketplace
      </h1>

      <p
        style={{
          color: "#9ca3af",
          marginBottom: 24,
          fontSize: 14,
        }}
      >
        Browse live creator projects. Each card represents a FCAT you
        can buy into.
      </p>

      {projects.length === 0 && (
        <p style={{ color: "#9ca3af" }}>No projects yet.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {projects.map((p) => (
          <div
            key={p.id}
            style={{
              borderRadius: 16,
              border: "1px solid rgba(55,65,81,0.9)",
              padding: 14,
              background:
                "radial-gradient(circle at top left, rgba(148,163,184,0.18), transparent 70%)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
              }}
            >
              <div>
                <p style={{ fontSize: 13, color: "#9ca3af" }}>Asset</p>
                <p style={{ fontSize: 18 }}>{p.assetURI}</p>

                <p
                  style={{
                    marginTop: 6,
                    fontSize: 13,
                    color: "#9ca3af",
                  }}
                >
                  Creator
                </p>
                <p style={{ fontSize: 14 }}>
                  {p.creator.slice(0, 6)}…{p.creator.slice(-4)}
                </p>
              </div>

              <div style={{ textAlign: "right" }}>
                <button
                  onClick={() => buyOne(p)}
                  disabled={buyingId === p.id}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 999,
                    border: "none",
                    background:
                      "linear-gradient(to right, #facc6b, #a855f7, #38bdf8)",
                    color: "#020617",
                    fontWeight: 600,
                    cursor:
                      buyingId === p.id ? "wait" : "pointer",
                    fontSize: 13,
                  }}
                >
                  {buyingId === p.id ? "Buying…" : "Buy 1 FCAT"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </FractalShell>
  );
}
