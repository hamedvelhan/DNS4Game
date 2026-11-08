export interface NativeNetworkInfo {
  online: boolean;
  type: "Wi-Fi" | "Mobile data" | "Ethernet" | "Unknown" | "Offline";
  detail?: string;
  carrier?: string;
  ipv4?: "Available" | "Unknown";
}
export interface NativeAuthResult {
  success: boolean;
  accountId?: string;
  displayName?: string;
  phone?: string;
  message?: string;
}
export interface NativeMyketPurchase {
  status: "purchased" | "cancelled" | "failed";
  productId: string;
  purchaseToken?: string;
  orderId?: string;
  message?: string;
}
export interface NativeVerifiedPurchase {
  valid: boolean;
  productId: string;
  orderId?: string;
  expiresAt?: number;
  message?: string;
}
export interface DNSGameArtNativeBridge {
  getNetworkInfo?: () => Promise<NativeNetworkInfo> | NativeNetworkInfo;
  authenticate?: (input: { mode: "register" | "login"; displayName: string; phone: string; password: string }) => Promise<NativeAuthResult>;
  purchaseMyket?: (productId: string) => Promise<NativeMyketPurchase>;
  verifyMyketPurchase?: (productId: string, purchaseToken: string, orderId?: string) => Promise<NativeVerifiedPurchase>;
  restoreMyketPurchases?: () => Promise<NativeMyketPurchase[]>;
}
export function getNativeBridge(): DNSGameArtNativeBridge | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { DNSGameArtNative?: DNSGameArtNativeBridge }).DNSGameArtNative;
}
