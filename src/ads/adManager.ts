// لایه سبک تبلیغات جایزه‌ای. در پیش‌نمایش وب از تایمر نمایشی استفاده می‌شود؛
// نسخه Native باید ارائه‌دهنده واقعی را ثبت کند تا نتیجه پاداش از callback SDK بیاید.
export type RewardedPlacement = "connect" | "switch" | "extend";
export type InterstitialPlacement = "disconnect";
export type AdPlacement = RewardedPlacement | InterstitialPlacement;
/** جایگاه‌هایی که مطلقاً نباید تبلیغ داشته باشند؛ برای آن‌ها API تعریف نشده است. */
export const FORBIDDEN_PLACEMENTS = ["startup", "loading", "home", "exit", "navigation"] as const;
export const AD_CONFIG = {
  provider: null as string | null, rewardedUnitId: "", nativeUnitId: "", interstitialUnitId: "", nativeAfterIndex: 3,
};
export type AdResult =
  | { status: "rewarded"; rewardId: string }
  | { status: "cancelled" }
  | { status: "failed"; reason: string };
export interface RewardedAdProvider {
  readonly name: string; isReady(): boolean;
  /** این Promise فقط پس از دریافت callback واقعی پاداش باید با rewarded تمام شود. */
  show(placement: RewardedPlacement): Promise<AdResult>;
}
export interface InterstitialAdProvider {
  readonly name: string; isReady(): boolean;
  /** Resolves when the interstitial is closed or otherwise finished. */
  show(): Promise<void>;
}
export interface NativeAdProvider { readonly name: string; isReady(): boolean }
export interface OverlayRequest {
  placement: AdPlacement; rewardId: string; finish: (result: AdResult) => void;
}
type Listener = () => void;
let current: OverlayRequest | null = null;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((listener) => listener());
export const adOverlayStore = {
  subscribe(listener: Listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  get: () => current,
};
/** ارائه‌دهنده نمایشی مخصوص نسخه وب؛ پس از پایان تایمر، Overlay پاداش را خودکار ثبت می‌کند. */
const previewProvider = {
  name: "پیش‌نمایش وب (بدون تبلیغ واقعی)", isReady: () => true,
  show: (placement: AdPlacement) => new Promise<AdResult>((resolve) => {
    if (current) return resolve({ status: "failed", reason: "یک تبلیغ دیگر در حال نمایش است." });
    const rewardId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    current = { placement, rewardId, finish: (result) => { current = null; emit(); resolve(result); } };
    emit();
  }),
};
let nativeRewardedProvider: RewardedAdProvider | null = null;
let nativeInterstitialProvider: InterstitialAdProvider | null = null;
/** نسخه اندروید باید پس از راه‌اندازی SDK تبلیغات، provider واقعی را ثبت کند. */
export function registerRewardedAdProvider(provider: RewardedAdProvider) { nativeRewardedProvider = provider; }
/** Register a regular interstitial for user-initiated disconnects (no reward is granted). */
export function registerInterstitialAdProvider(provider: InterstitialAdProvider) { nativeInterstitialProvider = provider; }
const consumedRewards = new Set<string>();
export const AdManager = {
  providerName: () => nativeRewardedProvider?.name ?? AD_CONFIG.provider ?? previewProvider.name,
  isConfigured: () => !!nativeRewardedProvider && !!AD_CONFIG.provider && !!AD_CONFIG.rewardedUnitId,
  async showRewarded(placement: RewardedPlacement, previewMode: boolean): Promise<AdResult> {
    const provider = previewMode ? previewProvider : nativeRewardedProvider;
    if (!provider || (!previewMode && !AdManager.isConfigured())) return { status: "failed", reason: "ارائه‌دهنده واقعی تبلیغات تنظیم نشده است." };
    if (!provider.isReady()) return { status: "failed", reason: "در حال حاضر تبلیغی در دسترس نیست." };
    const result = await provider.show(placement);
    if (result.status === "rewarded") {
      if (consumedRewards.has(result.rewardId)) return { status: "failed", reason: "پاداش تکراری نادیده گرفته شد." };
      consumedRewards.add(result.rewardId);
    }
    return result;
  },
  async showDisconnectInterstitial(previewMode: boolean): Promise<void> {
    if (previewMode) { await previewProvider.show("disconnect"); return; }
    if (!nativeInterstitialProvider || !nativeInterstitialProvider.isReady() || !AD_CONFIG.provider || !AD_CONFIG.interstitialUnitId) {
      throw new Error("تبلیغ بین‌صفحه‌ای قطع اتصال تنظیم نشده است.");
    }
    await nativeInterstitialProvider.show();
  },
};
