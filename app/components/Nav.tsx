"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { Container } from "./Container";
import { useLocale, useT } from "../i18n/LocaleProvider";

const linkDefs = [
  { href: "/services", key: "nav.services" },
  { href: "/how-it-works", key: "nav.howItWorks" },
  { href: "/pricing", key: "nav.pricing" },
  { href: "/portal", key: "nav.dashboard" },
  { href: "/reports", key: "nav.weeklyReport" },
];

const subscribeScroll = (cb: () => void) => {
  window.addEventListener("scroll", cb, { passive: true });
  return () => window.removeEventListener("scroll", cb);
};
const getScrollSnapshot = () => window.scrollY > 4;
const getScrollServerSnapshot = () => false;

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { locale, setLocale } = useLocale();
  const t = useT();

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

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  const closeMenu = () => setOpen(false);

  return (
    <header
      className={`sticky top-0 z-50 bg-surface/85 backdrop-blur transition-shadow ${
        scrolled
          ? "shadow-sm border-b border-border"
          : "border-b border-transparent"
      }`}
    >
      <Container className="flex items-center justify-between py-4">
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-text"
          onClick={closeMenu}
        >
          Web Assessment Agency
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {linkDefs.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm transition-colors ${
                isActive(l.href)
                  ? "text-wa-primary"
                  : "text-text-muted hover:text-text"
              }`}
            >
              {t(l.key)}
            </Link>
          ))}
          <Link
            href="/login"
            className="rounded-md border border-wa-primary px-3 py-1.5 text-xs font-medium text-wa-primary hover:bg-wa-primary-soft"
          >
            {t("nav.signIn")}
          </Link>
          <span
            className="inline-flex overflow-hidden rounded-md border border-border text-[11px] font-semibold"
            role="group"
            aria-label="Language"
          >
            <button
              type="button"
              onClick={() => setLocale("sv")}
              className={`px-2 py-1 transition-colors ${
                locale === "sv"
                  ? "bg-wa-primary text-white"
                  : "text-text-muted hover:text-text"
              }`}
            >
              SV
            </button>
            <button
              type="button"
              onClick={() => setLocale("en")}
              className={`px-2 py-1 transition-colors ${
                locale === "en"
                  ? "bg-wa-primary text-white"
                  : "text-text-muted hover:text-text"
              }`}
            >
              EN
            </button>
          </span>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-text"
        >
          <span
            aria-hidden
            className="block h-0.5 w-4 bg-current relative before:content-[''] before:absolute before:left-0 before:-top-1.5 before:h-0.5 before:w-4 before:bg-current after:content-[''] after:absolute after:left-0 after:top-1.5 after:h-0.5 after:w-4 after:bg-current"
          />
        </button>
      </Container>

      <div
        className={`md:hidden overflow-hidden border-t border-border bg-surface transition-[max-height] duration-200 ease-out ${
          open ? "max-h-96" : "max-h-0"
        }`}
      >
        <Container className="flex flex-col gap-1 py-3">
          {linkDefs.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={closeMenu}
              className={`rounded-md px-2 py-2 text-sm ${
                isActive(l.href)
                  ? "text-wa-primary bg-wa-primary-soft"
                  : "text-text-muted hover:text-text hover:bg-bg"
              }`}
            >
              {t(l.key)}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={closeMenu}
            className="mt-2 rounded-md border border-wa-primary px-2 py-2 text-sm font-medium text-wa-primary hover:bg-wa-primary-soft"
          >
            {t("nav.signIn")}
          </Link>
          <span
            className="mt-3 inline-flex overflow-hidden rounded-md border border-border text-xs font-semibold self-start"
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
                  ? "bg-wa-primary text-white"
                  : "text-text-muted hover:text-text"
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
                  ? "bg-wa-primary text-white"
                  : "text-text-muted hover:text-text"
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
