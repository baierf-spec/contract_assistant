import { Redis } from "@upstash/redis";

type AnalyzeEvent = {
  timestampMs: number;
  dayKey: string; // YYYY-MM-DD
  country: string; // ISO or ZZ
  outcome: "ok" | "limited" | "error";
};

let redis: Redis | null = null;
try {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    redis = new Redis({ url, token });
  }
} catch {
  redis = null;
}

// In-memory fallback for local/dev. Note: not persistent in serverless.
const memoryStore: Map<string, Record<string, number>> = new Map();

function getDayKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export async function recordAnalyzeEvent(params: {
  country?: string;
  outcome: AnalyzeEvent["outcome"];
  when?: Date;
}): Promise<void> {
  const dayKey = getDayKey(params.when ?? new Date());
  const country = (params.country || "ZZ").toUpperCase();

  const totalField = "total";
  const outcomeField = `outcome:${params.outcome}`;
  const countryField = `country:${country}`;
  const key = `metrics:analyze:${dayKey}`;

  if (redis) {
    try {
      await Promise.all([
        redis.hincrby(key, totalField, 1),
        redis.hincrby(key, outcomeField, 1),
        redis.hincrby(key, countryField, 1),
        // expire keys after 60 days
        redis.expire(key, 60 * 24 * 60 * 60),
      ]);
      return;
    } catch {
      // fall through to memory
    }
  }

  const current = memoryStore.get(key) ?? {};
  current[totalField] = (current[totalField] ?? 0) + 1;
  current[outcomeField] = (current[outcomeField] ?? 0) + 1;
  current[countryField] = (current[countryField] ?? 0) + 1;
  memoryStore.set(key, current);
}

export async function readAnalyzeMetrics(days = 7): Promise<{
  days: Array<{ day: string; total: number; ok: number; limited: number; error: number }>;
  countries: Array<{ country: string; count: number }>;
  totals: { total: number; ok: number; limited: number; error: number };
}> {
  const dayKeys: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    dayKeys.push(getDayKey(d));
  }

  const dayData: Array<{ day: string; total: number; ok: number; limited: number; error: number }> = [];
  const countryAgg: Map<string, number> = new Map();
  const totals = { total: 0, ok: 0, limited: 0, error: 0 };

  for (const day of dayKeys) {
    const key = `metrics:analyze:${day}`;
    let obj: Record<string, number> = {};
    if (redis) {
      try {
        const res = (await redis.hgetall<number>(key)) || {};
        obj = res as Record<string, number>;
      } catch {
        // ignore
      }
    }
    if (!redis) {
      obj = memoryStore.get(key) ?? {};
    }

    const total = Number(obj["total"] ?? 0);
    const ok = Number(obj["outcome:ok"] ?? 0);
    const limited = Number(obj["outcome:limited"] ?? 0);
    const error = Number(obj["outcome:error"] ?? 0);
    dayData.push({ day, total, ok, limited, error });

    totals.total += total;
    totals.ok += ok;
    totals.limited += limited;
    totals.error += error;

    for (const [field, value] of Object.entries(obj)) {
      if (!field.startsWith("country:")) continue;
      const c = field.split(":")[1] ?? "ZZ";
      countryAgg.set(c, (countryAgg.get(c) ?? 0) + Number(value ?? 0));
    }
  }

  const countries = Array.from(countryAgg.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  return { days: dayData.reverse(), countries, totals };
}


