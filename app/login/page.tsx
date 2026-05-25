import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign in — Web Assessment Agency",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center">
          <Link
            href="/"
            className="inline-block text-sm font-semibold tracking-tight text-text hover:text-wa-primary"
          >
            Web Assessment Agency
          </Link>
        </div>

        <div className="mt-8 rounded-lg border border-border bg-surface p-8 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight text-text">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Enter the email associated with your account.
          </p>

          <form className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium uppercase tracking-wide text-text-muted"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="ops@nordicpay.se"
                className="mt-1.5 block w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-wa-primary focus:outline-none focus:ring-1 focus:ring-wa-primary"
              />
            </div>

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
                autoComplete="current-password"
                placeholder="••••••••"
                className="mt-1.5 block w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-wa-primary focus:outline-none focus:ring-1 focus:ring-wa-primary"
              />
            </div>
          </form>

          <div className="mt-6 space-y-3">
            <Link
              href="/portal"
              className="inline-flex w-full items-center justify-center rounded-md bg-wa-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-wa-primary-dark"
            >
              Continue to dashboard
            </Link>
            <Link
              href="/portal"
              className="block text-center text-xs text-text-muted hover:text-text"
            >
              Continue as <span className="font-medium text-text">Nordicpay AB</span> (demo)
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-text-muted">
          Not a customer yet?{" "}
          <Link href="/pricing" className="text-wa-primary hover:underline">
            See pricing
          </Link>
        </p>
      </div>
    </div>
  );
}
