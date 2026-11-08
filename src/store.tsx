import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { CATALOG, DnsProfile } from "./data/catalog";
import { AdManager } from "./ads/adManager";
import { analyze, ProbeSample, ServerMetrics } from "./lib/metrics";
import { isUsable, simSample, sleep } from "./lib/probe";
import { getNativeBridge } from "./lib/nativeBridge";

export const SESSION_MS = 60 * 60 * 1000;
export const EXTENSION_VIDEOS = 2;
const KEY = "dga.v1";
export interface Session { startAt: number; expiresAt: number | null; serverId: string }
export interface AccountProfile { accountId: string; displayName: string; phone: string; mode: "preview" | "verified" }
export interface PurchaseRecord { id: string; planName: string; purchasedAt: number; expiresAt: number; status: "preview" | "verified" }
export interface Settings {
  animations: boolean; reducedMotion: boolean; ipv4Stabilization: boolean; notifications: boolean;
  preview: boolean; simulateFailure: boolean;
}
export interface HistoryEntry {
  ts: number; results: { id: string; medianMs: number | null; loss: number; jitter: number | null; rank: number | null }[];
}
export type Op = null | "ad-connect" | "ad-disconnect" | "permission" | "connecting" | "verifying" | "ad-switch" | "switch-verify" | "ad-extend";
export interface Toast { id: number; kind: "success" | "error" | "info"; text: string }
export interface ScanState { running: boolean; serverIndex: number; sample: number; current: ProbeSample[]; done: boolean; recommended: string | null }
interface Persisted {
  selectedId: string; session: Session | null; settings: Settings; extCount: number; bonusMs: number;
  pendingReward: boolean; metrics: Record<string, ServerMetrics>; history: HistoryEntry[];
  subscriptionExpiresAt: number | null; subscriptionMode: "preview" | "verified" | null;
  purchases: PurchaseRecord[]; account: AccountProfile | null;
}
const defaults: Persisted = {
  selectedId: "gen", session: null,
  settings: { animations: true, reducedMotion: false, ipv4Stabilization: true, notifications: true, preview: true, simulateFailure: false },
  extCount: 0, bonusMs: 0, pendingReward: false, metrics: {}, history: [],
  subscriptionExpiresAt: null, subscriptionMode: null, purchases: [], account: null,
};
function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults;
    const p = { ...defaults, ...JSON.parse(raw) } as Persisted;
    p.settings = { ...defaults.settings, ...p.settings };
    if (p.subscriptionMode === "preview") { p.subscriptionExpiresAt = null; p.subscriptionMode = null; }
    if (p.session && p.session.expiresAt !== null && p.session.expiresAt <= Date.now()) p.session = null;
    return p;
  } catch { return defaults; }
}
interface Ctx extends Persisted {
  now: number; op: Op; error: string | null; toasts: Toast[]; scan: ScanState; live: ServerMetrics | null;
  permissionPending: boolean; active: boolean; selected: DnsProfile; connected: boolean; remainingMs: number;
  connectedMs: number; isPremium: boolean; account: AccountProfile | null;
  authenticate: (mode: "register" | "login", displayName: string, phone: string, password: string) => Promise<void>;
  logout: () => void; purchasePremium: () => Promise<void>; restorePurchases: () => Promise<void>;
  selectedMetrics: ServerMetrics | null; connect: (serverId?: string) => Promise<void>; retryConnect: () => Promise<void>;
  disconnect: (reason?: string) => Promise<void>; selectServer: (id: string) => Promise<void>; extend: () => Promise<void>;
  startScan: () => Promise<void>; cancelScan: () => void; answerPermission: (ok: boolean) => void;
  setSetting: <K extends keyof Settings>(k: K, v: Settings[K]) => void; clearHistory: () => void; dismissError: () => void;
}
const C = createContext<Ctx>(null as unknown as Ctx);
export const useApp = () => useContext(C);
export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Persisted>(load);
  const [now, setNow] = useState(Date.now());
  const [op, setOp] = useState<Op>(null);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [live, setLive] = useState<ServerMetrics | null>(null);
  const [active, setActive] = useState(() => document.visibilityState === "visible");
  const [permissionPending, setPermissionPending] = useState(false);
  const [scan, setScan] = useState<ScanState>({ running: false, serverIndex: 0, sample: 0, current: [], done: false, recommended: null });
  const permResolve = useRef<((ok: boolean) => void) | null>(null);
  const disconnectLock = useRef(false), connectLock = useRef(false), permGranted = useRef(false);
  const token = useRef(0), scanToken = useRef(0), liveSamples = useRef<ProbeSample[]>([]);
  const dataRef = useRef(data);
  dataRef.current = data;
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(data)); }, [data]);
  useEffect(() => {
    const upd = () => { const a = document.visibilityState === "visible"; setActive(a); if (a) setNow(Date.now()); };
    document.addEventListener("visibilitychange", upd);
    return () => document.removeEventListener("visibilitychange", upd);
  }, []);
  const toast = useCallback((kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);
  const selected = useMemo(() => CATALOG.find((c) => c.id === data.selectedId) ?? CATALOG[0], [data.selectedId]);
  const connected = !!data.session;
  const isPremium = data.subscriptionMode === "verified" && !!data.subscriptionExpiresAt && data.subscriptionExpiresAt > now;
  const patch = useCallback((p: Partial<Persisted>) => setData((d) => ({ ...d, ...p })), []);
  const disconnectNow = useCallback((reason?: string) => {
    token.current++; disconnectLock.current = false; connectLock.current = false;
    setOp(null); setLive(null); liveSamples.current = [];
    dataRef.current = { ...dataRef.current, session: null };
    setData((d) => ({ ...d, session: null }));
    if (reason) toast("info", reason);
  }, [toast]);
  const disconnect = useCallback(async (reason?: string) => {
    const d = dataRef.current;
    if (!d.session || disconnectLock.current || op) return;
    disconnectLock.current = true;
    const my = ++token.current;
    if (!(d.subscriptionExpiresAt && d.subscriptionExpiresAt > Date.now())) {
      setOp("ad-disconnect");
      try {
        await AdManager.showDisconnectInterstitial(d.settings.preview);
        if (token.current !== my) { disconnectLock.current = false; return; }
      } catch { toast("info", "تبلیغ در دسترس نبود؛ برای جلوگیری از قفل‌شدن اتصال، آن را قطع می‌کنیم."); }
    }
    if (token.current === my) disconnectNow(reason ?? "اتصال قطع شد.");
  }, [op, disconnectNow, toast]);
  useEffect(() => {
    if (!active || !connected) return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    setNow(Date.now());
    return () => clearInterval(i);
  }, [active, connected]);
  useEffect(() => {
    const s = data.session;
    if (s && !isPremium && s.expiresAt !== null && now >= s.expiresAt) disconnectNow("زمان ۶۰ دقیقه‌ای اتصال به پایان رسید.");
  }, [now, data.session, isPremium, disconnectNow]);
  useEffect(() => {
    const s = data.session;
    if (!s || isPremium || s.expiresAt === null) return;
    const t = setTimeout(() => setNow(Date.now()), Math.max(0, s.expiresAt - Date.now()) + 50);
    return () => clearTimeout(t);
  }, [data.session, isPremium]);
  useEffect(() => {
    if (!active || !data.session) return;
    const id = data.session.serverId;
    if (liveSamples.current.length === 0) { liveSamples.current = Array.from({ length: 10 }, () => simSample(id)); setLive(analyze(liveSamples.current)); }
    const i = setInterval(() => { liveSamples.current = [...liveSamples.current.slice(-19), simSample(id)]; setLive(analyze(liveSamples.current)); }, 3000);
    return () => clearInterval(i);
  }, [active, data.session?.serverId, !!data.session]);
  const remainingMs = data.session && data.session.expiresAt !== null ? Math.max(0, data.session.expiresAt - now) : 0;
  const connectedMs = data.session ? Math.max(0, now - data.session.startAt) : 0;
  useEffect(() => {
    if (isPremium && data.session && data.session.expiresAt !== null) {
      setData((current) => current.session ? { ...current, session: { ...current.session, expiresAt: null } } : current);
      return;
    }
    if (!isPremium && data.session && data.session.expiresAt === null) {
      const deadline = (data.subscriptionExpiresAt ?? Date.now()) + SESSION_MS;
      setData((current) => current.session?.expiresAt === null ? { ...current, session: { ...current.session, expiresAt: deadline } } : current);
    }
  }, [isPremium, data.session, data.subscriptionExpiresAt]);
  useEffect(() => {
    const expiry = data.subscriptionExpiresAt;
    if (!expiry || expiry <= now) return;
    const timer = setTimeout(() => setNow(Date.now()), Math.max(0, expiry - Date.now()) + 50);
    return () => clearTimeout(timer);
  }, [data.subscriptionExpiresAt, now]);
  const verifyForwarding = useCallback(async (p: DnsProfile): Promise<boolean> => {
    await sleep(1100);
    const s = dataRef.current.settings;
    if (!isUsable(p, s.preview) || s.simulateFailure) return false;
    return true;
  }, []);
  const requestPermission = useCallback(() => {
    if (permGranted.current) return Promise.resolve(true);
    return new Promise<boolean>((res) => { permResolve.current = res; setPermissionPending(true); });
  }, []);
  const answerPermission = useCallback((ok: boolean) => {
    if (ok) permGranted.current = true;
    setPermissionPending(false); permResolve.current?.(ok); permResolve.current = null;
  }, []);
  const establish = useCallback(async (my: number, serverId?: string) => {
    const d = dataRef.current, p = CATALOG.find((c) => c.id === (serverId ?? d.selectedId)) ?? CATALOG[0];
    setError(null); setOp("permission");
    const ok = await requestPermission();
    if (token.current !== my) return;
    if (!ok) { setOp(null); setError("مجوز VPN تأیید نشد. پاداش تبلیغ محفوظ است؛ بدون تبلیغ دوباره تلاش کنید."); return; }
    setOp("connecting"); await sleep(900);
    if (token.current !== my) return;
    setOp("verifying");
    const good = await verifyForwarding(p);
    if (token.current !== my) return;
    if (!good) {
      setOp(null);
      setError(isUsable(p, d.settings.preview) ? "عبور درخواست‌های DNS تأیید نشد. پاداش شما محفوظ است؛ بدون تبلیغ دوباره تلاش کنید." : "برای این پروفایل DNS نشانی معتبری تنظیم نشده است و امکان تأیید آن وجود ندارد.");
      return;
    }
    const t = Date.now();
    const session: Session = { startAt: t, expiresAt: (d.subscriptionExpiresAt && d.subscriptionExpiresAt > t) ? null : t + SESSION_MS + d.bonusMs, serverId: p.id };
    dataRef.current = { ...dataRef.current, pendingReward: false, selectedId: p.id, session, bonusMs: 0 };
    setData((x) => ({ ...x, pendingReward: false, selectedId: p.id, session, bonusMs: 0 }));
    liveSamples.current = []; setNow(t); setOp(null);
    toast("success", "اتصال برقرار شد و عبور درخواست‌های DNS تأیید شد.");
  }, [requestPermission, verifyForwarding, toast]);
  const connect = useCallback(async (serverId?: string) => {
    if (op || dataRef.current.session || connectLock.current) return;
    connectLock.current = true;
    let my = token.current;
    try {
      const current = dataRef.current, targetId = serverId ?? current.selectedId, p = CATALOG.find((c) => c.id === targetId);
      if (!p || !isUsable(p, current.settings.preview)) { setError("برای سرور انتخاب‌شده نشانی DNS معتبر تنظیم نشده است."); return; }
      if (targetId !== current.selectedId) { patch({ selectedId: targetId }); dataRef.current = { ...current, selectedId: targetId }; }
      my = ++token.current; setError(null);
      const premiumNow = !!current.subscriptionExpiresAt && current.subscriptionExpiresAt > Date.now();
      if (!current.pendingReward && !premiumNow) {
        setOp("ad-connect");
        const r = await AdManager.showRewarded("connect", current.settings.preview);
        if (token.current !== my) return;
        if (r.status !== "rewarded") { setOp(null); toast("error", r.status === "cancelled" ? "تبلیغ کامل نشد؛ پاداشی ثبت نشد." : `تبلیغ بارگذاری نشد: ${r.reason}`); return; }
        patch({ pendingReward: true }); dataRef.current = { ...dataRef.current, pendingReward: true };
      }
      await establish(my, targetId);
    } catch (e) {
      if (token.current === my) { setOp(null); toast("error", e instanceof Error ? e.message : "اتصال آغاز نشد."); }
    } finally { if (token.current === my) connectLock.current = false; }
  }, [op, establish, patch, toast]);
  const retryConnect = useCallback(async () => {
    if (op || dataRef.current.session || connectLock.current) return;
    const targetId = dataRef.current.selectedId;
    if (!dataRef.current.pendingReward) return connect(targetId);
    connectLock.current = true; const my = ++token.current;
    try { await establish(my, targetId); } finally { if (token.current === my) connectLock.current = false; }
  }, [op, establish, connect]);
  const selectServer = useCallback(async (id: string) => {
    const d = dataRef.current, target = CATALOG.find((c) => c.id === id);
    if (!target || op) return;
    if (d.session) { toast("info", "برای تغییر سرور، ابتدا اتصال را قطع کنید."); return; }
    if (!isUsable(target, d.settings.preview)) { toast("error", `سرور ${target.name} در این نسخه قابل اتصال نیست؛ تنظیمات Native لازم است.`); return; }
    await connect(id);
  }, [op, connect, toast]);
  const extend = useCallback(async () => {
    if (op || (dataRef.current.subscriptionExpiresAt && dataRef.current.subscriptionExpiresAt > Date.now())) return;
    const d = dataRef.current, my = ++token.current;
    setOp("ad-extend");
    const r = await AdManager.showRewarded("extend", d.settings.preview);
    if (token.current !== my) return;
    setOp(null);
    if (r.status !== "rewarded") { toast("error", r.status === "cancelled" ? "ویدیو پیش از تکمیل بسته شد و محاسبه نمی‌شود." : `تبلیغ بارگذاری نشد: ${r.reason}`); return; }
    setData((x) => {
      const c = x.extCount + 1;
      if (c >= EXTENSION_VIDEOS) return x.session
        ? { ...x, extCount: 0, session: { ...x.session, expiresAt: (x.session.expiresAt ?? Date.now()) + SESSION_MS } }
        : { ...x, extCount: 0, bonusMs: x.bonusMs + SESSION_MS };
      return { ...x, extCount: c };
    });
    if (d.extCount + 1 >= EXTENSION_VIDEOS) toast("success", d.session ? "۶۰ دقیقه به زمان اتصال شما اضافه شد." : "۶۰ دقیقه اضافه برای اتصال بعدی ذخیره شد.");
    else toast("success", `ویدیوی ${d.extCount + 1} از ${EXTENSION_VIDEOS} ثبت شد.`);
  }, [op, toast]);
  const cancelScan = useCallback(() => { scanToken.current++; setScan((s) => ({ ...s, running: false })); }, []);
  const startScan = useCallback(async () => {
    if (scan.running) return;
    const my = ++scanToken.current, preview = dataRef.current.settings.preview;
    setScan({ running: true, serverIndex: 0, sample: 0, current: [], done: false, recommended: null });
    const results: Record<string, ServerMetrics> = {};
    for (let i = 0; i < CATALOG.length; i++) {
      const p = CATALOG[i];
      if (!isUsable(p, preview)) { setScan((s) => ({ ...s, serverIndex: i + 1, sample: 0, current: [] })); await sleep(40); if (scanToken.current !== my) return; continue; }
      const samples: ProbeSample[] = [];
      for (let k = 0; k < p.diagnostic.samples; k++) {
        if (scanToken.current !== my) return;
        const sample = simSample(p.id);
        await sleep(sample.ok ? 35 + (sample.rtt ?? 0) * 0.6 : 140);
        samples.push(sample); setScan((st) => ({ ...st, serverIndex: i, sample: k + 1, current: [...samples] }));
      }
      results[p.id] = analyze(samples);
    }
    if (scanToken.current !== my) return;
    const ranked = Object.entries(results).filter(([, m]) => isFinite(m.score)).sort((a, b) => a[1].score - b[1].score);
    const entry: HistoryEntry = {
      ts: Date.now(),
      results: CATALOG.map((c) => {
        const m = results[c.id], rank = ranked.findIndex(([id]) => id === c.id);
        return { id: c.id, medianMs: m?.medianMs ?? null, loss: m?.packetLoss ?? 100, jitter: m?.jitterMs ?? null, rank: rank >= 0 ? rank + 1 : null };
      }).filter((r) => results[r.id]),
    };
    setData((d) => ({ ...d, metrics: { ...d.metrics, ...results }, history: entry.results.length ? [entry, ...d.history].slice(0, 10) : d.history }));
    setScan({ running: false, serverIndex: CATALOG.length, sample: 0, current: [], done: true, recommended: ranked[0]?.[0] ?? null });
    if (!ranked.length) toast("error", "هیچ نشانی DNS معتبری برای آزمایش تنظیم نشده است.");
    else toast("success", "آزمایش سرورها به پایان رسید.");
  }, [scan.running, toast]);
  const authenticate = useCallback(async (mode: "register" | "login", displayName: string, phone: string, password: string) => {
    const bridge = getNativeBridge();
    try {
      if (bridge?.authenticate) {
        const result = await bridge.authenticate({ mode, displayName, phone, password });
        if (!result.success) { toast("error", result.message ?? "ورود یا ثبت‌نام تأیید نشد."); return; }
        const profile: AccountProfile = { accountId: result.accountId ?? `native-${phone}`, displayName: result.displayName ?? displayName, phone: result.phone ?? phone, mode: "verified" };
        patch({ account: profile }); toast("success", mode === "register" ? "حساب کاربری با موفقیت ایجاد شد." : "با موفقیت وارد حساب شدید."); return;
      }
      const profile: AccountProfile = { accountId: `preview-${phone.replace(/\D/g, "")}`, displayName: displayName.trim() || "کاربر DNS Game Art", phone: phone.trim(), mode: "preview" };
      patch({ account: profile }); toast("success", "حساب نمایشی روی همین مرورگر ساخته شد؛ ثبت‌نام واقعی به سرور احراز هویت نیاز دارد.");
    } catch (e) { toast("error", e instanceof Error ? e.message : "خطا در ورود به حساب کاربری."); }
  }, [patch, toast]);
  const logout = useCallback(() => { patch({ account: null }); toast("info", "از حساب کاربری خارج شدید."); }, [patch, toast]);
  const purchasePremium = useCallback(async () => {
    if (!dataRef.current.account) { toast("error", "برای خرید اشتراک ابتدا وارد حساب کاربری شوید."); return; }
    const bridge = getNativeBridge();
    if (!bridge?.purchaseMyket || !bridge.verifyMyketPurchase) { toast("error", "خرید واقعی مایکت فقط در نسخه Native اندروید و پس از اتصال SDK و سرویس تأیید خرید فعال می‌شود."); return; }
    try {
      const result = await bridge.purchaseMyket("dns_game_art_premium_monthly");
      if (result.status === "cancelled") { toast("info", "خرید توسط کاربر لغو شد."); return; }
      if (result.status !== "purchased" || !result.purchaseToken) { toast("error", result.message ?? "خرید از مایکت ناموفق بود."); return; }
      const verified = await bridge.verifyMyketPurchase(result.productId, result.purchaseToken, result.orderId);
      if (!verified.valid || !verified.expiresAt) { toast("error", verified.message ?? "رسید خرید در سرور تأیید نشد؛ اشتراک فعال نشد."); return; }
      const purchasedAt = Date.now();
      const record: PurchaseRecord = { id: verified.orderId ?? result.orderId ?? `myket-${purchasedAt}`, planName: "اشتراک ماهانه پریمیوم", purchasedAt, expiresAt: verified.expiresAt, status: "verified" };
      setData((current) => ({ ...current, subscriptionExpiresAt: verified.expiresAt!, subscriptionMode: "verified", purchases: [record, ...current.purchases.filter((x) => x.id !== record.id)], extCount: 0, bonusMs: 0, pendingReward: false, session: current.session ? { ...current.session, expiresAt: null } : null }));
      setNow(purchasedAt); toast("success", "خرید مایکت تأیید شد و اشتراک پریمیوم فعال شد.");
    } catch (e) { toast("error", e instanceof Error ? e.message : "خطا در ارتباط با مایکت یا سرور تأیید خرید."); }
  }, [toast]);
  const restorePurchases = useCallback(async () => {
    if (!dataRef.current.account) { toast("error", "برای بازیابی خریدها ابتدا وارد حساب کاربری شوید."); return; }
    const bridge = getNativeBridge();
    if (!bridge?.restoreMyketPurchases || !bridge.verifyMyketPurchase) { toast("error", "بازیابی خریدها پس از اتصال SDK مایکت در نسخه اندروید فعال می‌شود."); return; }
    try {
      const items = await bridge.restoreMyketPurchases(), verifiedItems = [] as { record: PurchaseRecord; expiresAt: number }[];
      for (const item of items) {
        if (item.status !== "purchased" || !item.purchaseToken) continue;
        const verified = await bridge.verifyMyketPurchase(item.productId, item.purchaseToken, item.orderId);
        if (verified.valid && verified.expiresAt) {
          const purchasedAt = Date.now();
          verifiedItems.push({ expiresAt: verified.expiresAt, record: { id: verified.orderId ?? item.orderId ?? `myket-${purchasedAt}`, planName: "اشتراک ماهانه پریمیوم", purchasedAt, expiresAt: verified.expiresAt, status: "verified" } });
        }
      }
      if (!verifiedItems.length) { toast("info", "اشتراک فعالی برای بازیابی پیدا نشد."); return; }
      const latest = verifiedItems.sort((a, b) => b.expiresAt - a.expiresAt)[0];
      setData((current) => ({ ...current, subscriptionExpiresAt: latest.expiresAt, subscriptionMode: "verified", purchases: [...verifiedItems.map((x) => x.record), ...current.purchases].filter((x, i, arr) => arr.findIndex((y) => y.id === x.id) === i), session: current.session ? { ...current.session, expiresAt: null } : null }));
      setNow(Date.now()); toast("success", "اشتراک تأییدشده مایکت بازیابی شد.");
    } catch (e) { toast("error", e instanceof Error ? e.message : "بازیابی خریدهای مایکت ناموفق بود."); }
  }, [toast]);
  const setSetting = useCallback(<K extends keyof Settings>(k: K, v: Settings[K]) => { setData((d) => ({ ...d, settings: { ...d.settings, [k]: v } })); }, []);
  const clearHistory = useCallback(() => patch({ history: [], metrics: {} }), [patch]);
  const dismissError = useCallback(() => setError(null), []);
  const selectedMetrics = connected && live ? live : data.metrics[data.selectedId] ?? null;
  const value: Ctx = {
    ...data, now, op, error, toasts, scan, live, permissionPending, active, selected, connected,
    remainingMs, connectedMs, selectedMetrics, isPremium, account: data.account,
    authenticate, logout, purchasePremium, restorePurchases, connect, retryConnect, disconnect, selectServer, extend,
    startScan, cancelScan, answerPermission, setSetting, clearHistory, dismissError,
  };
  return <C.Provider value={value}>{children}</C.Provider>;
}
