import Link from "next/link";

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm font-semibold tracking-tight text-text hover:text-wa-primary"
            >
              Web Assessment Agency
            </Link>
            <span className="text-text-muted">/</span>
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className="inline-flex h-6 items-center rounded-md bg-wa-primary px-2 text-[10px] font-bold uppercase tracking-wider text-white"
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
