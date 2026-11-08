import { ReactNode } from "react";
import { Activity, Bell, Info, Lock, Sparkles, Trash2 } from "lucide-react";
import { useApp } from "../store";
import { useNetwork } from "../lib/network";
import { AdManager } from "../ads/adManager";
import { Btn, Card, Toggle } from "../components/ui";
function Row({ title, desc, right }: { title: string; desc?: string; right: ReactNode }) {
  return <div className="flex items-center justify-between gap-3 py-2.5"><div className="min-w-0"><div className="text-sm font-medium">{title}</div>{desc && <div className="text-[11px] leading-snug text-slate-400">{desc}</div>}</div>{right}</div>;
}
const Section = ({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) => <Card><div className="mb-1 flex items-center gap-2 text-xs font-semibold text-cyan">{icon}{title}</div><div className="divide-y divide-white/5">{children}</div></Card>;
export function SettingsScreen() {
  const { settings, setSetting, clearHistory, history } = useApp();
  const net = useNetwork();
  const kv = (key: string, value: string) => <div key={key} className="flex justify-between gap-3 py-2 text-xs"><span className="text-slate-400">{key}</span><span className="text-left text-slate-200">{value}</span></div>;
  const networkType = net.type === "Wi-Fi" ? "وای‌فای" : net.type === "Mobile data" ? "اینترنت همراه" : net.type === "Ethernet" ? "شبکه کابلی" : net.type === "Offline" ? "قطع" : "نامشخص";
  return <div className="page-enter space-y-4"><h2 className="text-xl font-bold">تنظیمات</h2>
    <Section icon={<Sparkles className="h-4 w-4" />} title="انیمیشن و جلوه‌های بصری"><Row title="جلوه‌های متحرک" desc="نور، گرادینت متحرک و افکت اسکن؛ با رفتن برنامه به پس‌زمینه متوقف می‌شوند." right={<Toggle label="جلوه‌های متحرک" on={settings.animations} onChange={(value) => setSetting("animations", value)} />} /><Row title="کاهش حرکت" desc="غیرفعال کردن انیمیشن‌های غیرضروری برای مصرف کمتر منابع." right={<Toggle label="کاهش حرکت" on={settings.reducedMotion} onChange={(value) => setSetting("reducedMotion", value)} />} /></Section>
    <Section icon={<Lock className="h-4 w-4" />} title="تنظیمات شبکه"><Row title="تثبیت IPv4" desc="ترجیح مسیر IPv4 برای شبکه‌هایی که با IPv6 مشکل دارند؛ این گزینه در پیش‌نمایش وب فقط نمایشی است." right={<Toggle label="تثبیت IPv4" on={settings.ipv4Stabilization} onChange={(value) => setSetting("ipv4Stabilization", value)} />} /><Row title="اعلان‌ها" desc="در نسخه اندروید، هنگام فعال بودن VPN اعلان دائمی سرویس لازم است." right={<Toggle label="اعلان‌ها" on={settings.notifications} onChange={(value) => setSetting("notifications", value)} />} /></Section>
    <Section icon={<Activity className="h-4 w-4" />} title="اطلاعات شبکه">{kv("وضعیت", net.online ? "آنلاین" : "آفلاین")}{kv("نوع شبکه", networkType)}{kv("جزئیات اتصال", net.detail)}{kv("اپراتور", net.carrier === "Unknown" ? "نامشخص" : net.carrier)}{kv("IPv4", net.ipv4 === "Available" ? "در دسترس" : "نامشخص")}<div className="pt-2 text-[11px] leading-6 text-amber-200/80">DNS خصوصی اندروید: اگر در تنظیمات سیستم، بخش «DNS خصوصی» روی نام میزبان تنظیم شده باشد، ممکن است با VPN محدود به DNS تداخل ایجاد کند. در صورت مشکل، بخش تنظیمات شبکه ← DNS خصوصی را بررسی کنید.</div></Section>
    <Section icon={<Bell className="h-4 w-4" />} title="داده‌های ذخیره‌شده"><Row title="تاریخچه اسکن" desc={`${history.length} آزمایش به‌صورت محلی ذخیره شده است.`} right={<Btn variant="ghost" className="!px-3 !py-1.5 !text-xs" onClick={clearHistory}><Trash2 className="h-3.5 w-3.5" /> پاک‌کردن</Btn>} /></Section>
    <Section icon={<Info className="h-4 w-4" />} title="حالت پیش‌نمایش وب"><Row title="داده‌های نمایشی" desc="مرورگر نمی‌تواند VPN واقعی ایجاد کند یا بسته DNS ارسال کند. در این حالت نتایج ساختگی فقط برای بررسی ظاهر و روند صفحات استفاده می‌شوند." right={<Toggle label="داده‌های نمایشی" on={settings.preview} onChange={(value) => setSetting("preview", value)} />} /><Row title="شبیه‌سازی خطای تأیید" desc="برای آزمایش مسیر تلاش دوباره و بازگشت به سرور قبلی." right={<Toggle label="شبیه‌سازی خطای تأیید" on={settings.simulateFailure} onChange={(value) => setSetting("simulateFailure", value)} />} />{kv("ارائه‌دهنده تبلیغات", AdManager.providerName())}</Section>
    <Section icon={<Info className="h-4 w-4" />} title="درباره برنامه">{kv("نام برنامه", "DNS Game Art")}{kv("نسخه", "۱.۰.۰ · نسخه اولیه")}{kv("شناسه بسته اندروید", "ir.stvelhan.dnsgameart")}<div className="pt-2 text-[11px] leading-5 text-slate-500">زمان پاسخ DNS با درخواست‌های DNS سنجیده می‌شود و معادل پینگ سرور بازی نیست. این نسخه پیش‌نمایش وب است و به VPN یا DNS واقعی متصل نمی‌شود.</div></Section>
  </div>;
}
