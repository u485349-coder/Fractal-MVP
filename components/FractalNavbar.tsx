"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import WalletConnectClient from "@walletconnect/client";
import QRCodeModal from "@walletconnect/qrcode-modal"; // ← ADDED

const navLinkStyle = (active: boolean): React.CSSProperties => ({
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

export default function FractalNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const [address, setAddress] = useState("");

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  /* ================================
     CONNECT WALLET (WC v1 + QR)
  ================================= */
  async function connectWallet() {
    try {
      const connector = new WalletConnectClient({
        bridge: "https://bridge.walletconnect.org",
      });

      if (!connector.connected) {
        await connector.createSession();
      }

      const uri = connector.uri;
      const encoded = encodeURIComponent(uri);
      const metamaskDeepLink = `https://metamask.app.link/wc?uri=${encoded}`;

      const isMobile = /Mobi|Android/i.test(window.navigator.userAgent);

      if (isMobile) {
        // mobile → deep link
        window.location.href = metamaskDeepLink;
      } else {
        // desktop → show QR modal (ADDED)
        QRCodeModal.open(uri, () => {
          console.log("QR Code modal closed");
        });
      }

      // handle connection
      connector.on("connect", (error: any, payload: any) => {
        if (error) throw error;

        QRCodeModal.close(); // close desktop QR when connected

        const { accounts } = payload.params[0];
        if (accounts && accounts.length > 0) {
          setAddress(accounts[0]);
        }
      });
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
              background:
                "radial-gradient(circle at 30% 0, #facc6b 0, #7c3aed 40%, #020617 80%)",
              boxShadow: "0 0 25px rgba(250,204,107,0.35)",
            }}
          >
            <span style={{ fontSize: 20 }}>Ϝ</span>
          </div>

          <span
            style={{
              fontSize: 15,
              letterSpacing: 6,
              textTransform: "uppercase",
            }}
          >
            Fractal
          </span>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="fractal-desktop-nav">
          <Link href="/" style={navLinkStyle(pathname === "/")}>
            Investor
          </Link>

          <Link
            href="/marketplace"
            style={navLinkStyle(pathname.startsWith("/marketplace"))}
          >
            Marketplace
          </Link>

          <Link
            href="/creator"
            style={navLinkStyle(pathname === "/creator")}
          >
            Create Project
          </Link>

          <Link
            href="/dashboard"
            style={navLinkStyle(pathname.startsWith("/dashboard"))}
          >
            Creator Dashboard
          </Link>

          {/* DESKTOP CONNECT WALLET */}
          <button
            onClick={connectWallet}
            style={{
              padding: "6px 14px",
              marginLeft: 8,
              background: "#facc6b",
              color: "#020617",
              borderRadius: 999,
              border: "none",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {address
              ? `${address.slice(0, 6)}…${address.slice(-4)}`
              : "Connect Wallet"}
          </button>
        </nav>

        {/* MOBILE MENU BUTTON */}
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            border: "1px solid rgba(75,85,99,0.7)",
            borderRadius: 10,
            padding: "6px 10px",
            fontSize: 14,
            background: "#020617",
            color: "#e5e7eb",
          }}
        >
          ☰
        </button>
      </div>

      {/* MOBILE DROPDOWN */}
      {open && (
        <div
          style={{
            padding: "12px 16px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            borderTop: "1px solid rgba(148,163,184,0.15)",
            background: "#020617",
          }}
        >
          <Link href="/" style={navLinkStyle(pathname === "/")}>
            Investor
          </Link>

          <Link
            href="/marketplace"
            style={navLinkStyle(pathname.startsWith("/marketplace"))}
          >
            Marketplace
          </Link>

          <Link
            href="/creator"
            style={navLinkStyle(pathname === "/creator")}
          >
            Create Project
          </Link>

          <Link
            href="/dashboard"
            style={navLinkStyle(pathname.startsWith("/dashboard"))}
          >
            Creator Dashboard
          </Link>

          {/* MOBILE CONNECT WALLET */}
          <button
            onClick={connectWallet}
            style={{
              padding: "6px 14px",
              marginTop: 6,
              background: "#facc6b",
              color: "#020617",
              borderRadius: 999,
              border: "none",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {address
              ? `${address.slice(0, 6)}…${address.slice(-4)}`
              : "Connect Wallet"}
          </button>
        </div>
      )}

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
          button[style*="☰"] {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}
