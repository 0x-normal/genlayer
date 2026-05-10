"use client";

// Compact network selector. Persists to localStorage and broadcasts a
// `pw:chainchange` event so dependent code re-runs against the new chain.
//
// Visually a small pill with a dropdown menu, designed to sit in a header
// or menu bar without competing for attention.

import { useEffect, useState, useRef } from "react";
import { useSwitchChain, useAccount } from "wagmi";
import {
  getActiveNetwork,
  setActiveNetwork,
  listNetworks,
  isNetworkConfigured,
  NETWORK_LABELS,
  NETWORK_DESCRIPTIONS,
  CHAIN_CHANGE_EVENT,
  type NetworkId,
} from "@/lib/chain";

// Must match the chain ids registered in Providers.tsx.
const WAGMI_CHAIN_ID: Record<NetworkId, number> = {
  studionet: 61999,
  testnetBradbury: 4221,
};

export default function NetworkSwitcher() {
  const [active, setActive] = useState<NetworkId>("studionet");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Keep local state in sync with localStorage (mounting + cross-tab + custom).
  useEffect(() => {
    setActive(getActiveNetwork());
    const handler = () => setActive(getActiveNetwork());
    window.addEventListener(CHAIN_CHANGE_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(CHAIN_CHANGE_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  // Click-outside to close.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const { switchChainAsync } = useSwitchChain();
  const { isConnected, chainId: walletChainId } = useAccount();

  // When the wallet connects or reconnects on a different chain than the one
  // selected for gameplay, prompt it to switch. Otherwise viem will reject
  // writeContract with "chainId should be same as current chainId".
  useEffect(() => {
    if (!isConnected) return;
    const want = WAGMI_CHAIN_ID[active];
    if (walletChainId && walletChainId !== want) {
      switchChainAsync({ chainId: want }).catch((e) =>
        console.warn("[NetworkSwitcher] auto-sync wallet chain failed:", e),
      );
    }
  }, [isConnected, walletChainId, active, switchChainAsync]);

  const choose = async (id: NetworkId) => {
    setActiveNetwork(id);
    setActive(id);
    setOpen(false);
    // Ask the wallet to switch too, so the chainId wagmi/viem sees matches
    // the one genlayer-js uses on writeContract. Silently ignore rejections —
    // localStorage still wins for reads, and the next write will re-prompt.
    if (isConnected) {
      try {
        await switchChainAsync({ chainId: WAGMI_CHAIN_ID[id] });
      } catch (e) {
        console.warn("[NetworkSwitcher] wallet switchChain failed:", e);
      }
    }
  };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 12px",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "#e6e1ff",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 999,
          cursor: "pointer",
          backdropFilter: "blur(8px)",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: isNetworkConfigured(active) ? "#34d399" : "#fb7185",
            boxShadow: isNetworkConfigured(active)
              ? "0 0 8px #34d399"
              : "0 0 8px #fb7185",
          }}
        />
        {NETWORK_LABELS[active]}
        <span style={{ opacity: 0.6, fontSize: 10 }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            minWidth: 240,
            padding: 6,
            background: "rgba(20, 14, 45, 0.96)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12,
            backdropFilter: "blur(14px)",
            boxShadow: "0 20px 50px -10px rgba(0,0,0,0.6)",
            zIndex: 50,
          }}
        >
          {listNetworks().map((id) => {
            const configured = isNetworkConfigured(id);
            const isActive = id === active;
            return (
              <button
                key={id}
                onClick={() => choose(id)}
                disabled={!configured}
                title={!configured ? "Run `npm run deploy` to configure this network." : ""}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  border: "1px solid transparent",
                  borderColor: isActive
                    ? "rgba(184,155,255,0.4)"
                    : "transparent",
                  background: isActive
                    ? "rgba(184,155,255,0.1)"
                    : "transparent",
                  color: configured ? "#f5f2ff" : "#7a719d",
                  borderRadius: 8,
                  cursor: configured ? "pointer" : "not-allowed",
                  fontSize: 13,
                  fontWeight: 500,
                  marginBottom: 2,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: configured ? "#34d399" : "#7a719d",
                    }}
                  />
                  {NETWORK_LABELS[id]}
                  {isActive && (
                    <span style={{ marginLeft: "auto", fontSize: 10, color: "#b89bff" }}>
                      ACTIVE
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "#a097c9", marginTop: 4, lineHeight: 1.4 }}>
                  {configured
                    ? NETWORK_DESCRIPTIONS[id]
                    : "Not deployed yet — run `npm run deploy` and fill .env.local."}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
