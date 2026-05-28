"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { Container } from "./Container";
import { useLocale } from "../i18n/LocaleProvider";

const navLinks = [
  { href: "/#what", label: "What CIP Does" },
  { href: "/#pillars", label: "Pillars" },
  { href: "/#report", label: "Sample Report" },
  { href: "/pricing", label: "Pricing" },
];

const subscribeScroll = (cb: () => void) => {
  window.addEventListener("scroll", cb, { passive: true });
  return () => window.removeEventListener("scroll", cb);
};
const getScrollSnapshot = () => window.scrollY > 4;
const getScrollServerSnapshot = () => false;

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 text-ink">
      <svg
        viewBox="0 0 40 40"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="h-7 w-7 shrink-0"
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
      <span aria-hidden className="hidden sm:block h-5 w-px bg-border-2 mx-1" />
      <span className="hidden sm:inline font-mono text-[11.5px] font-semibold uppercase tracking-[0.22em] text-muted">
        CIP
      </span>
    </Link>
  );
}

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { locale, setLocale } = useLocale();

  const scrolled = useSyncExternalStore(
    subscribeScroll,
    getScrollSnapshot,
    getScrollServerSnapshot
  );

  if (
    pathname.startsWith("/portal") ||
    pathname.startsWith("/ops") ||
    pathname.startsWith("/r/") ||
    pathname === "/login"
  )
    return null;

  const closeMenu = () => setOpen(false);

  return (
    <header
      className={`sticky top-0 z-50 bg-bg/90 backdrop-blur transition-shadow ${
        scrolled ? "shadow-sm border-b border-border" : "border-b border-transparent"
      }`}
    >
      <Container className="flex items-center justify-between h-[72px]">
        <Logo />

        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-body hover:text-sage-deep transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/reports/sample-comms-report.pdf"
            target="_blank"
            rel="noopener"
            className="text-sm font-medium px-5 py-2.5 rounded-full border border-border-2 text-ink hover:border-ink transition-colors"
          >
            View Sample Report
          </Link>
          <Link
            href="/#scan"
            className="text-sm font-medium px-5 py-2.5 rounded-full bg-sage text-white border border-sage hover:bg-sage-dark hover:border-sage-dark transition-colors"
          >
            Run Enterprise Scan
          </Link>
          <span
            className="ml-2 inline-flex overflow-hidden rounded-full border border-border text-[10px] font-semibold"
            role="group"
            aria-label="Language"
          >
            <button
              type="button"
              onClick={() => setLocale("sv")}
              className={`px-2 py-1 transition-colors ${
                locale === "sv"
                  ? "bg-ink text-white"
                  : "text-muted hover:text-ink"
              }`}
            >
              SV
            </button>
            <button
              type="button"
              onClick={() => setLocale("en")}
              className={`px-2 py-1 transition-colors ${
                locale === "en"
                  ? "bg-ink text-white"
                  : "text-muted hover:text-ink"
              }`}
            >
              EN
            </button>
          </span>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-ink"
        >
          <span
            aria-hidden
            className="block h-0.5 w-4 bg-current relative before:content-[''] before:absolute before:left-0 before:-top-1.5 before:h-0.5 before:w-4 before:bg-current after:content-[''] after:absolute after:left-0 after:top-1.5 after:h-0.5 after:w-4 after:bg-current"
          />
        </button>
      </Container>

      <div
        className={`md:hidden overflow-hidden border-t border-border bg-bg transition-[max-height] duration-200 ease-out ${
          open ? "max-h-[600px]" : "max-h-0"
        }`}
      >
        <Container className="flex flex-col gap-1 py-3">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={closeMenu}
              className="rounded-md px-2 py-2 text-sm text-body hover:bg-bg-soft hover:text-sage-deep"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/reports/sample-comms-report.pdf"
            target="_blank"
            rel="noopener"
            onClick={closeMenu}
            className="mt-2 text-center rounded-full border border-border-2 px-4 py-2 text-sm font-medium text-ink"
          >
            View Sample Report
          </Link>
          <Link
            href="/#scan"
            onClick={closeMenu}
            className="text-center rounded-full bg-sage px-4 py-2 text-sm font-medium text-white"
          >
            Run Enterprise Scan
          </Link>
          <span
            className="mt-3 inline-flex overflow-hidden rounded-full border border-border text-xs font-semibold self-start"
            role="group"
            aria-label="Language"
          >
            <button
              type="button"
              onClick={() => {
                setLocale("sv");
                closeMenu();
              }}
              className={`px-3 py-1.5 transition-colors ${
                locale === "sv"
                  ? "bg-ink text-white"
                  : "text-muted hover:text-ink"
              }`}
            >
              SV
            </button>
            <button
              type="button"
              onClick={() => {
                setLocale("en");
                closeMenu();
              }}
              className={`px-3 py-1.5 transition-colors ${
                locale === "en"
                  ? "bg-ink text-white"
                  : "text-muted hover:text-ink"
              }`}
            >
              EN
            </button>
          </span>
        </Container>
      </div>
    </header>
  );
}
