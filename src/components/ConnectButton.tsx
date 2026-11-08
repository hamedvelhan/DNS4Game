import { Power, PowerOff, Loader2 } from "lucide-react";
import { useApp } from "../store";
import { cx } from "./ui";
import { fmtClock } from "../lib/metrics";
const BUSY: Record<string, string> = {
  "ad-connect": "در حال نمایش تبلیغ اتصال…", "ad-disconnect": "در حال نمایش تبلیغ قطع اتصال…",
  permission: "در انتظار مجوز VPN…", connecting: "در حال راه‌اندازی اتصال…", verifying: "در حال بررسی DNS…",
  "ad-switch": "در حال آماده‌سازی تبلیغ…", "switch-verify": "در حال بررسی سرور جدید…", "ad-extend": "در حال نمایش ویدیوی جایزه‌ای…",
};
export function ConnectButton({ compact = false }: { compact?: boolean }) {
  const { connected, op, connect, disconnect, remainingMs, isPremium } = useApp();
  const busy = !!op, state = busy ? "busy" : connected ? "on" : "off";
  const toggle = () => connected ? void disconnect("اتصال قطع شد.") : void connect();
  if (compact) return <button onClick={toggle} disabled={busy}
    className={cx("flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition active:scale-[.98] disabled:opacity-50",
      connected ? "border border-rose-400/25 bg-rose-500/10 text-rose-200" : "bg-gradient-to-l from-cyan to-violet text-white")}
    aria-label={connected ? "قطع اتصال" : "اتصال"}>
    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : connected ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
    {busy ? (BUSY[op!] ?? "در حال انجام عملیات…") : connected ? "قطع اتصال" : "اتصال"}
  </button>;
  const ring = state === "on" ? "from-emerald-400 via-cyan to-blue" : state === "busy" ? "from-cyan via-blue to-violet" : "from-blue via-violet to-fuchsia-500";
  return <div className="relative grid h-[212px] place-items-center">
    <div className={cx("absolute h-44 w-44 rounded-full blur-3xl transition-colors duration-700", state === "on" ? "bg-emerald-400/20" : state === "busy" ? "bg-cyan/20" : "bg-violet/20")} />
    {state === "on" && <><span className="deco pulse-ring absolute h-40 w-40 rounded-full border border-emerald-300/50" /><span className="deco pulse-ring absolute h-40 w-40 rounded-full border border-cyan/40" style={{ animationDelay: "1.2s" }} /></>}
    <div className={cx("absolute h-[174px] w-[174px] rounded-full bg-gradient-to-tr opacity-90 transition-all duration-700", ring, state === "busy" && "deco spin-slow")} style={{ maskImage: "radial-gradient(circle, transparent 66%, #000 67%)", WebkitMaskImage: "radial-gradient(circle, transparent 66%, #000 67%)" }} />
    <button onClick={toggle} disabled={busy} aria-label={state === "on" ? "قطع اتصال" : "اتصال"}
      className={cx("relative grid h-[144px] w-[144px] place-items-center rounded-full border border-white/10 bg-[radial-gradient(circle_at_30%_25%,#262c47,#0f1220_70%)] transition-all duration-500 active:scale-95 disabled:cursor-wait",
        state === "on" ? "shadow-[0_0_45px_-5px_rgba(52,211,153,0.5),inset_0_0_30px_rgba(52,211,153,0.12)]" : "shadow-[0_0_45px_-8px_rgba(139,92,246,0.6),inset_0_0_30px_rgba(79,124,255,0.12)]")}>
      <div className="flex flex-col items-center gap-1.5">
        {state === "busy" ? <Loader2 className="h-8 w-8 animate-spin text-cyan" /> : state === "on" ? <PowerOff className="h-8 w-8 text-rose-300" /> : <Power className="h-8 w-8 text-violet-300" />}
        {state === "off" && <span className="text-xl font-bold">اتصال</span>}
        {state === "busy" && <span className="px-3 text-center text-[10px] leading-tight text-slate-300">{BUSY[op!] ?? "در حال انجام…"}</span>}
        {state === "on" && <><span className="text-sm font-semibold text-rose-200">قطع اتصال</span><span className="text-[10px] tabular-nums text-slate-300">{isPremium ? "زمان نامحدود" : `${fmtClock(remainingMs)} باقی‌مانده`}</span></>}
      </div>
    </button>
  </div>;
}
