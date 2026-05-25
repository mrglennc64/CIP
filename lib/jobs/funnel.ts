import * as cheerio from "cheerio";
import { fetchPage, FetchError } from "./fetch";
import type { Finding, JobResult } from "./types";
import { scoreFromFindings } from "./audit";

const CHECKOUT_KEYWORDS = [
  // English
  "checkout",
  "cart",
  "buy",
  "purchase",
  "subscribe",
  "pricing",
  "plans",
  "order",
  "payment",
  // Swedish / Nordic
  "kassa",
  "betala",
  "köp",
  "beställ",
  "spara-din",
];

const PRIMARY_CHECKOUT_PATTERN =
  /checkout|cart|order|payment|complete|\/pay\b|\/buy\b|kassa|betala|beställ|spara-din/i;

const PAYMENT_PROVIDERS = [
  { key: "stripe", pattern: /js\.stripe\.com|stripe-js|api\.stripe\.com/i },
  { key: "klarna", pattern: /klarna(?:\.com|cdn)|klarnapayments/i },
  { key: "paypal", pattern: /paypal\.com|paypalobjects/i },
  { key: "shopify", pattern: /shopify\.com|cdn\.shopify/i },
  { key: "swish", pattern: /swish-handel|swishpayments/i },
  { key: "adyen", pattern: /adyen\.com|adyencheckout/i },
];

const STRIPE_KEY_PATTERN = /pk_(live|test)_[A-Za-z0-9]{12,}/;

// Visible error/unavailable hints (English + Swedish)
const CHECKOUT_ERROR_HINTS = [
  /could not load/i,
  /failed to load/i,
  /unavailable/i,
  /try again later/i,
  /temporarily disabled/i,
  /payment .{0,20}(failed|error)/i,
  /kunde inte/i,
  /ett fel uppstod/i,
  /något gick fel/i, // "något gick fel"
  /ogiltig/i,
  /tjänsten .{0,20}otillgänglig/i,
];

function detectProviders(html: string): string[] {
  const hits: string[] = [];
  for (const p of PAYMENT_PROVIDERS) {
    if (p.pattern.test(html) && !hits.includes(p.key)) {
      hits.push(p.key);
    }
  }
  return hits;
}

