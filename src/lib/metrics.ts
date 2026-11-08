export interface ProbeSample { ok: boolean; rtt: number | null }
export interface ServerMetrics {
  samples: number; success: number; medianMs: number | null; packetLoss: number;
  jitterMs: number | null; stability: number; score: number;
}
export const median = (xs: number[]): number | null => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b), m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
export const packetLoss = (samples: ProbeSample[]) => samples.length ? (samples.filter((s) => !s.ok).length / samples.length) * 100 : 100;
export const jitter = (samples: ProbeSample[]): number | null => {
  let sum = 0, n = 0, prev: number | null = null;
  for (const s of samples) {
    if (s.ok && s.rtt != null) { if (prev != null) { sum += Math.abs(s.rtt - prev); n++; } prev = s.rtt; }
    else prev = null;
  }
  return n ? sum / n : prev != null ? 0 : null;
};
export const stdDev = (xs: number[]) => {
  if (xs.length < 2) return 0;
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length);
};
export function analyze(samples: ProbeSample[]): ServerMetrics {
  const rtts = samples.filter((s) => s.ok && s.rtt != null).map((s) => s.rtt as number);
  const med = median(rtts), loss = packetLoss(samples), jit = jitter(samples), sd = stdDev(rtts);
  const spread = med ? Math.min(1, sd / Math.max(med, 1)) : 1;
  const stability = Math.max(0, Math.round(100 - spread * 60 - loss * 0.8));
  const score = med == null ? Infinity : med + loss * 6 + (jit ?? 0) * 2 + (100 - stability) * 0.6;
  return { samples: samples.length, success: rtts.length, medianMs: med, packetLoss: loss, jitterMs: jit, stability, score };
}
export type Quality = "excellent" | "good" | "fair" | "poor" | "unknown";
export function quality(m?: ServerMetrics | null): Quality {
  if (!m || m.medianMs == null) return "unknown";
  if (m.packetLoss > 20 || m.medianMs > 250) return "poor";
  if (m.packetLoss > 5 || m.medianMs > 120 || (m.jitterMs ?? 0) > 40) return "fair";
  if (m.medianMs > 50 || (m.jitterMs ?? 0) > 15) return "good";
  return "excellent";
}
export const QUALITY_STYLE: Record<Quality, { label: string; text: string; bg: string; bars: number }> = {
  excellent: { label: "Excellent", text: "text-emerald-300", bg: "bg-emerald-400", bars: 4 },
  good: { label: "Good", text: "text-cyan-300", bg: "bg-cyan-400", bars: 3 },
  fair: { label: "Fair", text: "text-amber-300", bg: "bg-amber-400", bars: 2 },
  poor: { label: "Poor", text: "text-rose-300", bg: "bg-rose-400", bars: 1 },
  unknown: { label: "No data", text: "text-slate-400", bg: "bg-slate-500", bars: 0 },
};
export const fmtMs = (v: number | null | undefined) => (v == null ? "—" : `${Math.round(v)} ms`);
export const fmtPct = (v: number | null | undefined) => (v == null ? "—" : `${v.toFixed(v % 1 ? 1 : 0)}%`);
export const fmtClock = (ms: number) => {
  const t = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
};
