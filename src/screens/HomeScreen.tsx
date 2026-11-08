import { AlertTriangle, RefreshCw, Smartphone, Signal, Wifi, Zap, Activity } from "lucide-react";
import { useApp } from "../store";
import { useNetwork } from "../lib/network";
import { ConnectButton } from "../components/ConnectButton";
import { Btn, Card, GameBadge } from "../components/ui";
import { ExtensionCard } from "../components/ExtensionCard";
import { fmtMs, fmtPct } from "../lib/metrics";
export function HomeScreen() {
  const { selected, selectedMetrics: m, error, retryConnect, pendingReward, op, dismissError, isPremium, connect } = useApp();
  const net = useNetwork();
  const NetIcon = net.type === "Mobile data" ? Smartphone : net.type === "Wi-Fi" ? Wifi : Signal;
  const networkName = net.type === "Mobile data" ? "اینترنت همراه" : net.type === "Wi-Fi" ? "وای‌فای" : net.type === "Ethernet" ? "شبکه کابلی" : net.type === "Offline" ? "بدون اتصال" : "شبکه نامشخص";
  return <div className="space-y-3 page-enter">
    <Card className="cyber-card !rounded-[1.35rem] !border-blue/20 !bg-[linear-gradient(120deg,rgba(79,124,255,.12),rgba(34,211,238,.06),rgba(139,92,246,.11))] !p-3">
      <div className="flex items-center gap-2.5"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-blue/20 bg-blue/15 text-blue"><NetIcon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="text-xs font-extrabold">{networkName}</div><div className="truncate text-[10px] text-slate-500">{net.detail} · اپراتور: {net.carrier === "Unknown" ? "در دسترس نیست" : net.carrier}</div></div><span className={`flex shrink-0 items-center gap-1 text-[10px] ${net.online ? "text-emerald-300" : "text-rose-300"}`}><span className={`h-1.5 w-1.5 rounded-full ${net.online ? "bg-emerald-400" : "bg-rose-400"}`} />{net.online ? "آنلاین" : "آفلاین"}</span><button type="button" onClick={() => void net.refresh()} disabled={net.checking} aria-label="تشخیص دوباره شبکه" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-black/20 text-cyan disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${net.checking ? "animate-spin" : ""}`} /></button></div>
    </Card>
    <div className="-my-1"><ConnectButton /></div>
    {error && <div className="shake rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3 text-xs text-rose-100"><div className="flex gap-2"><AlertTriangle className="h-4 w-4 shrink-0" /><span>{error}</span></div><div className="mt-2 flex gap-2">{pendingReward && !op && <Btn className="!py-2 !text-xs" onClick={retryConnect}>تلاش دوباره بدون تبلیغ</Btn>}<Btn variant="ghost" className="!py-2 !text-xs" onClick={dismissError}>بستن</Btn></div></div>}
    <button type="button" onClick={() => void connect()} disabled={!!op} aria-label="نمایش تبلیغ و اتصال به سرور انتخاب‌شده" className="cyber-card group w-full rounded-[1.35rem] border border-white/[0.08] bg-[linear-gradient(120deg,#171d2d,#101522_65%,#1b1530)] p-3 text-right transition hover:border-cyan/40 active:scale-[.99] disabled:opacity-60">
      <div className="flex items-center gap-2.5"><GameBadge p={selected} size={46} /><div className="min-w-0 flex-1"><div className="text-[10px] text-slate-500">سرور پیشنهادی فعلی · لمس کارت برای اتصال</div><div className="truncate text-sm font-extrabold text-white group-hover:text-cyan-100">{selected.name}</div><div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]"><span className="inline-flex items-center gap-1 text-cyan-100"><Activity className="h-3 w-3" /> Jitter {fmtMs(m?.jitterMs)}</span><span className="inline-flex items-center gap-1 text-emerald-200"><Zap className="h-3 w-3" /> پایداری {fmtPct(m?.stability)}</span></div></div><span className="rounded-xl border border-violet/25 bg-violet/10 px-2.5 py-2 text-[10px] font-bold text-violet-100">اتصال سریع</span></div>
    </button>
    {!isPremium && <ExtensionCard />}
  </div>;
}
