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

  // ✅ hydration guard
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

      // reset inputs
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
      <h1 style={{ fontSize: 24, marginBottom: 10 }}>
        Create Project
      </h1>

      <p
        style={{
          color: "#9ca3af",
          marginBottom: 24,
          fontSize: 14,
        }}
      >
        Deploy a new FCAT + revenue share pair and register it in the
        Fractal registry.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: 480,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          borderRadius: 18,
          border: "1px solid rgba(55,65,81,0.9)",
          padding: 18,
          background:
            "radial-gradient(circle at top left, rgba(148,163,184,0.18), transparent 70%)",
        }}
      >
        <label style={{ fontSize: 13 }}>
          Name
          <input
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            required
            style={inputStyle}
          />
        </label>

        <label style={{ fontSize: 13 }}>
          Symbol
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.currentTarget.value)}
            required
            style={inputStyle}
          />
        </label>

        <label style={{ fontSize: 13 }}>
          Asset URI
          <input
            value={assetURI}
            onChange={(e) => setAssetURI(e.currentTarget.value)}
            required
            style={inputStyle}
          />
        </label>

        <label style={{ fontSize: 13 }}>
          Initial Supply
          <input
            type="number"
            min={0}
            value={initialSupply}
            onChange={(e) => setInitialSupply(e.target.value)}
            required
            style={inputStyle}
          />
        </label>

        <label style={{ fontSize: 13 }}>
          Price per FCAT (ETH)
          <input
            type="number"
            step="0.000001"
            min={0}
            value={priceETH}
            onChange={(e) => setPriceETH(e.target.value)}
            required
            style={inputStyle}
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          style={{
            marginTop: 8,
            padding: "9px 0",
            borderRadius: 999,
            border: "none",
            background:
              "linear-gradient(to right, #facc6b, #a855f7, #38bdf8)",
            color: "#020617",
            fontWeight: 600,
            cursor: submitting ? "wait" : "pointer",
          }}
        >
          {submitting ? "Creating…" : "Create Project"}
        </button>

        {status && (
          <p
            style={{
              marginTop: 6,
              fontSize: 13,
              color: "#9ca3af",
            }}
          >
            {status}
          </p>
        )}
      </form>
    </FractalShell>
  );
}

/* ==============================
   STYLES
============================== */

const inputStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 6,
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid rgba(75,85,99,0.9)",
  backgroundColor: "#020617",
  color: "#e5e7eb",
  fontSize: 14,
};
