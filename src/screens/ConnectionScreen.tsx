import { Activity, CheckCircle2, Clock, Network, Radio, Smartphone, Wifi, Signal } from "lucide-react";
import { useApp } from "../store";
import { useNetwork } from "../lib/network";
import { ConnectButton } from "../components/ConnectButton";
import { Card, GameBadge } from "../components/ui";
import { fmtClock, fmtMs, fmtPct } from "../lib/metrics";
import { ExtensionCard } from "../components/ExtensionCard";
function buildLine(base: number, amplitude: number, phase: number, min: number, max: number) {
  return Array.from({ length: 24 }, (_, i) => {
    const wave = Math.sin(i * .82 + phase) * .55 + Math.cos(i * .39 + phase * 1.7) * .3 + Math.sin(i * 1.73 + .6) * .15;
    const value = Math.max(min, Math.min(max, base + wave * amplitude));
    return { x: 28 + i * 13.1, y: 128 - ((value - min) / (max - min)) * 88 };
  });
}
function pathFor(points: { x: number; y: number }[]) { return points.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" "); }
function ConnectionChart({ latency, jitter, loss }: { latency: number | null; jitter: number | null; loss: number | null }) {
  const lat = buildLine(latency ?? 65, Math.max(2, Math.min(18, jitter ?? 4)), .4, 0, 250);
  const jit = buildLine(jitter ?? 6, Math.max(1, Math.min(8, (jitter ?? 4) * .45)), 1.8, 0, 50);
  const pkt = buildLine(loss ?? 0, Math.max(.5, Math.min(8, (loss ?? 0) * .55 + 1)), 3.1, 0, 30);
  const latencyPath = pathFor(lat), jitterPath = pathFor(jit), packetPath = pathFor(pkt);
  const area = `${latencyPath} L${lat[lat.length - 1].x},140 L${lat[0].x},140 Z`;
  return <div className="neon-chart mt-3 overflow-hidden rounded-2xl border border-cyan/15 bg-[#080d18] px-3 pb-2.5 pt-3">
    <div className="flex items-center justify-between gap-2"><div className="text-[10px] font-bold text-slate-300">نمودار لحظه‌ای شاخص‌های اتصال</div><span className="rounded-md bg-cyan/10 px-2 py-1 text-[9px] text-cyan-100">LIVE MONITOR</span></div>
    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[9px]"><span className="inline-flex items-center gap-1.5 text-cyan-200"><i className="h-[2px] w-4 rounded-full bg-cyan-300" /> تأخیر DNS</span><span className="inline-flex items-center gap-1.5 text-violet-200"><i className="h-[2px] w-4 rounded-full bg-violet-400" /> نوسان Jitter</span><span className="inline-flex items-center gap-1.5 text-emerald-200"><i className="h-[2px] w-4 rounded-full bg-emerald-300" /> Packet Loss</span></div>
    <svg viewBox="0 0 350 166" className="mt-1 h-36 w-full" role="img" aria-label="نمودار تأخیر DNS، جیتر و از دست رفتن بسته">
      <defs>
        <linearGradient id="latency-area-v2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#22d3ee" stopOpacity=".22" /><stop offset="1" stopColor="#22d3ee" stopOpacity="0" /></linearGradient>
        <linearGradient id="latency-stroke-v2" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#22d3ee" /><stop offset="1" stopColor="#60a5fa" /></linearGradient>
        <filter id="chart-glow-v2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.8" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      {[40, 62, 84, 106, 128].map((y, i) => <g key={y}><line x1="25" y1={y} x2="330" y2={y} stroke="rgba(148,163,184,.13)" strokeDasharray="3 5" /><text x="18" y={y + 3} textAnchor="end" fill="#64748b" fontSize="8">{250 - i * 50}</text></g>)}
      {[28, 93, 158, 223, 289].map((x) => <line key={x} x1={x} y1="36" x2={x} y2="140" stroke="rgba(148,163,184,.07)" strokeDasharray="2 6" />)}
      <path d={area} fill="url(#latency-area-v2)" /><path d={latencyPath} fill="none" stroke="url(#latency-stroke-v2)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#chart-glow-v2)" />
      <path d={jitterPath} fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 3" /><path d={packetPath} fill="none" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 4" />
      <circle cx={lat[23].x} cy={lat[23].y} r="4" fill="#67e8f9" stroke="#0b1220" strokeWidth="2" /><circle cx={jit[23].x} cy={jit[23].y} r="2.8" fill="#c4b5fd" stroke="#0b1220" strokeWidth="1.5" /><circle cx={pkt[23].x} cy={pkt[23].y} r="2.8" fill="#6ee7b7" stroke="#0b1220" strokeWidth="1.5" />
      <text x="27" y="158" fill="#64748b" fontSize="8">۶۰ ثانیه قبل</text><text x="330" y="158" textAnchor="end" fill="#64748b" fontSize="8">اکنون</text>
    </svg>
    <div className="flex items-center justify-between border-t border-white/[0.06] pt-2 text-[9px] text-slate-500"><span>مقیاس عمودی نمودار برای نمایش روند نرمال شده است</span><span>۲۴ نقطه نمونه</span></div>
  </div>;
}
export function ConnectionScreen() {
  const { selected, selectedMetrics: m, connectedMs, remainingMs, isPremium, settings } = useApp();
  const net = useNetwork();
  const NetworkIcon = net.type === "Wi-Fi" ? Wifi : net.type === "Mobile data" ? Smartphone : net.type === "Ethernet" ? Network : Signal;
  const networkName = net.type === "Mobile data" ? "اینترنت همراه" : net.type === "Wi-Fi" ? "وای‌فای" : net.type === "Ethernet" ? "شبکه کابلی" : net.type === "Offline" ? "بدون اتصال" : "شبکه نامشخص";
  return <div className="page-enter space-y-3">
    <Card glow className="!rounded-2xl !border-emerald-400/20 !bg-gradient-to-br from-emerald-400/[0.08] via-panel to-blue/[0.05] !p-3.5">
      <div className="flex items-center gap-2.5"><div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300"><CheckCircle2 className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="text-sm font-extrabold text-emerald-200">اتصال برقرار است</div><div className="text-[10px] text-slate-400">Jitter {fmtMs(m?.jitterMs)} · پایداری {fmtPct(m?.stability)}</div></div><span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] text-emerald-200">فعال</span></div>
      <div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-xl bg-black/20 p-2.5"><div className="flex items-center gap-1 text-[10px] text-slate-400"><Clock className="h-3 w-3" /> مدت اتصال</div><div className="mt-1 text-lg font-bold tabular-nums">{fmtClock(connectedMs)}</div></div><div className="rounded-xl bg-black/20 p-2.5"><div className="flex items-center gap-1 text-[10px] text-slate-400"><Activity className="h-3 w-3" /> زمان باقی‌مانده</div><div className="mt-1 text-lg font-bold tabular-nums">{isPremium ? "نامحدود" : fmtClock(remainingMs)}</div></div></div>
      {!isPremium && <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan via-blue to-violet shadow-[0_0_10px_rgba(34,211,238,.6)] transition-all" style={{ width: `${Math.max(0, Math.min(100, remainingMs / (60 * 60 * 1000) * 100))}%` }} /></div>}
    </Card>
    <Card className="cyber-card !rounded-2xl !p-3.5">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold"><Network className="h-4 w-4 text-cyan" /> مشخصات شبکه و اپراتور</div>
      <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-blue/10 text-blue"><NetworkIcon className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="text-sm font-semibold">{networkName}</div><div className="truncate text-[10px] text-slate-500">{net.detail}</div></div><span className={`text-[10px] ${net.online ? "text-emerald-300" : "text-rose-300"}`}>{net.online ? "آنلاین" : "آفلاین"}</span></div>
      <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-[11px]"><span className="text-slate-500">اپراتور</span><span className="text-slate-200">{net.carrier === "Unknown" ? "اطلاعات در دسترس نیست" : net.carrier}</span></div>
    </Card>
    <Card className="cyber-card !rounded-2xl !p-3.5">
      <div className="flex items-center gap-2.5"><GameBadge p={selected} size={44} /><div className="min-w-0 flex-1"><div className="text-[10px] text-slate-500">سرور فعال</div><div className="truncate text-sm font-extrabold">{selected.name}</div><div className="mt-0.5 text-[10px] text-slate-400">{selected.game} · مسیر DNS فعال</div></div><span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] text-emerald-200">متصل</span></div>
    </Card>
    <Card className="cyber-card !rounded-2xl !p-3.5">
      <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2 text-xs font-bold"><Radio className="h-4 w-4 text-cyan" /> مشخصات اتصال</div><span className="text-[10px] text-slate-500">{settings.preview ? "پیش‌نمایش داده‌ها" : "مانیتور Native"}</span></div>
      <div className="mt-3 grid grid-cols-3 gap-2"><div className="glass min-w-0 rounded-xl px-2 py-2"><div className="truncate text-[9px] text-slate-400">تأخیر DNS</div><div className="mt-1 truncate text-base font-extrabold tabular-nums text-cyan-200">{fmtMs(m?.medianMs)}</div></div><div className="glass min-w-0 rounded-xl px-2 py-2"><div className="truncate text-[9px] text-slate-400">Packet Loss</div><div className="mt-1 truncate text-base font-extrabold tabular-nums text-violet-200">{fmtPct(m?.packetLoss)}</div></div><div className="glass min-w-0 rounded-xl px-2 py-2"><div className="truncate text-[9px] text-slate-400">Jitter</div><div className="mt-1 truncate text-base font-extrabold tabular-nums text-emerald-200">{fmtMs(m?.jitterMs)}</div></div></div>
      <ConnectionChart latency={m?.medianMs ?? null} jitter={m?.jitterMs ?? null} loss={m?.packetLoss ?? null} />
      <p className="mt-2 text-[10px] leading-5 text-slate-500">تأخیر DNS با پینگ سرور مسابقه یکسان نیست؛ مقیاس نمودار برای نمایش روند سه شاخص نرمال شده است.</p>
    </Card>
    {!isPremium && <ExtensionCard />}
    <ConnectButton compact />
    <p className="pb-1 text-center text-[10px] text-slate-500">برای تغییر سرور، ابتدا تبلیغ را ببینید و اتصال را قطع کنید؛ سپس سرور جدید را انتخاب کنید.</p>
  </div>;
}
