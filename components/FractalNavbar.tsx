"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ethers } from "ethers";

// WalletConnect Modal
import { WalletConnectModal } from "@walletconnect/modal";

// Project ID
const wcProjectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || "";

// Modal instance (browser only)
let wcModal: WalletConnectModal | null = null;
if (typeof window !== "undefined" && wcProjectId) {
  wcModal = new WalletConnectModal({
    projectId: wcProjectId,
  });
}

export default function FractalNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<any>(null);

  useEffect(() => {
    // close menu on route change
    setOpen(false);
  }, [pathname]);

  /* ===============================
     CONNECT WALLET
  =============================== */
  async function connectWallet() {
    try {
      if (!wcModal) {
        alert("WalletConnect not initialized");
        return;
      }

      // Opens WalletConnect modal → user selects MetaMask / Coinbase / etc.
      const session = await wcModal.openModal();
      if (!session) return;

      const account = session?.addresses?.[0];
      const chain = session?.chains?.[0];

      if (!account) return;

      setAddress(account);

      // Create an ethers provider for read calls
      const ethersProvider = new ethers.JsonRpcProvider(
        `https://rpc.walletconnect.org/v1/?chainId=${chain}`
      );
      setProvider(ethersProvider);
    } catch (err) {
      console.error("WalletConnect error:", err);
    }
  }

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        borderBottom: "1px solid rgba(148,163,184,0.2)",
        backdropFilter: "blur(16px)",
        background:
          "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
        }}
      >
        {/* LOGO */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              border: "1px solid rgba(250,250,250,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "black",
            }}
          >
            <img
              src="/FractalLogo.png"
              alt="Fractal Logo"
              style={{
                width: "70%",
                height: "70%",
                objectFit: "contain",
              }}
            />
          </div>

          <span
            style={{
              fontSize: 15,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#FFFFFF",     // <<<<<< ONLY CHANGE
            }}
          >
            Fractal
          </span>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="fractal-desktop-nav">
          <Link href="/" style={linkStyle(pathname === "/")}>
            Investor
          </Link>

          <Link
            href="/marketplace"
            style={linkStyle(pathname.startsWith("/marketplace"))}
          >
            Marketplace
          </Link>

          <Link href="/creator" style={linkStyle(pathname === "/creator")}>
            Create Project
          </Link>

          <Link
            href="/dashboard"
            style={linkStyle(pathname.startsWith("/dashboard"))}
          >
            Creator Dashboard
          </Link>

          {/* CONNECT WALLET BUTTON */}
          {!address ? (
            <button onClick={connectWallet} style={connectButton}>
              Connect Wallet
            </button>
          ) : (
            <span style={addressStyle}>
              {address.slice(0, 6)}…{address.slice(-4)}
            </span>
          )}
        </nav>

        {/* MOBILE MENU BUTTON */}
        <button onClick={() => setOpen((o) => !o)} style={mobileButton}>
          ☰
        </button>
      </div>

      {/* MOBILE DROPDOWN */}
      {open && (
        <div style={mobileDropdown}>
          <Link href="/" style={linkStyle(pathname === "/")}>
            Investor
          </Link>

          <Link
            href="/marketplace"
            style={linkStyle(pathname.startsWith("/marketplace"))}
          >
            Marketplace
          </Link>

          <Link href="/creator" style={linkStyle(pathname === "/creator")}>
            Create Project
          </Link>

          <Link
            href="/dashboard"
            style={linkStyle(pathname.startsWith("/dashboard"))}
          >
            Creator Dashboard
          </Link>

          {!address ? (
            <button
              onClick={connectWallet}
              style={{ ...connectButton, width: "100%", marginTop: 6 }}
            >
              Connect Wallet
            </button>
          ) : (
            <span style={addressStyle}>
              {address.slice(0, 6)}…{address.slice(-4)}
            </span>
          )}
        </div>
      )}

      {/* STYLES */}
      <style jsx>{`
        nav.fractal-desktop-nav {
          display: none;
          gap: 14px;
          align-items: center;
        }
        @media (min-width: 768px) {
          nav.fractal-desktop-nav {
            display: flex;
          }
          button[style*="#020617"] {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}

/* ============================================
   SHARED STYLES
============================================ */

const linkStyle = (active: boolean): React.CSSProperties => ({
  fontSize: 13,
  letterSpacing: 2,
  textTransform: "uppercase",
  color: active ? "#facc6b" : "#e5e7eb",
  textDecoration: "none",
  padding: "6px 14px",
  borderRadius: 999,
  border: active
    ? "1px solid rgba(250,204,107,0.5)"
    : "1px solid transparent",
});

const connectButton: React.CSSProperties = {
  padding: "6px 14px",
  background: "linear-gradient(to right, #facc6b, #7c3aed)",
  color: "#020617",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

const addressStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#E3C463",
  fontFamily: "monospace",
};

const mobileButton: React.CSSProperties = {
  border: "1px solid rgba(75,85,99,0.7)",
  borderRadius: 10,
  padding: "6px 10px",
  fontSize: 14,
  background: "#020617",
  color: "#e5e7eb",
};

const mobileDropdown: React.CSSProperties = {
  padding: "12px 16px 16px",
  display: "flex",
  flexDirection: "column",
  gap: 10,
  borderTop: "1px solid rgba(148,163,184,0.15)",
  background: "#020617",
};
