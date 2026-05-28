"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "./Container";

const cols = [
  {
    head: "Platform",
    links: [
      { href: "/#what", label: "Comms Surface Security" },
      { href: "/#what", label: "AI-Interaction Readiness" },
      { href: "/#report", label: "IVR Audit" },
      { href: "/#how", label: "Drift Detection" },
    ],
  },
  {
    head: "Pillars",
    links: [
      { href: "/#pillars", label: "CCaaS Readiness" },
      { href: "/#pillars", label: "UCaaS Readiness" },
      { href: "/#pillars", label: "AI-Interaction" },
      { href: "/#pillars", label: "Compliance" },
    ],
  },
  {
    head: "Company",
    links: [
      { href: "/#who", label: "Who Uses CIP" },
      { href: "/pricing", label: "Pricing" },
      { href: "/#scan", label: "Run Enterprise Scan" },
      { href: "/reports/sample-comms-report.pdf", label: "Sample Report", external: true },
      { href: "/login", label: "Sign in" },
    ],
  },
];

export function Footer() {
  const pathname = usePathname();
  if (
    pathname.startsWith("/portal") ||
    pathname.startsWith("/ops") ||
    pathname.startsWith("/r/") ||
    pathname === "/login"
  )
    return null;

  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-border bg-bg">
      <Container className="py-16">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-3 text-ink">
              <svg
                viewBox="0 0 40 40"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className="h-7 w-7"
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
              <span className="flex items-baseline gap-1.5 text-base font-bold tracking-tight">
                <span className="font-extrabold">Northern&nbsp;Star</span>
                <span className="text-sage font-semibold">Systems</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Communications Intelligence Platform. Structured, repeatable
              comms-surface diagnostics for the enterprise.
            </p>
          </div>

          {cols.map((col) => (
            <div key={col.head}>
              <h5 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted">
                {col.head}
              </h5>
              <ul className="mt-5 flex flex-col gap-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      {...("external" in l && l.external
                        ? { target: "_blank", rel: "noopener" }
                        : {})}
                      className="text-sm text-body hover:text-sage-deep transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 border-t border-border pt-6 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
          <span>© {year} Northern Star Systems — CIP</span>
          <span>Deterministic · Repeatable · Procurement-Grade</span>
        </div>
      </Container>
    </footer>
  );
}
