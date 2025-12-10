// app/creator/dashboard/page.tsx
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

  // ✅ NEW STATE (DEPOSIT)
  const [depositAmount, setDepositAmount] = useState<
    Record<number, string>
  >({});
  const [depositingId, setDepositingId] = useState<number | null>(
    null
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    void connect();
  }, [mounted]);

  async function connect() {
    if (!(window as any).ethereum) return;

    const provider = new ethers.BrowserProvider(
      (window as any).ethereum
    );
    const signer = await provider.getSigner();
    const addr = await signer.getAddress();

    setAccount(addr);
    await loadCreatorProjects(addr, provider);
  }

  async function loadCreatorProjects(
    addr: string,
    provider: ethers.BrowserProvider
  ) {
    const registry = new ethers.Contract(
      REGISTRY_ADDRESS,
      REGISTRY_ABI,
      provider
    );

    const count: bigint = await registry.projectCount();
    const items: CreatorProject[] = [];

    for (let i = 0; i < Number(count); i++) {
      const p = await registry.getProject(i);

      const creator = p[0];
      if (creator.toLowerCase() !== addr.toLowerCase()) continue;

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
      if (!(window as any).ethereum) return;

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

      await connect();
      alert("✅ Creator earnings withdrawn");
    } catch (e: any) {
      console.error(e);
      alert(e?.reason || e?.message || "Withdraw failed");
    } finally {
      setWithdrawingId(null);
    }
  }

  // ✅ NEW: DEPOSIT EXTERNAL REVENUE
  async function depositRevenue(
    project: CreatorProject,
    amountEth: string
  ) {
    try {
      if (!(window as any).ethereum) return;
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

      await connect();
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
      <h1 style={{ fontSize: 26, marginBottom: 10 }}>
        Creator Dashboard
      </h1>

      <p style={{ color: "#9ca3af", marginBottom: 24 }}>
        View your projects, revenue, and deposit or withdraw
        earnings.
      </p>

      {projects.length === 0 && (
        <p style={{ color: "#9ca3af" }}>
          No projects found for this wallet.
        </p>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {projects.map((p) => (
          <div
            key={p.id}
            style={{
              borderRadius: 16,
              border:
                "1px solid rgba(55,65,81,0.9)",
              padding: 18,
              background:
                "radial-gradient(circle at top left, rgba(148,163,184,0.18), transparent 70%)",
            }}
          >
            <p
              style={{ fontSize: 18, marginBottom: 4 }}
            >
              {p.asset}
            </p>

            <p
              style={{ fontSize: 13, color: "#9ca3af" }}
            >
              Total Revenue: {p.totalRevenue} ETH
            </p>

            <p style={{ fontSize: 13 }}>
              Creator Gross: {p.gross} ETH
            </p>

            <p style={{ fontSize: 13 }}>
              Claimed: {p.claimed} ETH
            </p>

            <p
              style={{ fontSize: 14, color: "#facc6b" }}
            >
              Remaining: {p.remaining} ETH
            </p>

            {/* ✅ DEPOSIT EXTERNAL REVENUE */}
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
              style={{
                width: "100%",
                marginTop: 12,
                padding: "8px 12px",
                borderRadius: 12,
                border:
                  "1px solid rgba(55,65,81,0.9)",
                background: "#020617",
                color: "#e5e7eb",
              }}
            />

            <button
              onClick={() =>
                depositRevenue(
                  p,
                  depositAmount[p.id] || ""
                )
              }
              disabled={depositingId === p.id}
              style={{
                marginTop: 10,
                padding: "8px 16px",
                borderRadius: 999,
                border: "none",
                background:
                  "linear-gradient(to right, #38bdf8, #22c55e)",
                color: "#020617",
                fontWeight: 600,
                cursor:
                  depositingId === p.id
                    ? "wait"
                    : "pointer",
              }}
            >
              {depositingId === p.id
                ? "Depositing…"
                : "Deposit External Revenue"}
            </button>

            <p
              style={{
                fontSize: 11,
                color: "#9ca3af",
                marginTop: 4,
              }}
            >
              This action is irreversible. Deposited
              funds are automatically shared with FCAT
              holders per the revenue split.
            </p>

            {/* ✅ WITHDRAW CREATOR EARNINGS */}
            <button
              onClick={() => withdraw(p)}
              disabled={withdrawingId === p.id}
              style={{
                marginTop: 10,
                padding: "8px 16px",
                borderRadius: 999,
                border: "none",
                background:
                  "linear-gradient(to right, #facc6b, #a855f7, #38bdf8)",
                color: "#020617",
                fontWeight: 600,
                cursor:
                  withdrawingId === p.id
                    ? "wait"
                    : "pointer",
              }}
            >
              {withdrawingId === p.id
                ? "Withdrawing…"
                : "Withdraw Earnings"}
            </button>
          </div>
        ))}
      </div>
    </FractalShell>
  );
}
