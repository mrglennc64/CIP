"use client";

import { Container } from "../components/Container";
import { Section } from "../components/Section";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { services } from "@/lib/content/services";
import { useLocale, useT } from "../i18n/LocaleProvider";

export function ServicesView() {
  const { locale } = useLocale();
  const t = useT();
  const sv = locale === "sv";

  return (
    <Section className="pt-16">
      <Container>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text">
          {t("services.h1")}
        </h1>
        <p className="mt-3 max-w-2xl text-text-muted">
          {t("services.lead")}
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {services.map((s) => {
            const name = sv && s.nameSv ? s.nameSv : s.name;
            const desc = sv && s.shortDescriptionSv ? s.shortDescriptionSv : s.shortDescription;
            const features = sv && s.featuresSv ? s.featuresSv : s.features;
            return (
              <Card key={s.slug} title={name}>
                <p className="text-sm text-text-muted">{desc}</p>
                <ul className="mt-4 space-y-2 text-sm text-text">
                  {features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span aria-hidden className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-wa-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Button href="/pricing">{t("services.seePricing")}</Button>
          <Button href="/portal" variant="outline">{t("services.openDashboard")}</Button>
        </div>
      </Container>
    </Section>
  );
}
