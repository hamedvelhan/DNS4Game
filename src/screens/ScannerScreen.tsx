import { useMemo } from "react";
import { CheckCircle2, Radar, Square, Zap, Activity } from "lucide-react";
import { useApp } from "../store";
import { CATALOG } from "../data/catalog";
import { Btn, Card } from "../components/ui";
import { fmtMs, fmtPct } from "../lib/metrics";
export function ScannerScreen() {
  const { scan, startScan, cancelScan, metrics, selectServer, settings, op } = useApp();
  const total = CATALOG.length, cur = CATALOG[Math.min(scan.serverIndex, total - 1)];
  const pct = scan.running ? ((scan.serverIndex + scan.sample / 10) / total) * 100 : scan.done ? 100 : 0;
  const ranking = useMemo(() => CATALOG.filter((c) => metrics[c.id] && isFinite(metrics[c.id].score)).sort((a, b) => metrics[a.id].score - metrics[b.id].score), [metrics]);
  const best = scan.recommended ? CATALOG.find((c) => c.id === scan.recommended) : undefined, bestMetrics = best ? metrics[best.id] : null;
  return <Card glow className="cyber-card !rounded-[1.35rem] !border-cyan/20 !bg-[linear-gradient(135deg,rgba(34,211,238,.08),rgba(79,124,255,.06),rgba(139,92,246,.09))] !p-3.5">
    <div className="flex items-center gap-2.5"><div className="grid h-9 w-9 place-items-center rounded-xl border border-cyan/20 bg-cyan/10 text-cyan"><Radar className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="text-sm font-extrabold">اسکن هوشمند سرورها</div><div className="text-[10px] text-slate-500">مقایسه Jitter و پایداری برای پیشنهاد بهترین سرور</div></div>{!scan.running && <Btn className="!px-3 !py-2 !text-[10px]" onClick={() => void startScan()} disabled={!!op}><Radar className="h-3.5 w-3.5" /> شروع اسکن</Btn>}{scan.running && <Btn variant="ghost" className="!px-2.5 !py-2 !text-[10px]" onClick={cancelScan}><Square className="h-3 w-3" /> توقف</Btn>}</div>
    {(scan.running || scan.done) && <div className="mt-3"><div className="mb-1.5 flex items-center justify-between text-[10px]"><span className="text-slate-400">{scan.running ? `در حال آزمایش: ${cur?.name ?? "سرور"}` : "اسکن تکمیل شد"}</span><span className="tabular-nums text-cyan">{Math.round(pct)}٪</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="neon-progress h-full rounded-full bg-gradient-to-r from-cyan via-blue to-violet transition-all duration-300" style={{ width: `${pct}%` }} /></div></div>}
    {best && bestMetrics && !scan.running && <button type="button" onClick={() => void selectServer(best.id)} disabled={!!op} className="mt-3 flex w-full items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-400/[0.07] p-2.5 text-right transition hover:bg-emerald-400/[0.12] disabled:opacity-50"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" /><div className="min-w-0 flex-1"><div className="text-[10px] text-slate-500">پیشنهاد برتر · لمس برای تبلیغ و اتصال</div><div className="truncate text-xs font-bold">{best.name}</div></div><div className="flex flex-col items-end gap-1 text-[9px]"><span className="text-cyan-100"><Activity className="ml-1 inline h-3 w-3" />{fmtMs(bestMetrics.jitterMs)}</span><span className="text-emerald-200"><Zap className="ml-1 inline h-3 w-3" />{fmtPct(bestMetrics.stability)}</span></div></button>}
    {!settings.preview && <p className="mt-2 text-[10px] leading-5 text-amber-200/80">برای اسکن واقعی، موتور تشخیص DNS در نسخه Native و آدرس‌های معتبر باید تنظیم شوند.</p>}
    {settings.preview && !scan.running && !scan.done && <p className="mt-2 text-[9px] text-slate-600">نتایج مرورگر در حالت پیش‌نمایش شبیه‌سازی می‌شوند و اندازه‌گیری واقعی شبکه نیستند.</p>}
    {ranking.length > 0 && scan.done && <div className="mt-2 flex flex-wrap gap-1.5">{ranking.slice(0, 3).map((profile) => <span key={profile.id} className="rounded-lg border border-white/5 bg-white/[0.04] px-2 py-1 text-[9px] text-slate-400">{profile.name}</span>)}</div>}
  </Card>;
}
