"use client";

import Link from "next/link";
import { useLocale } from "@/app/i18n/LocaleProvider";

export function UnavailableClient({
  titleEn,
  titleSv,
  bodyEn,
  bodySv,
}: {
  titleEn: string;
  titleSv: string;
  bodyEn: string;
  bodySv: string;
}) {
  const { locale } = useLocale();
  const sv = locale === "sv";

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-wa-primary">
          Northern Star · CIP
        </p>
        <h1 className="mt-4 text-2xl font-bold text-text">
          {sv ? titleSv : titleEn}
        </h1>
        <p className="mt-3 text-sm text-text-muted">{sv ? bodySv : bodyEn}</p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-md border border-wa-primary px-4 py-2 text-sm font-medium text-wa-primary hover:bg-wa-primary-soft"
        >
          {sv ? "Tillbaka till startsidan" : "Back to home"}
        </Link>
      </div>
    </div>
  );
}
