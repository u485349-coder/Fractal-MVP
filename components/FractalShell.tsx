// components/FractalShell.tsx
import type { ReactNode } from "react";
import FractalNavbar from "./FractalNavbar";

export default function FractalShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: "100vh" }}>
      <FractalNavbar />
      <main
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "32px 20px 80px 20px",
        }}
      >
        {children}
      </main>
    </div>
  );
}
