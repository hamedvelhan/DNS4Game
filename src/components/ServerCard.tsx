import { Activity, Check, LockKeyhole, Route, UserCheck, Zap } from "lucide-react";
import { DnsProfile } from "../data/catalog";
import { fmtMs, fmtPct, ServerMetrics } from "../lib/metrics";
import { Availability } from "../lib/probe";
import { cx, GameBadge } from "./ui";
interface Props { p: DnsProfile; m?: ServerMetrics | null; avail: Availability; selected: boolean; busy?: boolean; onSelect: () => void; delay?: number }
export function ServerCard({ p, m, avail, selected, busy, onSelect, delay = 0 }: Props) {
  const unavailable = avail !== "preview", jitter = m?.jitterMs, stability = m?.stability, disabled = unavailable || !!busy;
  return <button type="button" onClick={onSelect} disabled={disabled} aria-label={`نمایش تبلیغ و اتصال به ${p.name}`}
    className={cx("cyber-card page-enter group relative block w-full overflow-hidden rounded-[1.35rem] border px-3 py-3 text-right transition-all duration-300 active:scale-[.985] disabled:cursor-not-allowed",
      selected ? "border-cyan/60 bg-[linear-gradient(125deg,rgba(34,211,238,.13),rgba(99,102,241,.12),rgba(168,85,247,.08))] shadow-[0_0_26px_-12px_rgba(34,211,238,.75)]" : "border-white/[0.08] bg-[linear-gradient(125deg,#171d2d,#111522_58%,#171326)] hover:border-violet/40",
      unavailable && "opacity-55")} style={{ animationDelay: `${Math.min(delay, 8) * 28}ms` }}>
    <span className="pointer-events-none absolute inset-y-3 right-0 w-[3px] rounded-full bg-gradient-to-b from-cyan via-blue to-violet opacity-80" />
    <div className="flex items-center gap-3"><div className="relative"><GameBadge p={p} size={48} />{selected && <span className="absolute -bottom-1 -left-1 grid h-4 w-4 place-items-center rounded-full border border-ink bg-cyan text-ink"><Check className="h-3 w-3" /></span>}</div>
      <div className="min-w-0 flex-1"><div className="truncate text-[13px] font-extrabold text-white group-hover:text-cyan-100">{p.name}</div><div className="mt-0.5 truncate text-[9px] text-slate-500" dir="ltr">{p.game}</div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-slate-400"><span className="inline-flex items-center gap-1"><Route className="h-3 w-3 text-cyan" /> مسیریابی هوشمند</span><span className="inline-flex items-center gap-1"><UserCheck className="h-3 w-3 text-violet-300" /> ورود و رجیستر</span></div></div>
      <div className="flex min-w-[68px] flex-col items-end gap-1"><span className="inline-flex items-center gap-1 rounded-lg border border-cyan/20 bg-cyan/[0.08] px-2 py-1 text-[10px] font-bold tabular-nums text-cyan-100"><Activity className="h-3 w-3" /> {fmtMs(jitter)}</span><span className="text-[9px] text-slate-500">Jitter</span></div>
    </div>
    <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-2.5"><div className="flex min-w-0 flex-1 items-center gap-2"><span className="inline-flex items-center gap-1 whitespace-nowrap text-[10px] text-slate-400"><Zap className="h-3 w-3 text-emerald-300" /> پایداری</span><div className="h-1.5 min-w-8 flex-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-l from-emerald-300 via-cyan to-blue" style={{ width: `${stability ?? 0}%` }} /></div><span className="text-[10px] font-bold tabular-nums text-emerald-200">{fmtPct(stability)}</span></div>
      <span className={cx("rounded-lg px-3 py-1.5 text-[10px] font-extrabold transition", selected ? "border border-cyan/25 bg-cyan/10 text-cyan" : "bg-gradient-to-l from-blue to-violet text-white shadow-[0_0_18px_-7px_rgba(139,92,246,.85)]")}>{unavailable ? "تنظیم‌نشده" : busy ? "در حال اتصال…" : selected ? "اتصال به این سرور" : "تبلیغ و اتصال"}</span></div>
    {unavailable && <div className="mt-2 flex items-center gap-1 text-[9px] text-amber-200/80"><LockKeyhole className="h-3 w-3" /> تنظیم DNS واقعی در نسخه Native لازم است.</div>}
  </button>;
}
