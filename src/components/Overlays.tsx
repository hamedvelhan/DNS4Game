import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CheckCircle2, Info, ShieldAlert, X, Play, Gift } from "lucide-react";
import { adOverlayStore, AdManager } from "../ads/adManager";
import { useApp } from "../store";
import { cx } from "./ui";
const TITLES = {
  connect: "برای اتصال، ویدیو را کامل تماشا کنید", switch: "برای تغییر سرور، ویدیو را کامل تماشا کنید",
  extend: "برای افزایش زمان، ویدیو را کامل تماشا کنید", disconnect: "تبلیغ پیش از قطع اتصال",
} as const;
const PREVIEW_AD_SECONDS = 6;
export function AdOverlay() {
  const req = useSyncExternalStore(adOverlayStore.subscribe, adOverlayStore.get);
  const { active } = useApp();
  const [left, setLeft] = useState(PREVIEW_AD_SECONDS);
  const doneRef = useRef(false);
  useEffect(() => { if (!req) return; doneRef.current = false; setLeft(PREVIEW_AD_SECONDS); }, [req?.rewardId]);
  useEffect(() => {
    if (!req || !active) return;
    const timer = window.setInterval(() => setLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [req?.rewardId, active]);
  useEffect(() => {
    if (!req || !active || left !== 0 || doneRef.current) return;
    doneRef.current = true;
    const timer = window.setTimeout(() => req.finish({ status: "rewarded", rewardId: req.rewardId }), 450);
    return () => window.clearTimeout(timer);
  }, [req, left, active]);
  if (!req) return null;
  const cancel = () => { if (doneRef.current) return; doneRef.current = true; req.finish({ status: "cancelled" }); };
  const ready = left === 0, pct = ((PREVIEW_AD_SECONDS - left) / PREVIEW_AD_SECONDS) * 100;
  return <div className="absolute inset-0 z-50 flex flex-col bg-black/90 page-enter backdrop-blur-sm">
    <div className="flex items-center justify-between p-4"><span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold">{req.placement === "disconnect" ? "تبلیغ بین‌صفحه‌ای" : "تبلیغ جایزه‌ای"}</span>
      <button onClick={cancel} className="rounded-full bg-white/10 p-2 hover:bg-white/20" aria-label="بستن تبلیغ بدون دریافت پاداش"><X className="h-4 w-4" /></button></div>
    <div className="grid flex-1 place-items-center px-6"><div className="w-full max-w-xs text-center">
      <div className="relative mx-auto mb-5 grid h-28 w-28 place-items-center overflow-hidden rounded-3xl border border-dashed border-white/20 bg-white/5">{!ready ? <Play className="h-10 w-10 text-white/60" /> : <Gift className="pop h-10 w-10 text-cyan" />}<div className="deco sweep absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/10 to-transparent" /></div>
      <h3 className="text-lg font-semibold">{TITLES[req.placement]}</h3><p className="mt-2 text-xs leading-relaxed text-slate-400">این فقط پیش‌نمایش جریان تبلیغ در نسخه وب است و ویدیوی واقعی پخش نمی‌کند.{AdManager.isConfigured() ? " اتصال SDK واقعی تبلیغات باید در نسخه اندروید انجام شود." : " ارائه‌دهنده و شناسه تبلیغ هنوز تنظیم نشده‌اند."}</p>
      <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-gradient-to-r from-cyan to-violet transition-all duration-1000 ease-linear" style={{ width: `${pct}%` }} /></div>
      <div className="mt-2 text-xs tabular-nums text-slate-400">{ready ? "ویدیو تمام شد؛ عملیات به‌صورت خودکار آغاز می‌شود…" : `${left} ثانیه تا پایان پیش‌نمایش`}</div>
      <p className="mt-5 text-[10px] text-slate-500">{req.placement === "disconnect" ? "پس از بسته‌شدن تبلیغ، اتصال به‌صورت خودکار قطع می‌شود." : "پس از تأیید پاداش، نیازی به زدن دکمه دریافت جایزه نیست."}</p>
      <button onClick={cancel} className="mt-4 text-xs text-slate-400 underline underline-offset-4">{req.placement === "disconnect" ? "بستن تبلیغ و ادامه قطع اتصال" : "انصراف و بستن تبلیغ"}</button>
    </div></div>
  </div>;
}
export function PermissionDialog() {
  const { permissionPending, answerPermission } = useApp();
  if (!permissionPending) return null;
  return <div className="absolute inset-0 z-50 grid place-items-center bg-black/70 px-8 page-enter"><div className="w-full rounded-3xl bg-[#23262f] p-6 shadow-2xl">
    <div className="mb-1 text-[10px] text-amber-300/80">پیش‌نمایش پنجره مجوز اندروید</div><ShieldAlert className="h-7 w-7 text-cyan" /><h3 className="mt-3 text-lg font-semibold">درخواست اتصال VPN</h3>
    <p className="mt-2 text-sm leading-6 text-slate-300">DNS Game Art برای ایجاد اتصال VPN درخواست مجوز دارد. این پنجره فقط ظاهر مجوز سیستمی اندروید را در پیش‌نمایش وب نشان می‌دهد.</p>
    <div className="mt-6 flex justify-end gap-2"><button className="px-4 py-2 text-sm text-cyan" onClick={() => answerPermission(false)}>لغو</button><button className="px-4 py-2 text-sm font-semibold text-cyan" onClick={() => answerPermission(true)}>تأیید</button></div>
  </div></div>;
}
export function Toasts() {
  const { toasts } = useApp();
  return <div className="pointer-events-none absolute left-0 right-0 top-3 z-[60] flex flex-col items-center gap-2 px-4">{toasts.map((t) => <div key={t.id} className={cx("pop pointer-events-auto flex max-w-full items-start gap-2 rounded-2xl border px-3 py-2 text-xs shadow-xl backdrop-blur",
    t.kind === "success" && "border-emerald-400/30 bg-emerald-950/80 text-emerald-100",
    t.kind === "error" && "border-rose-400/30 bg-rose-950/80 text-rose-100",
    t.kind === "info" && "border-blue/30 bg-slate-900/90 text-slate-100")}>
    {t.kind === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : t.kind === "error" ? <ShieldAlert className="h-4 w-4 shrink-0" /> : <Info className="h-4 w-4 shrink-0" />}<span>{t.text}</span></div>)}</div>;
}
