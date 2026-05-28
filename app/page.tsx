"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useT } from "./i18n/LocaleProvider";

export default function HomePage() {
  const t = useT();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previousScanUrl, setPreviousScanUrl] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPreviousScanUrl(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/free-scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, url }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        scanUrl?: string;
        error?: string;
        daysUntilNext?: number;
        previousScanUrl?: string;
      };
      if (res.status === 201 && data.scanUrl) {
        router.push(data.scanUrl);
        return;
      }
      if (res.status === 429 && data.daysUntilNext != null) {
        setError(t("home.freeScan.errRateLimited", { days: data.daysUntilNext }));
        if (data.previousScanUrl) setPreviousScanUrl(data.previousScanUrl);
        setSubmitting(false);
        return;
      }
      setError(data.error ?? t("home.freeScan.errGeneric"));
      setSubmitting(false);
    } catch {
      setError(t("home.freeScan.errGeneric"));
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-bg pt-20 pb-24 sm:pt-24 sm:pb-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-b from-transparent to-bg-tint"
        />
        <div className="relative z-10 mx-auto w-full max-w-[1240px] px-6">
          <div className="grid gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div>
              <span className="eyebrow">Communications Intelligence Platform</span>
              <h1 className="mt-7 text-[42px] sm:text-[56px] lg:text-[68px] leading-[1.04] font-extrabold tracking-[-0.03em] text-ink">
                Your Comms Surface Has{" "}
                <span className="text-sage">Hidden Risk</span> — We&apos;ll
                Show You Where.
              </h1>
              <p className="mt-7 max-w-[560px] text-[17.5px] leading-relaxed text-muted">
                A multi-channel diagnostic system for enterprise communications
                surfaces — web, email, IVR, metadata, AI-readiness, and
                compliance posture — built for procurement and vendor-security
                workflows.
              </p>
              <div className="mt-10 grid grid-cols-3 gap-8 max-w-[440px]">
                <div>
                  <b className="block text-[36px] leading-none font-extrabold tracking-[-0.025em] text-sage">9</b>
                  <span className="mt-2.5 block font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
                    Diagnostic Channels
                  </span>
                </div>
                <div>
                  <b className="block text-[36px] leading-none font-extrabold tracking-[-0.025em] text-sage">&lt;5min</b>
                  <span className="mt-2.5 block font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
                    Enterprise Scan
                  </span>
                </div>
                <div>
                  <b className="block text-[36px] leading-none font-extrabold tracking-[-0.025em] text-sage">100%</b>
                  <span className="mt-2.5 block font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
                    Surface Coverage
                  </span>
                </div>
              </div>
            </div>

            {/* SCAN CARD — wraps the live free-scan form */}
            <div
              id="scan"
              className="rounded-3xl border border-border bg-bg p-7 shadow-[0_30px_70px_-30px_rgba(15,30,40,0.12)]"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted">
                  Comms Surface Scan
                </span>
                <span className="inline-flex items-center gap-2 text-xs font-medium text-sage-deep">
                  <span
                    aria-hidden
                    className="h-2 w-2 rounded-full bg-sage animate-pulse"
                  />
                  Ready
                </span>
              </div>
              <h3 className="mt-5 text-[22px] font-bold tracking-[-0.02em] text-ink">
                Run a free baseline scan
              </h3>
              <p className="mt-1.5 text-sm text-muted">
                We&apos;ll scan your surface across 9 channels and email you the
                report.
              </p>

              <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
                <div>
                  <label
                    htmlFor="freescan-email"
                    className="block text-[11px] font-medium uppercase tracking-wider text-muted"
                  >
                    {t("home.freeScan.emailLabel")}
                  </label>
                  <input
                    id="freescan-email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder={t("home.freeScan.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 block w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm text-ink placeholder:text-muted-2 focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage-soft"
                  />
                </div>
                <div>
                  <label
                    htmlFor="freescan-url"
                    className="block text-[11px] font-medium uppercase tracking-wider text-muted"
                  >
                    {t("home.freeScan.urlLabel")}
                  </label>
                  <input
                    id="freescan-url"
                    type="text"
                    inputMode="url"
                    required
                    placeholder={t("home.freeScan.urlPlaceholder")}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="mt-1.5 block w-full rounded-xl border border-border bg-bg px-4 py-3 font-mono text-sm text-ink placeholder:text-muted-2 focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage-soft"
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-p1-bg bg-p1-bg px-3 py-2 text-sm text-p1">
                    {error}
                    {previousScanUrl && (
                      <>
                        {" "}
                        <Link href={previousScanUrl} className="font-medium underline">
                          {t("home.freeScan.viewPrevious")}
                        </Link>
                      </>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-60"
                >
                  {submitting
                    ? t("home.freeScan.submitting")
                    : t("home.freeScan.submit")}
                  <span aria-hidden>→</span>
                </button>

                <p className="text-[11px] text-muted">
                  {t("home.freeScan.note")}
                </p>
              </form>

              <div className="mt-5 rounded-2xl bg-sage-soft p-4">
                <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] font-semibold text-sage-deep">
                  Procurement-Grade Output
                </div>
                <div className="mt-2 text-sm leading-relaxed text-ink">
                  Deterministic findings across 9 channels with a single
                  procurement-readiness score and a P1/P2/P3 remediation plan.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SURFACE COVERAGE STRIP */}
      <div className="border-y border-border bg-bg-soft py-7">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-center gap-3 px-6">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted mr-2">
            Surface Coverage
          </span>
          {["Web", "Email / Sender-Auth", "IVR", "Metadata", "AI-Interaction", "Compliance"].map(
            (tag) => (
              <span
                key={tag}
                className="rounded-full border border-border-2 bg-bg px-3.5 py-1.5 font-mono text-xs text-ink"
              >
                {tag}
              </span>
            )
          )}
        </div>
      </div>

      {/* WHAT CIP DOES */}
      <section id="what" className="bg-bg py-28">
        <div className="mx-auto w-full max-w-[1240px] px-6">
          <span className="eyebrow">01 — What CIP Does</span>
          <h2 className="mt-6 max-w-3xl text-[34px] sm:text-[44px] lg:text-[52px] leading-[1.05] font-extrabold tracking-[-0.025em] text-ink">
            A unified diagnostic layer across{" "}
            <span className="text-sage">every</span> communications surface.
          </h2>
          <p className="mt-6 max-w-[680px] text-[17px] leading-relaxed text-muted">
            Deterministic, repeatable analysis that surfaces procurement-blocking
            risk, AI-readiness gaps, and compliance failures across all channels.
          </p>

          <div className="mt-16 grid gap-5 md:grid-cols-3">
            {[
              {
                num: "/ 01",
                title: "Comms Surface Security",
                desc: "Deterministic checks across sender-authentication and transport layers.",
                items: ["SPF / DKIM / DMARC", "MTA-STS + TLSRPT", "MX posture", "TLS reachability", "Policy-file validation"],
              },
              {
                num: "/ 02",
                title: "AI-Agent Readiness",
                desc: "Ensures LLMs can parse and represent the brand reliably.",
                items: ["JSON-LD", "Open Graph", "Twitter card metadata", "CTA discoverability", "Trust-signal completeness", "Metadata drift detection"],
              },
              {
                num: "/ 03",
                title: "Enterprise Compliance Alignment",
                desc: "Cross-channel compliance posture for procurement and vendor-security reviews.",
                items: ["GDPR / recording disclosures", "IVR compliance", "Metadata integrity", "Robots / sitemap accessibility", "Structured-data completeness"],
              },
            ].map((c) => (
              <div
                key={c.title}
                className="rounded-2xl border border-border bg-bg p-8 transition hover:-translate-y-[3px] hover:border-sage hover:shadow-[0_24px_60px_-30px_rgba(15,30,40,0.15)]"
              >
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-sage-deep">
                  {c.num}
                </span>
                <h3 className="mt-4 text-[22px] font-bold leading-tight tracking-[-0.015em] text-ink">
                  {c.title}
                </h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-muted">
                  {c.desc}
                </p>
                <ul className="mt-5 flex flex-col gap-2.5">
                  {c.items.map((it) => (
                    <li
                      key={it}
                      className="flex items-baseline gap-2.5 font-mono text-[12.5px] text-ink"
                    >
                      <span aria-hidden className="text-sage font-bold">
                        +
                      </span>
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="border-y border-border bg-bg-soft py-28">
        <div className="mx-auto w-full max-w-[1240px] px-6 grid gap-16 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="eyebrow">02 — Why CIP Exists</span>
            <h2 className="mt-6 max-w-2xl text-[34px] sm:text-[44px] lg:text-[52px] leading-[1.05] font-extrabold tracking-[-0.025em] text-ink">
              Enterprise comms fail when surfaces{" "}
              <span className="text-sage">drift</span> out of alignment.
            </h2>
            <p className="mt-6 max-w-[600px] text-[17px] leading-relaxed text-muted">
              Metadata, sender-auth, and communications surfaces drift
              independently over time. CIP provides a unified diagnostic layer
              that identifies procurement-blocking risks, AI-readiness gaps, and
              compliance failures across all channels — before they reach a
              vendor-security review.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            {[
              { b: "9", s: "Channels diagnosed per scan" },
              { b: "P1/P2/P3", s: "Fix-priority classification" },
              { b: "0", s: "Marketing heuristics — deterministic only" },
              { b: "1", s: "Procurement readiness score" },
            ].map((st) => (
              <div
                key={st.s}
                className="rounded-2xl border border-border bg-bg p-7"
              >
                <b className="block text-[42px] leading-none font-extrabold tracking-[-0.025em] text-sage">
                  {st.b}
                </b>
                <span className="mt-2.5 block text-[13.5px] leading-snug text-muted">
                  {st.s}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO */}
      <section id="who" className="bg-bg py-28">
        <div className="mx-auto w-full max-w-[1240px] px-6">
          <span className="eyebrow">03 — Who Uses CIP</span>
          <h2 className="mt-6 max-w-3xl text-[34px] sm:text-[44px] lg:text-[52px] leading-[1.05] font-extrabold tracking-[-0.025em] text-ink">
            Built for teams that <span className="text-sage">evaluate</span>{" "}
            communications infrastructure.
          </h2>
          <div className="mt-14 grid gap-3.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { ic: "[ 01 ]", h: "CCaaS / UCaaS Providers" },
              { ic: "[ 02 ]", h: "Enterprise Comms Teams" },
              { ic: "[ 03 ]", h: "Vendor-Security Teams" },
              { ic: "[ 04 ]", h: "AI-Integration Teams" },
              { ic: "[ 05 ]", h: "Compliance & Procurement" },
            ].map((w) => (
              <div
                key={w.h}
                className="rounded-2xl border border-border bg-bg p-6 transition hover:border-sage hover:bg-sage-soft"
              >
                <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-sage-deep">
                  {w.ic}
                </span>
                <h4 className="mt-4 text-base font-bold leading-tight tracking-[-0.01em] text-ink">
                  {w.h}
                </h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PILLARS */}
      <section id="pillars" className="border-y border-border bg-bg-soft py-28">
        <div className="mx-auto w-full max-w-[1240px] px-6">
          <span className="eyebrow">04 — Core Pillars</span>
          <h2 className="mt-6 max-w-3xl text-[34px] sm:text-[44px] lg:text-[52px] leading-[1.05] font-extrabold tracking-[-0.025em] text-ink">
            Four readiness pillars, aggregated into{" "}
            <span className="text-sage">one</span> score.
          </h2>
          <div className="mt-14 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                tag: "CCAAS",
                h: "CCaaS Readiness",
                p: "Routing clarity, metadata completeness, and IVR integrity across contact-center surfaces.",
              },
              {
                tag: "UCAAS",
                h: "UCaaS Readiness",
                p: "Sender posture, inbox reachability, and comms-surface stability for unified communications.",
              },
              {
                tag: "AI",
                h: "AI-Interaction Readiness",
                p: "Machine-readable metadata, structured signals, and continuous drift detection.",
              },
              {
                tag: "COMPLIANCE",
                h: "Compliance Alignment",
                p: "GDPR, recording disclosures, TLS posture, and policy-file correctness.",
              },
            ].map((p) => (
              <div
                key={p.h}
                className="rounded-2xl border border-border bg-bg p-7 transition hover:border-sage"
              >
                <span className="inline-block rounded-full bg-sage-soft px-3 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-sage-deep">
                  {p.tag}
                </span>
                <h4 className="mt-4 text-[19px] font-bold tracking-[-0.01em] text-ink">
                  {p.h}
                </h4>
                <p className="mt-2.5 text-sm leading-relaxed text-muted">
                  {p.p}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="bg-bg py-28">
        <div className="mx-auto w-full max-w-[1240px] px-6">
          <span className="eyebrow">05 — How CIP Works</span>
          <h2 className="mt-6 max-w-3xl text-[34px] sm:text-[44px] lg:text-[52px] leading-[1.05] font-extrabold tracking-[-0.025em] text-ink">
            A deterministic, repeatable{" "}
            <span className="text-sage">five-stage</span> pipeline.
          </h2>
          <div className="mt-14 flex flex-col gap-3.5">
            {[
              { sn: "01", h: "Surface Enumeration", p: "Identifies all reachable comms surfaces — web, email, IVR, metadata, and API endpoints." },
              { sn: "02", h: "Channel Diagnostics", p: "Runs deterministic checks across 9 channels with no heuristic or marketing-based scoring." },
              { sn: "03", h: "Risk Classification", p: "Assigns CX Impact and Fix Priority (P1 / P2 / P3) to every finding." },
              { sn: "04", h: "Procurement Readiness Score", p: "Aggregates the CCaaS, UCaaS, AI, and Compliance pillars into a single readiness score." },
              { sn: "05", h: "Drift Detection", p: "Weekly re-scans detect metadata drift, DNS changes, CTA changes, and IVR modifications." },
            ].map((s) => (
              <div
                key={s.sn}
                className="grid items-center gap-6 sm:gap-8 rounded-2xl border border-border bg-bg p-7 transition hover:border-sage hover:bg-bg-soft sm:grid-cols-[80px_1fr_1.4fr]"
              >
                <span className="grid h-[54px] w-[54px] place-items-center rounded-full bg-sage-soft font-mono text-sm font-semibold tracking-[0.1em] text-sage-deep">
                  {s.sn}
                </span>
                <h4 className="text-[19px] font-bold tracking-[-0.015em] text-ink">
                  {s.h}
                </h4>
                <p className="text-[14.5px] leading-relaxed text-muted sm:col-span-1 col-span-2">
                  {s.p}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SAMPLE REPORT */}
      <section id="report" className="border-y border-border bg-bg-soft py-28">
        <div className="mx-auto w-full max-w-[1240px] px-6">
          <span className="eyebrow">06 — Sample Report</span>
          <h2 className="mt-6 max-w-3xl text-[34px] sm:text-[44px] lg:text-[52px] leading-[1.05] font-extrabold tracking-[-0.025em] text-ink">
            Vendor-security-ready output,{" "}
            <span className="text-sage">procurement-aligned</span> scoring.
          </h2>
          <p className="mt-6 max-w-[680px] text-[17px] leading-relaxed text-muted">
            Every scan produces a structured report graded across readiness
            dimensions, with a prioritized P1/P2/P3 remediation plan.
          </p>

          <div className="mt-14 overflow-hidden rounded-3xl border border-border bg-bg shadow-[0_30px_70px_-30px_rgba(15,30,40,0.1)]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-bg-soft px-8 py-6">
              <span className="font-mono text-[12.5px] tracking-[0.04em] text-muted">
                REPORT — <b className="text-ink font-semibold">acme-comms.example</b> · scan #4471
              </span>
              <div className="flex items-center gap-4">
                <span className="text-right font-mono text-[12.5px] tracking-[0.04em] text-muted">
                  PROCUREMENT
                  <br />
                  READINESS
                </span>
                <span
                  aria-hidden
                  className="grid h-16 w-16 place-items-center rounded-full"
                  style={{
                    background:
                      "conic-gradient(var(--sage) 0 72%, var(--line) 72% 100%)",
                  }}
                >
                  <span className="grid h-[50px] w-[50px] place-items-center rounded-full bg-bg text-[18px] font-extrabold text-ink">
                    72
                  </span>
                </span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2">
              {[
                { name: "Comms Clarity", pct: 84, color: "var(--p3)" },
                { name: "Buyer Discoverability", pct: 67, color: "var(--p2)" },
                { name: "Comms Surface Security", pct: 58, color: "var(--p2)" },
                { name: "AI-Interaction Readiness", pct: 71, color: "var(--p2)" },
                { name: "IVR Audit", pct: 90, color: "var(--p3)" },
                { name: "Drift Detection", pct: 45, color: "var(--p1)" },
              ].map((r, i, a) => (
                <div
                  key={r.name}
                  className={`flex items-center justify-between gap-4 px-8 py-5 ${
                    i % 2 === 0 ? "sm:border-r border-border" : ""
                  } ${i < a.length - 2 ? "border-b border-border" : "sm:border-b-0 border-b"}`}
                >
                  <span className="text-[14.5px] font-medium text-ink">
                    {r.name}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="relative block h-1.5 w-32 overflow-hidden rounded-full bg-border">
                      <span
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{ width: `${r.pct}%`, background: r.color }}
                      />
                    </span>
                    <span className="w-9 text-right font-mono text-xs font-semibold text-muted">
                      {r.pct}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border bg-bg-soft px-8 py-7">
              <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted">
                Procurement-Blocking Findings · Remediation Plan
              </div>
              <div className="mt-5 flex flex-col">
                {[
                  { p: "P1", badge: "bg-p1-bg text-p1", t: "MTA-STS policy missing — transport security cannot be enforced", ch: "EMAIL" },
                  { p: "P2", badge: "bg-p2-bg text-p2", t: "DMARC set to p=none — no enforcement against spoofing", ch: "SENDER-AUTH" },
                  { p: "P2", badge: "bg-p2-bg text-p2", t: "JSON-LD incomplete — 3 of 7 expected schema types present", ch: "AI-READINESS" },
                  { p: "P3", badge: "bg-p3-bg text-p3", t: "Open Graph image dimensions below recommended spec", ch: "METADATA" },
                ].map((f, i, a) => (
                  <div
                    key={f.t}
                    className={`grid items-center gap-4 py-3.5 sm:grid-cols-[52px_1fr_auto] ${
                      i < a.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <span
                      className={`rounded-md px-2 py-1 text-center font-mono text-[10.5px] font-bold tracking-[0.06em] ${f.badge}`}
                    >
                      {f.p}
                    </span>
                    <span className="text-sm text-ink">{f.t}</span>
                    <span className="font-mono text-[10.5px] font-medium tracking-[0.06em] text-muted">
                      {f.ch}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10">
            <Link
              href="/reports/sample-comms-report.pdf"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 rounded-full border border-border-2 bg-bg px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              View Full Sample Report <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* OUTPUTS */}
      <section className="bg-bg py-28">
        <div className="mx-auto w-full max-w-[1240px] px-6">
          <span className="eyebrow">07 — Enterprise Outputs</span>
          <h2 className="mt-6 max-w-3xl text-[34px] sm:text-[44px] lg:text-[52px] leading-[1.05] font-extrabold tracking-[-0.025em] text-ink">
            Structured deliverables for{" "}
            <span className="text-sage">vendor-security</span> and procurement.
          </h2>
          <div className="mt-14 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Vendor-security-ready reports",
              "Procurement-aligned scoring",
              "AI-agent readiness summary",
              "Sender-auth posture map",
              "Metadata integrity map",
              "IVR compliance snapshot",
            ].map((o) => (
              <div
                key={o}
                className="flex items-center gap-3.5 rounded-2xl border border-border bg-bg px-6 py-5 text-sm font-medium text-ink transition hover:border-sage hover:bg-sage-soft"
              >
                <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-sage" />
                {o}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-border bg-gradient-to-b from-bg-tint to-sage-soft py-32 text-center">
        <div className="mx-auto w-full max-w-[1240px] px-6">
          <span className="eyebrow">Get Started</span>
          <h2 className="mx-auto mt-6 max-w-[780px] text-[36px] sm:text-[48px] lg:text-[56px] leading-[1.05] font-extrabold tracking-[-0.025em] text-ink">
            Run a procurement-grade scan across{" "}
            <span className="text-sage">every</span> comms surface.
          </h2>
          <p className="mx-auto mt-6 max-w-[560px] text-[17px] text-muted">
            Structured, repeatable diagnostics for web, email, IVR, metadata,
            AI-readiness, and compliance posture.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3.5">
            <Link
              href="/#scan"
              className="inline-flex items-center gap-2 rounded-full bg-sage px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-sage-dark"
            >
              Run Enterprise Scan <span aria-hidden>→</span>
            </Link>
            <Link
              href="/reports/sample-comms-report.pdf"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 rounded-full border border-border-2 bg-bg px-7 py-3.5 text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              View Sample Report
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
