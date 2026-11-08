import { useApp } from "../store";
import { CATALOG } from "../data/catalog";
import { availability } from "../lib/probe";
import { ServerCard } from "../components/ServerCard";
import { ScannerScreen } from "./ScannerScreen";
import { RadioTower } from "lucide-react";
export function ServersScreen() {
  const { metrics, selectedId, selectServer, settings, op } = useApp();
  return <div className="page-enter space-y-3">
    <div className="flex items-end justify-between gap-3"><div><div className="flex items-center gap-2"><RadioTower className="h-4 w-4 text-cyan" /><h2 className="text-lg font-extrabold">سرورهای بازی</h2></div><p className="mt-0.5 text-[10px] text-slate-500">برای نمایش تبلیغ و اتصال، هر جای کارت سرور را لمس کنید.</p></div><span className="rounded-full border border-cyan/20 bg-cyan/[0.06] px-2.5 py-1 text-[9px] tabular-nums text-cyan-100">{CATALOG.length} پروفایل</span></div>
    <ScannerScreen />
    <div className="flex items-center justify-between px-1 pt-1"><span className="text-[11px] font-bold text-slate-300">فهرست سرورها</span><span className="text-[9px] text-slate-500">Jitter · پایداری</span></div>
    <div className="space-y-2.5 pb-2">{CATALOG.map((p, i) => <ServerCard key={p.id} p={p} m={metrics[p.id]} avail={availability(p, settings.preview)} selected={p.id === selectedId} busy={!!op} delay={i} onSelect={() => void selectServer(p.id)} />)}</div>
  </div>;
}
