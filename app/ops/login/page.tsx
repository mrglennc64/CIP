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
        <div className="text-center text-sm font-semibold tracking-tight text-text">
          Web Assessment Agency · Ops
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
