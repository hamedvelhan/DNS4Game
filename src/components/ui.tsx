import { ReactNode, useState } from "react";
import { Quality, QUALITY_STYLE } from "../lib/metrics";
import { DnsProfile } from "../data/catalog";
export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");
export function Logo({ size = 34 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-label="DNS Game Art"><defs><linearGradient id="lg" x1="4" y1="4" x2="44" y2="44"><stop stopColor="#22d3ee" /><stop offset="0.55" stopColor="#4f7cff" /><stop offset="1" stopColor="#8b5cf6" /></linearGradient></defs><path d="M24 3 42 13.5v21L24 45 6 34.5v-21L24 3Z" stroke="url(#lg)" strokeWidth="2.5" fill="rgba(79,124,255,0.10)" /><path d="M16 15h8.5c5.5 0 9 3.2 9 9s-3.5 9-9 9H16V15Z" stroke="url(#lg)" strokeWidth="3" strokeLinejoin="round" /><circle cx="24" cy="24" r="3" fill="url(#lg)" /></svg>;
}
const GAME_MARKS: Record<string, string> = {
  cod: "callofduty", pubg: "pubg", ff: "garena", fn: "epicgames", bs: "brawlstars", coc: "clashofclans",
  cr: "clashroyale", ml: "mobilelegendsbangbang", gi: "genshinimpact", mc: "minecraft", rb: "roblox",
  ef: "konami", val: "valorant", apx: "apexlegends",
};
export function GameBadge({ p, size = 44 }: { p: DnsProfile; size?: number }) {
  const [failedLogoFor, setFailedLogoFor] = useState<string | null>(null);
  const letters = p.game.split(/[\s:]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase(), slug = GAME_MARKS[p.id];
  return <div className="relative grid shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-[#111827] text-white/90" style={{ width: size, height: size, boxShadow: `inset 0 1px 0 rgba(255,255,255,.18), 0 4px 14px hsl(${p.hue} 70% 30% / .24)` }}>
    {slug && failedLogoFor !== p.id ? <img src={`https://cdn.simpleicons.org/${slug}/FFFFFF`} alt={`${p.game} logo`} loading="lazy" className="h-full w-full object-contain p-[20%]" onError={() => setFailedLogoFor(p.id)} /> : <span className="font-bold tracking-wide" style={{ fontSize: size * .30, color: `hsl(${p.hue} 75% 78%)` }}>{letters}</span>}
  </div>;
}
export function QualityPill({ q }: { q: Quality }) {
  const s = QUALITY_STYLE[q];
  return <span className={cx("inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium", s.text)}><SignalBars q={q} />{s.label}</span>;
}
export function SignalBars({ q }: { q: Quality }) {
  const s = QUALITY_STYLE[q];
  return <span className="flex items-end gap-[2px] h-3" aria-hidden>{[0, 1, 2, 3].map((i) => <span key={i} className={cx("w-[3px] rounded-sm", i < s.bars ? s.bg : "bg-white/15")} style={{ height: 4 + i * 2.5 }} />)}</span>;
}
export function Stat({ label, value, sub, accent }: { label: string; value: ReactNode; sub?: string; accent?: string }) {
  return <div className="glass rounded-2xl px-3 py-3 min-w-0"><div className="text-[10px] uppercase tracking-wider text-slate-400 truncate">{label}</div><div className={cx("mt-1 text-xl font-semibold tabular-nums", accent)}>{value}</div>{sub && <div className="text-[10px] text-slate-500 mt-0.5 truncate">{sub}</div>}</div>;
}
export function Card({ children, className, glow }: { children: ReactNode; className?: string; glow?: boolean }) {
  return <div className={cx("glass rounded-3xl p-4 relative overflow-hidden", glow && "shadow-[0_0_40px_-12px_rgba(79,124,255,0.55)]", className)}>{children}</div>;
}
export function Btn({ children, onClick, variant = "primary", disabled, className, type = "button" }: { children: ReactNode; onClick?: () => void; variant?: "primary" | "ghost" | "danger" | "soft"; disabled?: boolean; className?: string; type?: "button" | "submit" }) {
  const v = {
    primary: "bg-gradient-to-r from-cyan to-violet text-white shadow-[0_6px_24px_-8px_rgba(79,124,255,0.9)]",
    ghost: "border border-line text-slate-200 hover:bg-white/5",
    soft: "bg-white/6 text-slate-100 hover:bg-white/10 border border-white/5",
    danger: "bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-[0_6px_24px_-8px_rgba(244,63,94,0.8)]",
  }[variant];
  return <button type={type} onClick={onClick} disabled={disabled} className={cx("rounded-2xl px-4 py-3 text-sm font-semibold transition active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100 flex items-center justify-center gap-2", v, className)}>{children}</button>;
}
export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={cx("relative h-7 w-12 shrink-0 rounded-full transition-colors", on ? "bg-gradient-to-r from-cyan to-blue" : "bg-white/12")}><span className={cx("absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all", on ? "left-6" : "left-1")} /></button>;
}
export function PingViz({ q, bars = 14 }: { q: Quality; bars?: number }) {
  const s = QUALITY_STYLE[q];
  return <div className="flex items-end gap-[3px] h-10" aria-hidden>{Array.from({ length: bars }).map((_, i) => <span key={i} className={cx("deco eq-bar w-[5px] h-full rounded-sm opacity-80", s.bg)} style={{ animationDelay: `${(i * 97) % 900}ms`, animationDuration: `${700 + ((i * 131) % 600)}ms` }} />)}</div>;
}
