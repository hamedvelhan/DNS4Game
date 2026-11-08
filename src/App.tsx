import { useEffect, useRef, useState } from "react";
import { Home, Server, Settings, UserRound } from "lucide-react";
import { AppProvider, useApp } from "./store";
import { Logo, cx } from "./components/ui";
import { AdOverlay, PermissionDialog, Toasts } from "./components/Overlays";
import { HomeScreen } from "./screens/HomeScreen";
import { ServersScreen } from "./screens/ServersScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { AccountScreen } from "./screens/AccountScreen";
import { ConnectionScreen } from "./screens/ConnectionScreen";

export type Tab = "home" | "servers" | "account" | "settings";

const TABS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "home", label: "خانه", icon: Home },
  { id: "servers", label: "سرورها", icon: Server },
  { id: "account", label: "حساب", icon: UserRound },
  { id: "settings", label: "تنظیمات", icon: Settings },
];

function Shell() {
  const [tab, setTab] = useState<Tab>("home");
  const { settings, connected, active } = useApp();
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => { scroller.current?.scrollTo({ top: 0 }); }, [tab, connected]);
  useEffect(() => { if (connected) setTab("home"); }, [connected]);
  const anim = settings.reducedMotion ? "off" : settings.animations && active ? "on" : "paused";

  return (
    <div className="flex h-dvh items-center justify-center bg-[#05060a]" data-anim={anim} dir="rtl">
      <div className="relative flex h-full w-full max-w-md flex-col overflow-hidden bg-ink sm:h-[min(100%,880px)] sm:rounded-[2.2rem] sm:border sm:border-line">
        <div className="deco drift pointer-events-none absolute inset-0 opacity-60" style={{ backgroundImage: "radial-gradient(60% 40% at 20% 0%, rgba(79,124,255,.18), transparent), radial-gradient(50% 35% at 100% 15%, rgba(139,92,246,.16), transparent), radial-gradient(60% 40% at 50% 100%, rgba(34,211,238,.08), transparent)", backgroundSize: "140% 140%" }} />
        <header className="relative z-10 flex items-center justify-between px-4 pb-2 pt-4">
          <div className="flex items-center gap-2.5">
            <Logo />
            <div className="leading-none">
              <div className="text-left text-base font-bold tracking-wide" dir="ltr">DNS <span className="bg-gradient-to-r from-cyan to-violet bg-clip-text text-transparent">GAME ART</span></div>
              <div className="mt-1 text-[10px] text-slate-500">{connected ? "داشبورد اتصال فعال" : "ابزار هوشمند DNS بازی"}</div>
            </div>
          </div>
          {connected && <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] text-emerald-200">اتصال فعال</span>}
        </header>
        <main ref={scroller} className="scroll-hide relative z-10 flex-1 overflow-y-auto px-4 pb-5 pt-2">
          {connected ? <ConnectionScreen /> : <div key={tab}>
            {tab === "home" && <HomeScreen />}
            {tab === "servers" && <ServersScreen />}
            {tab === "account" && <AccountScreen />}
            {tab === "settings" && <SettingsScreen />}
          </div>}
        </main>
        {!connected && <nav className="relative z-10 grid grid-cols-4 border-t border-line bg-panel/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur">
          {TABS.map(({ id, label, icon: Icon }) => {
            const on = tab === id;
            return <button key={id} onClick={() => setTab(id)} className="group relative flex flex-col items-center gap-0.5 py-1.5" aria-current={on ? "page" : undefined}>
              <span className={cx("absolute -top-1.5 h-0.5 rounded-full bg-gradient-to-r from-cyan to-violet transition-all duration-300", on ? "w-8 opacity-100" : "w-0 opacity-0")} />
              <Icon className={cx("h-5 w-5 transition-all duration-300", on ? "-translate-y-0.5 text-cyan drop-shadow-[0_0_8px_rgba(34,211,238,.7)]" : "text-slate-500 group-active:scale-90")} />
              <span className={cx("text-[10px] transition-colors", on ? "text-cyan" : "text-slate-500")}>{label}</span>
            </button>;
          })}
        </nav>}
        <AdOverlay />
        <PermissionDialog />
        <Toasts />
      </div>
    </div>
  );
}

export default function App() {
  return <AppProvider><Shell /></AppProvider>;
}
