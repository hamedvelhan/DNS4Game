import { PlusCircle, Video } from "lucide-react";
import { EXTENSION_VIDEOS, useApp } from "../store";
import { Btn, Card, cx } from "./ui";
export function ExtensionCard() {
  const { extCount, extend, op, connected, bonusMs, isPremium } = useApp();
  if (isPremium) return null;
  return <Card className="!rounded-2xl !p-3"><div className="flex items-center gap-2.5">
    <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet/15 text-violet-300"><PlusCircle className="h-4 w-4" /></div>
    <div className="min-w-0 flex-1"><div className="text-right text-sm font-bold">افزایش زمان اتصال</div><div className="text-[10px] text-slate-400">با تکمیل دو ویدیوی جایزه‌ای، ۶۰ دقیقه زمان اضافه بگیرید.</div></div>
    <div className="text-sm font-semibold tabular-nums text-cyan">{extCount}/{EXTENSION_VIDEOS}</div></div>
    <div className="mt-3 flex gap-2" dir="ltr">{Array.from({ length: EXTENSION_VIDEOS }).map((_, i) => <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"><div className={cx("h-full bg-gradient-to-r from-cyan to-violet transition-all duration-500", i < extCount ? "w-full" : "w-0")} /></div>)}</div>
    <Btn variant="soft" className="mt-3 w-full" disabled={!!op} onClick={extend}><Video className="h-4 w-4" /> تماشای ویدیوی {Math.min(extCount + 1, EXTENSION_VIDEOS)} از {EXTENSION_VIDEOS}</Btn>
    <p className="mt-2 text-[10px] leading-5 text-slate-500">{connected ? "در زمان پخش ویدیو، اتصال فعلی برقرار می‌ماند." : bonusMs > 0 ? "۶۰ دقیقه اضافه برای اتصال بعدی ذخیره شده است." : "اگر هنوز متصل نیستید، زمان اضافه به اتصال بعدی افزوده می‌شود."} در صورت لغو یا ناموفق بودن ویدیو، پاداشی ثبت نمی‌شود.</p>
  </Card>;
}
