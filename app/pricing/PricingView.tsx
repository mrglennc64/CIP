"use client";

import Link from "next/link";
import { Container } from "../components/Container";
import { Section } from "../components/Section";
import { pricingTiers } from "@/lib/content/pricing";
import { useLocale, useT } from "../i18n/LocaleProvider";

export function PricingView() {
  const { locale } = useLocale();
  const t = useT();
  const sv = locale === "sv";

  return (
    <Section className="pt-16">
      <Container>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text">
          {t("pricing.h1")}
        </h1>
        <p className="mt-3 max-w-2xl text-text-muted">
          {t("pricing.lead")}
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {pricingTiers.map((tier) => {
            const borderClass = tier.highlighted
              ? "border-wa-primary ring-1 ring-wa-primary"
              : "border-border";
            const ctaBase =
              "mt-6 inline-flex w-full items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium transition-colors";
            const ctaClass = tier.highlighted
              ? `${ctaBase} bg-wa-primary text-white hover:bg-wa-primary-dark`
              : `${ctaBase} border border-wa-primary text-wa-primary hover:bg-wa-primary-soft`;

            const name = sv && tier.nameSv ? tier.nameSv : tier.name;
            const price = sv && tier.priceSv ? tier.priceSv : tier.price;
            const billingCycle = sv && tier.billingCycleSv ? tier.billingCycleSv : tier.billingCycle;
            const features = sv && tier.featuresSv ? tier.featuresSv : tier.features;
            const ctaLabel = sv && tier.ctaLabelSv ? tier.ctaLabelSv : tier.ctaLabel;

            return (
              <article
                key={tier.slug}
                className={`relative rounded-lg border ${borderClass} bg-surface p-6 shadow-sm transition-transform transition-shadow duration-200 hover:-translate-y-0.5 hover:shadow-lg`}
              >
                {tier.highlighted && (
                  <span className="absolute -top-2.5 left-6 rounded-full bg-wa-primary px-2.5 py-0.5 text-xs font-medium text-white">
                    {t("pricing.mostPopular")}
                  </span>
                )}
                <h2 className="text-xl font-semibold text-text">{name}</h2>
                <p className="mt-3">
                  <span className="text-3xl font-bold text-text">{price}</span>
                  <span className="ml-1 text-sm text-text-muted">/ {billingCycle}</span>
                </p>
                <ul className="mt-5 space-y-2 text-sm text-text">
                  {features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span aria-hidden className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-wa-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={tier.ctaHref} className={ctaClass}>
                  {ctaLabel}
                </Link>
              </article>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
