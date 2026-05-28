import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ops sign in" };

export default async function OpsLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next = "/ops/runs", error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 text-sm text-ink">
          <svg
            viewBox="0 0 40 40"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="h-6 w-6"
          >
            <path
              d="M20 2 L22.5 17.5 L38 20 L22.5 22.5 L20 38 L17.5 22.5 L2 20 L17.5 17.5 Z"
              fill="#0B0E14"
            />
            <path
              d="M20 9 L21.3 18.7 L31 20 L21.3 21.3 L20 31 L18.7 21.3 L9 20 L18.7 18.7 Z"
              fill="#7DAE9F"
            />
            <circle cx="20" cy="20" r="1.6" fill="#0B0E14" />
          </svg>
          <span className="flex items-baseline gap-1 font-bold tracking-tight">
            <span className="font-extrabold">Northern&nbsp;Star</span>
            <span className="text-sage font-semibold">· CIP · Ops</span>
          </span>
        </div>

        <div className="mt-6 rounded-lg border border-border bg-surface p-7 shadow-sm">
          <h1 className="text-xl font-bold text-text">Ops sign in</h1>
          <p className="mt-1 text-sm text-text-muted">
            Internal tools — agency operators only.
          </p>

          <form method="POST" action="/api/ops/login" className="mt-6 space-y-4">
            <input type="hidden" name="next" value={next} />
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium uppercase tracking-wide text-text-muted"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoFocus
                className="mt-1.5 block w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text focus:border-wa-primary focus:outline-none focus:ring-1 focus:ring-wa-primary"
              />
            </div>
            {error && (
              <p className="text-xs text-red-600">Incorrect password.</p>
            )}
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-md bg-wa-primary px-4 py-2 text-sm font-medium text-white hover:bg-wa-primary-dark"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
