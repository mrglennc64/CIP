"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function NewRunPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [customer, setCustomer] = useState("");
  const [plan, setPlan] = useState<"Starter" | "Standard" | "Professional">(
    "Standard"
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/ops/runs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, customer, plan }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { run: { id: string } };
      router.push(`/ops/runs/${data.run.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight text-text">New run</h1>
      <p className="mt-1 text-sm text-text-muted">
        Drop a URL and the 7 channels start in parallel.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-lg border border-border bg-surface p-6 shadow-sm"
      >
        <div className="space-y-5">
          <div>
            <label
              htmlFor="url"
              className="block text-xs font-medium uppercase tracking-wide text-text-muted"
            >
              URL
            </label>
            <input
              id="url"
              type="text"
              autoFocus
              required
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="mt-1.5 block w-full rounded-md border border-border bg-bg px-3 py-2 font-mono text-sm text-text focus:border-wa-primary focus:outline-none focus:ring-1 focus:ring-wa-primary"
            />
            <p className="mt-1 text-xs text-text-muted">
              We fetch the page, parse it, and run all 7 channels against it.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="customer"
                className="block text-xs font-medium uppercase tracking-wide text-text-muted"
              >
                Customer name (optional)
              </label>
              <input
                id="customer"
                type="text"
                placeholder="Defaults to hostname"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="mt-1.5 block w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text focus:border-wa-primary focus:outline-none focus:ring-1 focus:ring-wa-primary"
              />
            </div>
            <div>
              <label
                htmlFor="plan"
                className="block text-xs font-medium uppercase tracking-wide text-text-muted"
              >
                Plan
              </label>
              <select
                id="plan"
                value={plan}
                onChange={(e) =>
                  setPlan(e.target.value as typeof plan)
                }
                className="mt-1.5 block w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text focus:border-wa-primary focus:outline-none focus:ring-1 focus:ring-wa-primary"
              >
                <option>Starter</option>
                <option>Standard</option>
                <option>Professional</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border pt-5">
            <p className="text-xs text-text-muted">
              Real fetch · parses HTML with cheerio · runs 5 jobs in parallel
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-md bg-wa-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-wa-primary-dark disabled:opacity-60"
            >
              {submitting ? "Starting…" : "Start run"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
