let memoryHits: Map<string, { count: number; resetAt: number }> = new Map();

export async function rateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<{ allowed: boolean; remaining: number; resetMs: number }> {
  const now = Date.now();
  const entry = memoryHits.get(key);
  if (!entry || now > entry.resetAt) {
    memoryHits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetMs: windowMs };
  }
  if (entry.count < limit) {
    entry.count += 1;
    return { allowed: true, remaining: limit - entry.count, resetMs: entry.resetAt - now };
  }
  return { allowed: false, remaining: 0, resetMs: entry.resetAt - now };
}


