import { useCallback, useEffect, useState } from "react";
import { getNativeBridge } from "./nativeBridge";
export interface NetInfo {
  online: boolean;
  type: "Wi-Fi" | "Mobile data" | "Ethernet" | "Unknown" | "Offline";
  detail: string; carrier: string; ipv4: "Available" | "Unknown";
}
interface NavConn extends EventTarget { type?: string; effectiveType?: string; downlink?: number }
function readBrowser(): NetInfo {
  const online = navigator.onLine, c = (navigator as unknown as { connection?: NavConn }).connection;
  let type: NetInfo["type"] = online ? "Unknown" : "Offline";
  if (online && c?.type) {
    if (c.type === "wifi") type = "Wi-Fi";
    else if (c.type === "cellular") type = "Mobile data";
    else if (c.type === "ethernet") type = "Ethernet";
  }
  const detail = !online ? "دستگاه در حالت آفلاین است" : c?.effectiveType
    ? `کیفیت شبکه ${c.effectiveType.toUpperCase()}${c.downlink ? ` · حدود ${c.downlink} مگابیت` : ""}`
    : type === "Unknown" ? "اینترنت برقرار است؛ نوع شبکه در مرورگر قابل تشخیص نیست" : "شبکه متصل است";
  return { online, type, detail, carrier: "Unknown", ipv4: "Unknown" };
}
async function detect(): Promise<NetInfo> {
  const fallback = readBrowser(), native = getNativeBridge();
  if (native?.getNetworkInfo) {
    try {
      const info = await native.getNetworkInfo();
      return { online: info.online, type: info.type, detail: info.detail ?? (info.online ? "شبکه دستگاه شناسایی شد" : "دستگاه آفلاین است"), carrier: info.carrier ?? "Unknown", ipv4: info.ipv4 ?? "Unknown" };
    } catch { /* browser fallback */ }
  }
  if (!fallback.online) return fallback;
  const controller = new AbortController(), timeout = window.setTimeout(() => controller.abort(), 4500), started = performance.now();
  try {
    await fetch("https://www.gstatic.com/generate_204", { method: "GET", mode: "no-cors", cache: "no-store", signal: controller.signal });
    const elapsed = Math.round(performance.now() - started);
    return { ...fallback, online: true, detail: `${fallback.detail} · دسترسی اینترنت تأیید شد (${elapsed} ms)` };
  } catch {
    return { ...fallback, online: navigator.onLine, detail: navigator.onLine ? "شبکه محلی متصل است؛ دسترسی اینترنت تأیید نشد" : "دسترسی به شبکه وجود ندارد" };
  } finally { window.clearTimeout(timeout); }
}
export function useNetwork() {
  const [info, setInfo] = useState<NetInfo>(readBrowser), [checking, setChecking] = useState(false);
  const refresh = useCallback(async () => { setChecking(true); try { setInfo(await detect()); } finally { setChecking(false); } }, []);
  useEffect(() => {
    void refresh();
    const upd = () => { void refresh(); }, c = (navigator as unknown as { connection?: NavConn }).connection;
    window.addEventListener("online", upd); window.addEventListener("offline", upd); window.addEventListener("focus", upd); c?.addEventListener?.("change", upd);
    return () => { window.removeEventListener("online", upd); window.removeEventListener("offline", upd); window.removeEventListener("focus", upd); c?.removeEventListener?.("change", upd); };
  }, [refresh]);
  return { ...info, checking, refresh };
}
