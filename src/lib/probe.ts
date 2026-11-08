import { DnsProfile, isConfigured } from "../data/catalog";
import { ProbeSample } from "./metrics";

export type Availability = "preview" | "native-only" | "unconfigured";

export const availability = (p: DnsProfile, preview: boolean): Availability =>
  preview ? "preview" : isConfigured(p) ? "native-only" : "unconfigured";

export const isUsable = (p: DnsProfile, preview: boolean) => availability(p, preview) === "preview";

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};

export function simBase(id: string) {
  const h = hash(id);
  return {
    rtt: 18 + (h % 95),
    loss: (h >> 3) % 100 < 22 ? 3 + ((h >> 5) % 14) : (h >> 9) % 100 < 40 ? 1 : 0,
    jit: 2 + ((h >> 7) % 22),
  };
}

export function simSample(id: string): ProbeSample {
  const b = simBase(id);
  if (Math.random() * 100 < b.loss) return { ok: false, rtt: null };
  return { ok: true, rtt: Math.max(4, b.rtt + (Math.random() - 0.5) * b.jit * 2) };
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
