"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import FractalShell from "../../components/FractalShell";

/* ==============================
   REGISTRY
============================== */

const REGISTRY_ADDRESS =
  "0x1f10fB380ecB3465193B0d2B52af2C7cE20fdCCe";

const REGISTRY_ABI = [
  "function projectCount() view returns (uint256)",
  "function getProject(uint256 id) view returns (address creator, address fcat, address revenue, string assetURI)",
];

/* ==============================
   REVENUE ABI (CREATOR SIDE)
============================== */

const REVENUE_ABI = [
  "function totalRevenue() view returns (uint256)",
  "function creatorShareInfo() view returns (uint256 gross, uint256 claimed, uint256 remaining)",
  "function creatorWithdraw()",
];

/* ==============================
   TYPES
============================== */

type CreatorProject = {
  id: number;
  asset: string;
  revenueAddress: string;
  totalRevenue: string;
  gross: string;
  claimed: string;
  remaining: string;
};

/* ==============================
   PAGE
============================== */

export default function CreatorDashboard() {
  const [mounted, setMounted] = useState(false);
  const [account, setAccount] = useState<string>("");
  const [projects, setProjects] = useState<CreatorProject[]>([]);
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);

  const [depositAmount, setDepositAmount] = useState<
    Record<number, string>
  >({});
  const [depositingId, setDepositingId] = useState<number | null>(null);

  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    void loadCreatorProjects();
  }, [mounted]);

  async function loadCreatorProjects() {
    const provider =
      (window as any).ethereum
        ? new ethers.BrowserProvider((window as any).ethereum)
        : new ethers.JsonRpcProvider("https://rpc.sepolia.org");

    const registry = new ethers.Contract(
      REGISTRY_ADDRESS,
      REGISTRY_ABI,
      provider
    );

    let addr = account;

    if ((window as any).ethereum && !addr) {
      const signer = await (
        provider as ethers.BrowserProvider
      ).getSigner();
      addr = await signer.getAddress();
      setAccount(addr);
    }

    if (!addr) return;

    const count: bigint = await registry.projectCount();
    const items: CreatorProject[] = [];

    for (let i = 0; i < Number(count); i++) {
      const p = await registry.getProject(i);

      if (p[0].toLowerCase() !== addr.toLowerCase()) continue;

      const revenueContract = new ethers.Contract(
        p[2],
        REVENUE_ABI,
        provider
      );

      const totalRevenue = await revenueContract.totalRevenue();
      const info = await revenueContract.creatorShareInfo();

      items.push({
        id: i,
        asset: p[3],
        revenueAddress: p[2],
        totalRevenue: ethers.formatEther(totalRevenue),
        gross: ethers.formatEther(info[0]),
        claimed: ethers.formatEther(info[1]),
        remaining: ethers.formatEther(info[2]),
      });
    }

    setProjects(items);
  }

  async function withdraw(project: CreatorProject) {
    try {
      if (!(window as any).ethereum) {
        alert("Open in MetaMask to withdraw");
        return;
      }

      setWithdrawingId(project.id);

      const provider = new ethers.BrowserProvider(
        (window as any).ethereum
      );
      const signer = await provider.getSigner();

      const revenue = new ethers.Contract(
        project.revenueAddress,
        REVENUE_ABI,
        signer
      );

      const tx = await revenue.creatorWithdraw();
      await tx.wait();

      await loadCreatorProjects();
      alert("✅ Creator earnings withdrawn");
    } catch (e: any) {
      console.error(e);
      alert(e?.reason || e?.message || "Withdraw failed");
    } finally {
      setWithdrawingId(null);
    }
  }

  async function depositRevenue(
    project: CreatorProject,
    amountEth: string
  ) {
    try {
      if (!(window as any).ethereum) {
        alert("Open in MetaMask to deposit");
        return;
      }
      if (!amountEth || Number(amountEth) <= 0) {
        alert("Enter a valid ETH amount");
        return;
      }

      setDepositingId(project.id);

      const provider = new ethers.BrowserProvider(
        (window as any).ethereum
      );
      const signer = await provider.getSigner();

      const tx = await signer.sendTransaction({
        to: project.revenueAddress,
        value: ethers.parseEther(amountEth),
      });

      await tx.wait();

      setDepositAmount((prev) => ({
        ...prev,
        [project.id]: "",
      }));

      await loadCreatorProjects();
      alert("✅ External revenue deposited");
    } catch (e: any) {
      console.error(e);
      alert(e?.reason || e?.message || "Deposit failed");
    } finally {
      setDepositingId(null);
    }
  }

  if (!mounted) return null;

  return (
    <FractalShell>
      <h1 className="text-2xl text-white mb-2">Creator Dashboard</h1>

      <p className="text-sm text-zinc-400 mb-6">
        Manage your projects, revenue, deposits, and withdrawals.
      </p>

      {projects.length === 0 && (
        <p className="text-zinc-400">No projects found for this wallet.</p>
      )}

      <div className="flex flex-col gap-4">
        {projects.map((p) => {
          const expanded = expandedId === p.id;

          return (
            <div
              key={p.id}
              className="
                rounded-xl 
                border border-zinc-700 
                bg-zinc-900/80
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
                  <p className="text-xs text-zinc-500">Project</p>
                  <p className="text-lg text-white tracking-wide">
                    {p.asset}
                  </p>
                </div>

                <span className="text-[#E3C463] text-sm">
                  {expanded ? "▲" : "▼"}
                </span>
              </button>

              {/* BODY */}
              {expanded && (
                <div className="px-5 pb-5 space-y-4 text-sm">
                  <p className="text-zinc-300">
                    Total Revenue:
                    <span className="text-white"> {p.totalRevenue} ETH</span>
                  </p>

                  <p className="text-zinc-300">
                    Creator Gross:
                    <span className="text-white"> {p.gross} ETH</span>
                  </p>

                  <p className="text-zinc-300">
                    Claimed:
                    <span className="text-white"> {p.claimed} ETH</span>
                  </p>

                  <p className="text-[#E3C463] font-semibold">
                    Remaining: {p.remaining} ETH
                  </p>

                  <input
                    type="number"
                    step="0.0001"
                    placeholder="ETH to deposit"
                    value={depositAmount[p.id] || ""}
                    onChange={(e) =>
                      setDepositAmount((prev) => ({
                        ...prev,
                        [p.id]: e.target.value,
                      }))
                    }
                    className="
                      w-full mt-2 px-3 py-2 rounded-lg 
                      border border-zinc-700 bg-black 
                      text-white text-sm 
                      focus:outline-none focus:ring-2 focus:ring-[#E3C463]/40
                    "
                  />

                  {/* RAINBOW BUTTON: Deposit */}
                  <button
                    onClick={() => depositRevenue(p, depositAmount[p.id] || "")}
                    disabled={depositingId === p.id}
                    className={`
                      w-full py-2 rounded-full font-semibold text-sm transition
                      ${
                        depositingId === p.id
                          ? "bg-zinc-700 text-zinc-300 cursor-wait"
                          : "bg-gradient-to-r from-yellow-300 via-purple-500 to-sky-400 text-black hover:opacity-90"
                      }
                    `}
                  >
                    {depositingId === p.id
                      ? "Depositing…"
                      : "Deposit External Revenue"}
                  </button>

                  {/* RAINBOW BUTTON: Withdraw */}
                  <button
                    onClick={() => withdraw(p)}
                    disabled={withdrawingId === p.id}
                    className={`
                      w-full py-2 rounded-full font-semibold text-sm transition
                      ${
                        withdrawingId === p.id
                          ? "bg-zinc-700 text-zinc-300 cursor-wait"
                          : "bg-gradient-to-r from-yellow-300 via-purple-500 to-sky-400 text-black hover:opacity-90"
                      }
                    `}
                  >
                    {withdrawingId === p.id
                      ? "Withdrawing…"
                      : "Withdraw Earnings"}
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
