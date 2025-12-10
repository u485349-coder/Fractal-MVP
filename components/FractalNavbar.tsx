// components/FractalNavbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinkStyle = (active: boolean): React.CSSProperties => ({
  fontSize: 13,
  letterSpacing: 2,
  textTransform: "uppercase",
  color: active ? "#facc6b" : "#e5e7eb",
  textDecoration: "none",
  padding: "4px 12px",
  borderRadius: 999,
  border: active
    ? "1px solid rgba(250,204,107,0.5)"
    : "1px solid transparent",
});

export default function FractalNavbar() {
  const pathname = usePathname();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        borderBottom: "1px solid rgba(148,163,184,0.2)",
        backdropFilter: "blur(16px)",
        background: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
        }}
      >
        {/* LOGO */}
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", gap: 10 }}
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
              fontSize: 16,
              letterSpacing: 6,
              textTransform: "uppercase",
            }}
          >
            Fractal
          </span>
        </Link>

        {/* NAV */}
        <nav style={{ display: "flex", gap: 14, alignItems: "center" }}>
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

          <Link href="/dashboard">Creator Dashboard</Link>

        </nav>
      </div>
    </header>
  );
}
