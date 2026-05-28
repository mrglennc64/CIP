import Link from "next/link";

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-sm text-ink hover:opacity-80"
            >
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
                <span className="text-sage font-semibold">·</span>
                <span className="text-sage font-semibold">CIP</span>
              </span>
            </Link>
            <span className="text-text-muted">/</span>
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className="inline-flex h-6 items-center rounded-md bg-sage px-2 font-mono text-[10px] font-bold uppercase tracking-wider text-white"
              >
                Ops
              </span>
              <span className="text-sm font-medium text-text">Internal tools</span>
            </span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/ops/runs" className="text-text hover:text-wa-primary">
              Runs
            </Link>
            <Link
              href="/ops/runs/new"
              className="rounded-md bg-wa-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-wa-primary-dark"
            >
              + New run
            </Link>
            <span className="h-5 w-px bg-border" aria-hidden />
            <form method="POST" action="/api/ops/logout">
              <button
                type="submit"
                className="text-xs text-text-muted hover:text-text"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
