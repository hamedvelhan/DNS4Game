import { Fragment } from "react";
import { useApp } from "../store";
import { CATALOG } from "../data/catalog";
import { availability } from "../lib/probe";
import { NativeAdCard, ServerCard } from "../components/ServerCard";
import { AD_CONFIG } from "../ads/adManager";
import { ScannerScreen } from "./ScannerScreen";
import type { Tab } from "../App";

export function ServersScreen({ go }: { go: (t: Tab) => void }) {
  const { metrics, selectedId, connectToServer, settings, op, connected, isPremium } = useApp();

  const handleServer = async (id: string) => {
    const ok = await connectToServer(id);
    if (ok) go("home");
  };

  return (
    <div className="page-enter space-y-4">
      <div>
        <h2 className="text-lg font-bold tracking-wide">سرورهای بازی</h2>
        <p className="mt-0.5 text-[11px] text-slate-400">روی هر سرور بزن تا تبلیغ ببینی و مستقیم وصل شی.</p>
      </div>

      <ScannerScreen compact onConnected={() => go("home")} />

      {connected && !isPremium && (
        <p className="rounded-xl border border-cyan/20 bg-cyan/5 px-3 py-2 text-[11px] leading-5 text-cyan/90">
          برای تعویض سرور، ویدیوی جایزه‌ای پخش می‌شود. بعد از پاداش، سرور عوض می‌شود.
        </p>
      )}
      {connected && isPremium && (
        <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-[11px] text-emerald-200">
          اشتراک فعال است؛ تغییر سرور بدون تبلیغ.
        </p>
      )}

      <div className="space-y-2.5 pb-2">
        {CATALOG.map((p, i) => (
          <Fragment key={p.id}>
            <ServerCard
              p={p}
              m={metrics[p.id]}
              avail={availability(p, settings.preview)}
              selected={p.id === selectedId}
              busy={!!op}
              delay={i}
              onSelect={() => handleServer(p.id)}
            />
            {i === AD_CONFIG.nativeAfterIndex - 1 && !isPremium && <NativeAdCard />}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
