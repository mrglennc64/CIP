"use client";

import { usePathname } from "next/navigation";
import { Container } from "./Container";
import { useT } from "../i18n/LocaleProvider";

export function Footer() {
  const pathname = usePathname();
  const t = useT();
  if (
    pathname.startsWith("/portal") ||
    pathname.startsWith("/ops") ||
    pathname.startsWith("/r/") ||
    pathname === "/login"
  )
    return null;

  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <Container className="flex flex-col gap-3 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-muted">
          {t("footer.tagline")}
        </p>
        <p className="text-xs text-text-muted">© {year}</p>
      </Container>
    </footer>
  );
}
