import { useEffect, useState } from "react";

export type NetType = "Wi-Fi" | "Mobile data" | "Ethernet" | "Offline" | "Unknown";

export interface NetworkInfo {
  online: boolean;
  type: NetType;
  detail: string;
  carrier: string;
}

function readNetwork(): NetworkInfo {
  const online = typeof navigator !== "undefined" ? navigator.onLine : true;
  const conn = (navigator as any)?.connection || (navigator as any)?.mozConnection || (navigator as any)?.webkitConnection;
  let type: NetType = online ? "Unknown" : "Offline";
  let detail = online ? "نوع شبکه نامشخص" : "اتصال اینترنت قطع است";
  let carrier = "Unknown";

  if (!online) return { online: false, type: "Offline", detail, carrier };

  if (conn) {
    const t = String(conn.type || conn.effectiveType || "").toLowerCase();
    if (t.includes("wifi") || t === "wifi") {
      type = "Wi-Fi";
      detail = conn.effectiveType ? `وای‌فای · ${conn.effectiveType}` : "وای‌فای";
    } else if (t.includes("cellular") || ["2g", "3g", "4g", "5g", "slow-2g"].includes(t)) {
      type = "Mobile data";
      detail = conn.effectiveType ? `داده موبایل · ${conn.effectiveType}` : "داده موبایل";
    } else if (t.includes("ethernet")) {
      type = "Ethernet";
      detail = "شبکه کابلی";
    }
    if (conn.downlink) detail += ` · ↓${conn.downlink}Mb/s`;
  }

  return { online, type, detail, carrier };
}

export function useNetwork() {
  const [net, setNet] = useState<NetworkInfo>(() => readNetwork());
  useEffect(() => {
    const upd = () => setNet(readNetwork());
    window.addEventListener("online", upd);
    window.addEventListener("offline", upd);
    const conn = (navigator as any)?.connection;
    conn?.addEventListener?.("change", upd);
    const i = setInterval(upd, 8000);
    return () => {
      window.removeEventListener("online", upd);
      window.removeEventListener("offline", upd);
      conn?.removeEventListener?.("change", upd);
      clearInterval(i);
    };
  }, []);
  return net;
}