export async function runFunnel(url: string): Promise<JobResult> {
  const page = await fetchPage(url);
  const $ = cheerio.load(page.html);
  const findings: Finding[] = [];
  const origin = new URL(page.finalUrl).origin;

  // ─── Homepage signals ──────────────────────────────────────────────────
  const homepageProviders = detectProviders(page.html);
  if (homepageProviders.length > 0) {
    findings.push({
      severity: "ok",
      label: `Payment provider on homepage: ${homepageProviders.join(", ")}`,
    });
  }

  // Find checkout-style links on the homepage
  const checkoutLinks = new Set<string>();
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const text = $(el).text().toLowerCase();
    const lower = href.toLowerCase();
    if (
      CHECKOUT_KEYWORDS.some((k) => lower.includes(k) || text.includes(k))
    ) {
      try {
        const u = new URL(href, page.finalUrl);
        if (u.origin === origin) checkoutLinks.add(u.toString().split("#")[0]);
      } catch {
        // ignore
      }
    }
  });

  // Prefer primary checkout paths over generic ones (e.g. /pricing)
  const candidates = [...checkoutLinks];
  const targetCheckout =
    candidates.find((u) => PRIMARY_CHECKOUT_PATTERN.test(u)) ?? candidates[0];

  if (candidates.length === 0) {
    findings.push({
      severity: "warn",
      label: "No checkout / cart / pricing path detected from the homepage",
    });
  } else {
    findings.push({
      severity: "ok",
      label: `${candidates.length} checkout-style path(s) detected`,
      detail: candidates.slice(0, 5).join(" · "),
    });
  }

  // ─── Deep-fetch the checkout page ──────────────────────────────────────
  let checkoutStatus: number | "fetch_failed" | null = null;
  let checkoutProviders: string[] = [];
  let stripeKeyFound = false;
  let cardFormFound = false;
  let visibleErrors: string[] = [];
  let stripeRedirectButtonFound = false;

  if (targetCheckout) {
    try {
      const cp = await fetchPage(targetCheckout, { timeoutMs: 12_000 });
      checkoutStatus = cp.status;
      const $cp = cheerio.load(cp.html);

      // 1. HTTP status
      if (cp.status >= 500) {
        findings.push({
          severity: "issue",
          label: `Checkout page returns ${cp.status}`,
          detail: targetCheckout,
        });
      } else if (cp.status >= 400) {
        findings.push({
          severity: "issue",
          label: `Checkout page returns ${cp.status}`,
          detail: targetCheckout,
        });
      } else {
        findings.push({
          severity: "ok",
          label: `Checkout page reachable (HTTP ${cp.status}) · ${cp.durationMs} ms`,
          detail: targetCheckout,
        });
      }

      // 2. Payment provider scripts on the checkout page
      checkoutProviders = detectProviders(cp.html);
      if (checkoutProviders.length === 0) {
        findings.push({
          severity: "issue",
          label: "No payment provider script on the checkout page itself",
          detail:
            "Stripe / Klarna / PayPal / Shopify / Swish / Adyen — none found in HTML or scripts. Likely the integration is broken or lazy-loaded behind a button that never fires.",
        });
      } else {
        findings.push({
          severity: "ok",
          label: `Payment provider on checkout page: ${checkoutProviders.join(", ")}`,
        });
      }

      // 3. Stripe publishable key
      const keyMatch = cp.html.match(STRIPE_KEY_PATTERN);
      stripeKeyFound = !!keyMatch;
      if (
        checkoutProviders.includes("stripe") ||
        homepageProviders.includes("stripe") ||
        keyMatch
      ) {
        if (stripeKeyFound) {
          findings.push({
            severity: "ok",
            label: `Stripe publishable key present`,
            detail: `${keyMatch![0].slice(0, 20)}…`,
          });
        } else {
          findings.push({
            severity: "issue",
            label: "Stripe expected but no publishable key found in checkout HTML",
            detail:
              "If you use Stripe.js, the publishable key must be present at page load — its absence often means the integration silently fails.",
          });
        }
      }

      // 4. Card form / Stripe Elements markers
      const cardMarkers = [
        'input[name*="card"]',
        'input[autocomplete*="cc-"]',
        '[data-stripe]',
        '[id*="card-element"]',
        '[class*="card-element"]',
        '[id*="payment-element"]',
        '[class*="StripeElement"]',
      ];
      cardFormFound = cardMarkers.some((sel) => $cp(sel).length > 0);
      // Stripe Elements iframes:
      const stripeIframes = $cp('iframe[src*="js.stripe.com"]').length;

      if (cardFormFound || stripeIframes > 0) {
        findings.push({
          severity: "ok",
          label: `Card input detected${stripeIframes > 0 ? ` (${stripeIframes} Stripe iframe(s))` : ""}`,
        });
      } else if (checkoutProviders.includes("stripe")) {
        // Stripe is loaded but no card form rendered → likely runtime breakage
        findings.push({
          severity: "issue",
          label: "Stripe.js loaded but no card input on the page",
          detail:
            "The script is present but the card form did not render in HTML. Common when a JS error during Elements init prevents the iframe from mounting.",
        });
      } else {
        findings.push({
          severity: "warn",
          label: "No card form or Stripe iframe on checkout page",
        });
      }

      // 5. "Pay with Stripe" / redirect-to-Stripe-Checkout patterns.
      // Strict whole-text matching so we don't catch "Köpvillkor" (terms link).
      const payButtonRegex =
        /^(pay\b|pay now|pay with|buy now|complete (?:order|purchase|payment)|submit payment|place (?:order|my order|the order)|betala\b|betala nu|slutför (?:köp|order|beställning|betalning)|genomför (?:betalning|köp)|beställ nu|gå till kassa|to (?:checkout|payment))/i;
      const payButtonTexts = $cp("a, button")
        .toArray()
        .map((el) => $cp(el).text().trim())
        .filter(
          (t) => t.length > 0 && t.length < 60 && payButtonRegex.test(t)
        );
      stripeRedirectButtonFound = payButtonTexts.length > 0;
      if (payButtonTexts.length > 0) {
        findings.push({
          severity: "ok",
          label: `${payButtonTexts.length} pay / order CTA(s) on checkout page`,
          detail: payButtonTexts.slice(0, 3).join(" · "),
        });
      } else if (checkoutProviders.length === 0) {
        // No payment provider AND no pay button → very likely broken funnel.
        findings.push({
          severity: "issue",
          label: "No 'Pay' / 'Order' button visible on checkout page",
          detail:
            "Combined with no payment script, this strongly suggests the checkout is non-functional.",
        });
      }

      // 6. Visible error / unavailable text
      const visibleText = $cp("body").text();
      for (const re of CHECKOUT_ERROR_HINTS) {
        const m = visibleText.match(re);
        if (m) visibleErrors.push(m[0].slice(0, 80));
      }
      visibleErrors = [...new Set(visibleErrors)].slice(0, 4);
      if (visibleErrors.length > 0) {
        findings.push({
          severity: "issue",
          label: `Visible error/unavailable text on checkout page`,
          detail: visibleErrors.join(" · "),
        });
      }
    } catch (e) {
      if (e instanceof FetchError) {
        checkoutStatus = "fetch_failed";
        findings.push({
          severity: "issue",
          label: `Checkout page failed to fetch (${e.status})`,
          detail: `${targetCheckout} · ${e.message}`,
        });
      } else {
        throw e;
      }
    }
  }

  // ─── Trust signals on the homepage ─────────────────────────────────────
  const lowerHtml = page.html.toLowerCase();
  const trust = {
    https: page.finalUrl.startsWith("https://"),
    privacy: /href="[^"]*privacy/i.test(page.html) || /integritet/i.test(lowerHtml),
    terms: /href="[^"]*(terms|villkor|tos)/i.test(page.html),
    contact:
      /href="[^"]*(contact|kontakt)/i.test(page.html) ||
      /mailto:/i.test(page.html),
    refund: /(refund|return|återbetal|reklamation|ångerrätt)/i.test(lowerHtml),
  };
  const trustCount = Object.values(trust).filter(Boolean).length;
  findings.push({
    severity: trustCount >= 4 ? "ok" : trustCount >= 2 ? "warn" : "issue",
    label: `Trust signals: ${trustCount} / 5`,
    detail: Object.entries(trust)
      .map(([k, v]) => `${k}:${v ? "✓" : "✗"}`)
      .join(" · "),
  });

  // ─── Summary ───────────────────────────────────────────────────────────
  const score = scoreFromFindings(findings);
  const summary = targetCheckout
    ? `Funnel scan of ${origin}. Checkout: ${targetCheckout.replace(origin, "")} (${checkoutStatus ?? "—"}). Providers on checkout: ${checkoutProviders.join(", ") || "none"}. Trust: ${trustCount}/5.`
    : `Funnel scan of ${origin}. No checkout path detected from the homepage. Trust: ${trustCount}/5.`;

  return {
    score,
    summary,
    findings,
    details: {
      targetCheckout,
      checkoutStatus,
      homepageProviders,
      checkoutProviders,
      stripeKeyFound,
      cardFormFound,
      stripeRedirectButtonFound,
      visibleErrors,
      trust,
    },
  };
}
