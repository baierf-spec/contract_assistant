"use client";

import React, { useEffect, useState } from "react";

type Metrics = {
  days: Array<{ day: string; total: number; ok: number; limited: number; error: number }>;
  countries: Array<{ country: string; count: number }>;
  totals: { total: number; ok: number; limited: number; error: number };
};

export default function Admin(): React.ReactElement {
  const [authed, setAuthed] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    void (async () => {
      // try to load metrics; if unauthorized, require login
      const res = await fetch("/api/admin/metrics");
      if (res.status === 401) return;
      if (res.ok) {
        const data = (await res.json()) as Metrics;
        setAuthed(true);
        setMetrics(data);
      }
    })();
  }, []);

  async function login(): Promise<void> {
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setError("Invalid password or admin not configured.");
      return;
    }
    setAuthed(true);
    const m = await fetch("/api/admin/metrics");
    if (m.ok) setMetrics((await m.json()) as Metrics);
  }

  if (!authed) {
    return (
      <div className="max-w-md mx-auto px-4 py-10 space-y-4">
        <h1 className="text-2xl font-bold">Admin Login</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin password"
          className="w-full h-11 rounded-md border px-3 text-sm bg-white dark:bg-black/20"
        />
        <button
          onClick={() => void login()}
          className="h-11 px-5 rounded-md text-white text-sm font-semibold"
          style={{ background: "var(--color-primary)" }}
        >
          Login
        </button>
        {error && <p className="text-sm" style={{ color: "#dc2626" }}>{error}</p>}
        <p className="text-xs text-foreground/60">No PII stored; only aggregated metrics.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      {metrics ? (
        <>
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-lg border p-4 bg-white dark:bg-black/20">
              <div className="text-xs text-foreground/60">Total</div>
              <div className="text-2xl font-bold">{metrics.totals.total}</div>
            </div>
            <div className="rounded-lg border p-4 bg-white dark:bg-black/20">
              <div className="text-xs text-foreground/60">Success</div>
              <div className="text-2xl font-bold">{metrics.totals.ok}</div>
            </div>
            <div className="rounded-lg border p-4 bg-white dark:bg-black/20">
              <div className="text-xs text-foreground/60">Limited</div>
              <div className="text-2xl font-bold">{metrics.totals.limited}</div>
            </div>
            <div className="rounded-lg border p-4 bg-white dark:bg-black/20">
              <div className="text-xs text-foreground/60">Errors</div>
              <div className="text-2xl font-bold">{metrics.totals.error}</div>
            </div>
          </section>

          <section className="rounded-lg border p-4 bg-white dark:bg-black/20">
            <h2 className="font-semibold mb-2">Last 14 days</h2>
            <div className="text-xs grid grid-cols-1 md:grid-cols-2 gap-2">
              {metrics.days.map((d) => (
                <div key={d.day} className="flex justify-between border rounded p-2">
                  <span>{d.day}</span>
                  <span>Total: {d.total} · OK: {d.ok} · Limited: {d.limited} · Err: {d.error}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border p-4 bg-white dark:bg-black/20">
            <h2 className="font-semibold mb-2">Top countries</h2>
            <div className="text-xs grid grid-cols-1 md:grid-cols-2 gap-2">
              {metrics.countries.map((c) => (
                <div key={c.country} className="flex justify-between border rounded p-2">
                  <span>{c.country}</span>
                  <span>{c.count}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}


