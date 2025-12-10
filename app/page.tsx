"use client";

import { useEffect, useState, ChangeEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ethers } from "ethers";

// ✅ FIXED IMPORTS (NO ALIASES)
import { Button } from "../components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/card";

/* ==============================
   CONFIG — SEPOLIA
============================== */

// Registry of all projects
const REGISTRY_ADDRESS =
  "0x1f10fB380ecB3465193B0d2B52af2C7cE20fdCCe";

const REGISTRY_ABI = [
  "function projectCount() view returns (uint256)",
  "function getProject(uint256 id) view returns (address creator, address fcat, address revenue, string assetURI)",
];

// Per-project FCAT + Revenue contracts
const FCAT_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
];

const REV_ABI = [
  "function pricePerTokenWei() view returns (uint256)",
  "function claimable(address) view returns (uint256)",
  "function claimRevenue()",
  "function totalRevenue() view returns (uint256)",
];

type HoldingProject = {
  id: number;
  creator: string;
  fcat: string;
  revenue: string;
  assetURI: string;
  balance: bigint;
};

export default function Home() {
  const [provider, setProvider] =
    useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] =
    useState<ethers.Signer | null>(null);
  const [address, setAddress] = useState("");
  const [connected, setConnected] = useState(false);
  const [pulseHero, setPulseHero] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  // wallet’s FCAT holdings
  const [projects, setProjects] = useState<HoldingProject[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(
    null
  );
  const [loadingProjects, setLoadingProjects] =
    useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // metrics for selected FCAT
  const [price, setPrice] = useState("0");
  const [fcatBalance, setFcatBalance] = useState("0");
  const [claimableETH, setClaimableETH] = useState("0");
  const [totalSupply, setTotalSupply] = useState("0");
  const [totalRevenue, setTotalRevenue] = useState("0");
  const [status, setStatus] = useState("");

  const selectedProject =
    projects.find((p) => p.id === selectedId) || null;

  async function connectWallet() {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      alert("MetaMask not detected");
      return;
    }

    await ethereum.request({ method: "eth_requestAccounts" });

    const prov = new ethers.BrowserProvider(ethereum);
    const sign = await prov.getSigner();
    const addr = await sign.getAddress();

    setProvider(prov);
    setSigner(sign);
    setAddress(addr);
    setConnected(true);

    setPulseHero(true);
    setTimeout(() => setPulseHero(false), 1200);

    await loadWalletHoldings(addr, prov);
  }

  async function loadWalletHoldings(
    addr: string,
    prov: ethers.BrowserProvider
  ) {
    setLoadingProjects(true);
    setStatus("Loading your FCAT holdings…");

    try {
      const registry = new ethers.Contract(
        REGISTRY_ADDRESS,
        REGISTRY_ABI,
        prov
      );

      const countBN: bigint = await registry.projectCount();
      const count = Number(countBN);

      const holdings: HoldingProject[] = [];

      for (let i = 0; i < count; i++) {
        const p = await registry.getProject(i);
        const creator = p[0];
        const fcat = p[1];
        const revenue = p[2];
        const assetURI = p[3];

        const fcatContract = new ethers.Contract(
          fcat,
          FCAT_ABI,
          prov
        );
        const bal: bigint = await fcatContract.balanceOf(
          addr
        );

        // Only include FCATs this wallet actually holds
        if (bal > 0n) {
          holdings.push({
            id: i,
            creator,
            fcat,
            revenue,
            assetURI,
            balance: bal,
          });
        }
      }

      setProjects(holdings);

      if (holdings.length > 0) {
        setSelectedId(holdings[0].id);
        await refreshDataFor(holdings[0], addr, prov);
        setStatus("Ready");
      } else {
        setSelectedId(null);
        resetStats();
        setStatus(
          "You do not hold any FCAT yet. Visit the marketplace to buy in."
        );
      }
    } catch (err) {
      console.error(err);
      setStatus("Failed to load holdings");
    } finally {
      setLoadingProjects(false);
    }
  }

  function resetStats() {
    setPrice("0");
    setFcatBalance("0");
    setClaimableETH("0");
    setTotalSupply("0");
    setTotalRevenue("0");
  }

  async function refreshDataFor(
    proj: HoldingProject,
    addr = address,
    prov = provider
  ) {
    if (!addr || !prov || !proj) return;

    setRefreshing(true);
    try {
      const fcat = new ethers.Contract(
        proj.fcat,
        FCAT_ABI,
        prov
      );
      const rev = new ethers.Contract(
        proj.revenue,
        REV_ABI,
        prov
      );

      const [bal, supply, claimableWei, totalRevWei, unitPrice] =
        await Promise.all([
          fcat.balanceOf(addr),
          fcat.totalSupply(),
          rev.claimable(addr),
          rev.totalRevenue(),
          rev.pricePerTokenWei(),
        ]);

      setFcatBalance(bal.toString());
      setTotalSupply(supply.toString());
      setClaimableETH(ethers.formatEther(claimableWei));
      setTotalRevenue(ethers.formatEther(totalRevWei));
      setPrice(ethers.formatEther(unitPrice));
    } catch (err) {
      console.error(err);
      setStatus("Failed to refresh metrics");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleSelectChange(
    e: ChangeEvent<HTMLSelectElement>
  ) {
    const id = Number(e.target.value);
    setSelectedId(id);

    const proj = projects.find((p) => p.id === id);
    if (proj && provider && address) {
      await refreshDataFor(proj, address, provider);
    }
  }

  async function claimRevenue() {
    if (!signer || !selectedProject) return;
    setStatus("Claiming revenue…");

    try {
      const rev = new ethers.Contract(
        selectedProject.revenue,
        REV_ABI,
        signer
      );
      const tx = await rev.claimRevenue();
      await tx.wait();

      setStatus("Revenue claimed");
      if (provider && address) {
        await refreshDataFor(
          selectedProject,
          address,
          provider
        );
      }
    } catch (err: any) {
      console.error(err);
      setStatus(
        err?.reason || err?.message || "Failed to claim"
      );
    }
  }

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-black/80 backdrop-blur border-b border-[#C9A84F]/40 px-4 sm:px-8 lg:px-12 py-4 flex items-center justify-between">
        {/* Brand + logo */}
        <Link
          href="/"
          className="flex items-center gap-3 select-none"
        >
          <div className="relative h-7 w-7 sm:h-8 sm:w-8">
            <Image
              src="/FractalLogo.png"
              alt="Fractal logo"
              fill
              className="object-contain"
            />
          </div>
          <span className="tracking-[0.35em] text-xs sm:text-sm font-semibold">
            FRACTAL
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-10 text-sm ml-8">
          <Link
            href="/marketplace"
            className="hover:text-[#F7E7A5] transition px-2 py-1"
          >
            Marketplace
          </Link>

          <Link
            href="/dashboard"
            className="hover:text-[#F7E7A5] transition px-2 py-1"
          >
            Creator Dashboard
          </Link>

          {connected && (
            <span className="text-[#E3C463] font-mono text-xs">
              {address.slice(0, 6)}…{address.slice(-4)}
            </span>
          )}
        </div>

        {/* Mobile nav toggle */}
        <button
          type="button"
          className="md:hidden text-sm px-3 py-2 border border-[#C9A84F]/60 rounded-lg bg-zinc-950/80"
          onClick={() => setNavOpen((open) => !open)}
        >
          Menu
        </button>

        {/* Mobile menu */}
        {navOpen && (
          <div className="md:hidden absolute top-full right-4 mt-3 bg-zinc-950/95 border border-[#C9A84F]/50 rounded-xl shadow-lg py-2 w-44">
            <Link
              href="/marketplace"
              className="block px-4 py-2 text-sm hover:bg-zinc-800"
              onClick={() => setNavOpen(false)}
            >
              Marketplace
            </Link>
            <Link
              href="/dashboard"
              className="block px-4 py-2 text-sm hover:bg-zinc-800"
              onClick={() => setNavOpen(false)}
            >
              Creator Dashboard
            </Link>
            {connected && (
              <div className="px-4 py-2 text-xs text-[#E3C463] font-mono border-t border-zinc-800 mt-1">
                {address.slice(0, 6)}…{address.slice(-4)}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="relative text-center pt-32 pb-24 sm:py-36">
        <div
          className={`absolute inset-0 blur-3xl transition-all duration-1000
          bg-[radial-gradient(circle_at_center,_rgba(214,182,92,0.25),_transparent_65%)]
          ${pulseHero ? "opacity-90 scale-110" : "opacity-50"}`}
        />

        <div className="relative max-w-4xl mx-auto space-y-6 px-4">
          <div className="relative h-24 w-24 sm:h-28 sm:w-28 mx-auto">
            <Image src="/FractalLogo.png" alt="Fractal" fill />
          </div>

          {/* Slightly smaller hero title per feedback */}
          <h1 className="text-5xl sm:text-6xl tracking-[0.24em] font-bold">
            FRACTAL
          </h1>

          <p className="text-white/80 text-sm sm:text-base">
            Let fans invest in your work — and get paid with you.
          </p>

          {!connected ? (
            <Button onClick={connectWallet}>
              Connect Wallet
            </Button>
          ) : (
            <p className="text-sm text-[#E3C463]">
              {refreshing
                ? "Refreshing…"
                : status || "Ready"}
            </p>
          )}
        </div>
      </section>

      {/* DASHBOARD */}
      <section className="grid md:grid-cols-3 gap-8 md:gap-10 max-w-6xl mx-auto px-4 sm:px-8 pb-24 pt-4 sm:pt-8">
        {/* LEFT CARD: FCAT SELECTOR */}
        <Card
          className="bg-zinc-900/85 border border-[#C9A84F]/40 transition-all
                     hover:border-[#F7E7A5]
                     hover:shadow-[0_0_40px_rgba(234,179,8,0.25)]
                     hover:-translate-y-1"
        >
          <CardHeader>
            <CardTitle className="text-white">
              Select FCAT
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!connected && (
              <p className="text-sm text-zinc-300">
                Connect your wallet to see your FCAT holdings.
              </p>
            )}

            {connected && loadingProjects && (
              <p className="text-sm text-zinc-300">
                Loading your projects…
              </p>
            )}

            {connected &&
              !loadingProjects &&
              projects.length === 0 && (
                <p className="text-sm text-zinc-300">
                  You do not hold any FCAT yet.{" "}
                  <Link
                    href="/marketplace"
                    className="text-[#F7E7A5] underline"
                  >
                    Browse the marketplace
                  </Link>{" "}
                  to buy in.
                </p>
              )}

            {connected &&
              !loadingProjects &&
              projects.length > 0 && (
                <>
                  <select
                    value={
                      selectedId !== null ? selectedId : undefined
                    }
                    onChange={handleSelectChange}
                    className="w-full p-3 bg-black border border-zinc-600 rounded text-white text-sm"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.assetURI || "Untitled"} •{" "}
                        {p.fcat.slice(0, 6)}…{p.fcat.slice(-4)}
                      </option>
                    ))}
                  </select>

                  {selectedProject && (
                    <div className="text-sm text-zinc-200 space-y-1">
                      <p>
                        Creator:{" "}
                        <span className="font-mono text-xs">
                          {selectedProject.creator.slice(0, 6)}…
                          {selectedProject.creator.slice(-4)}
                        </span>
                      </p>
                      <p>
                        Price:{" "}
                        <span className="text-[#E3C463]">
                          {price} ETH / FCAT
                        </span>
                      </p>
                    </div>
                  )}
                </>
              )}
          </CardContent>
        </Card>

        {/* MIDDLE CARD: HOLDINGS */}
        <Card
          className="bg-zinc-900/85 border border-[#C9A84F]/40 transition-all
                     hover:border-[#F7E7A5]
                     hover:shadow-[0_0_40px_rgba(234,179,8,0.25)]
                     hover:-translate-y-1"
        >
          <CardHeader>
            <CardTitle className="text-white">
              Your Holdings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-white">
              FCAT:{" "}
              <span className="font-semibold">
                {fcatBalance}
              </span>
            </p>
            <p className="text-sm text-[#E3C463]">
              Claimable: {claimableETH} ETH
            </p>
            <Button
              onClick={claimRevenue}
              className="w-full mt-4"
              disabled={!selectedProject || !connected}
            >
              Claim
            </Button>
          </CardContent>
        </Card>

        {/* RIGHT CARD: NETWORK METRICS */}
        <Card
          className="bg-zinc-900/85 border border-[#C9A84F]/40 transition-all
                     hover:border-[#F7E7A5]
                     hover:shadow-[0_0_40px_rgba(234,179,8,0.25)]
                     hover:-translate-y-1"
        >
          <CardHeader>
            <CardTitle className="text-white">
              Network
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-white">
              Total Supply:{" "}
              <span className="font-semibold">
                {totalSupply}
              </span>
            </p>
            <p className="text-sm text-[#E3C463]">
              Total Revenue: {totalRevenue} ETH
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
