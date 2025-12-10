"use client";

import { useEffect, useState } from "react";
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
const FCAT_ADDRESS = "0x77308C24544364130039dCBEfe16528E9D708315";
const REVENUE_ADDRESS = "0x76a34937656481738955f24578476eaa3c48a38f";

const FCAT_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
];

const REV_ABI = [
  "function pricePerTokenWei() view returns (uint256)",
  "function buy(uint256 amount) payable",
  "function claimable(address) view returns (uint256)",
  "function claimRevenue()",
  "function totalRevenue() view returns (uint256)",
];

export default function Home() {
  const [provider, setProvider] =
    useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] =
    useState<ethers.Signer | null>(null);
  const [address, setAddress] = useState("");
  const [connected, setConnected] = useState(false);
  const [pulseHero, setPulseHero] = useState(false);

  const [amount, setAmount] = useState(1);
  const [price, setPrice] = useState("0");
  const [fcatBalance, setFcatBalance] = useState("0");
  const [claimableETH, setClaimableETH] = useState("0");
  const [totalSupply, setTotalSupply] = useState("0");
  const [totalRevenue, setTotalRevenue] = useState("0");
  const [status, setStatus] = useState("");

  async function connectWallet() {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return alert("MetaMask not detected");

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

    refreshData(addr, prov);
  }

  async function refreshData(addr = address, prov = provider) {
    if (!addr || !prov) return;

    const fcat = new ethers.Contract(
      FCAT_ADDRESS,
      FCAT_ABI,
      prov
    );
    const rev = new ethers.Contract(
      REVENUE_ADDRESS,
      REV_ABI,
      prov
    );

    setFcatBalance((await fcat.balanceOf(addr)).toString());
    setTotalSupply((await fcat.totalSupply()).toString());
    setClaimableETH(
      ethers.formatEther(await rev.claimable(addr))
    );
    setTotalRevenue(
      ethers.formatEther(await rev.totalRevenue())
    );
    setPrice(
      ethers.formatEther(await rev.pricePerTokenWei())
    );
  }

  async function buyTokens() {
    if (!signer) return;
    setStatus("Buying FCAT…");

    const rev = new ethers.Contract(
      REVENUE_ADDRESS,
      REV_ABI,
      signer
    );
    const unitPrice = await rev.pricePerTokenWei();

    await (
      await rev.buy(amount, {
        value: unitPrice * BigInt(amount),
      })
    ).wait();

    await refreshData();
    setStatus("Purchase complete");
  }

  async function claimRevenue() {
    if (!signer) return;
    setStatus("Claiming revenue…");

    const rev = new ethers.Contract(
      REVENUE_ADDRESS,
      REV_ABI,
      signer
    );
    await (await rev.claimRevenue()).wait();

    await refreshData();
    setStatus("Revenue claimed");
  }

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur border-b border-[#C9A84F]/40 px-12 py-5 flex justify-between items-center">
        <span className="tracking-[0.35em] font-semibold">
          FRACTAL
        </span>

        <div className="flex gap-8 text-sm items-center">
          <Link href="/marketplace" className="hover:text-[#F7E7A5] transition">
            Marketplace
          </Link>

          <Link href="/dashboard" className="hover:text-[#F7E7A5] transition">
            Creator Dashboard
          </Link>

          {connected && (
            <span className="text-[#E3C463] font-mono">
              {address.slice(0, 6)}…{address.slice(-4)}
            </span>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="relative text-center py-36">
        <div
          className={`absolute inset-0 blur-3xl transition-all duration-1000
          bg-[radial-gradient(circle_at_center,_rgba(214,182,92,0.25),_transparent_65%)]
          ${pulseHero ? "opacity-90 scale-110" : "opacity-50"}`}
        />

        <div className="relative max-w-4xl mx-auto space-y-6">
          <div className="relative h-28 w-28 mx-auto">
            <Image src="/FractalLogo.png" alt="Fractal" fill />
          </div>

          <h1 className="text-6xl tracking-[0.24em] font-bold">
            FRACTAL
          </h1>

          <p className="text-white/80">
            Let fans invest in your work — and get paid with you.
          </p>

          {!connected ? (
            <Button onClick={connectWallet}>
              Connect Wallet
            </Button>
          ) : (
            <p className="text-sm text-[#E3C463]">{status}</p>
          )}
        </div>
      </section>

      {/* DASHBOARD */}
      <section className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto px-8 pb-24 pt-24">
        {[
          {
            title: "Buy FCAT",
            body: (
              <>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(+e.target.value)}
                  className="w-full p-3 bg-black border border-zinc-600 rounded text-white"
                />
                <p className="mt-3 text-[#E3C463]">{price} ETH</p>
                <Button onClick={buyTokens} className="w-full mt-4">
                  Buy FCAT
                </Button>
              </>
            ),
          },
          {
            title: "Your Holdings",
            body: (
              <>
                <p>
                  FCAT: <span className="font-semibold">{fcatBalance}</span>
                </p>
                <p className="text-[#E3C463] mt-1">
                  Claimable: {claimableETH} ETH
                </p>
                <Button onClick={claimRevenue} className="w-full mt-4">
                  Claim
                </Button>
              </>
            ),
          },
          {
            title: "Network",   // ✅ ONLY WORD CHANGED
            body: (
              <>
                <p>
                  Total Supply:{" "}
                  <span className="font-semibold">{totalSupply}</span>
                </p>
                <p className="text-[#E3C463]">
                  Total Revenue: {totalRevenue} ETH
                </p>
              </>
            ),
          },
        ].map(({ title, body }, i) => (
          <Card
            key={i}
            className="bg-zinc-900/85 border border-[#C9A84F]/40 hover:border-[#F7E7A5] transition-all"
          >
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">{body}</CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
