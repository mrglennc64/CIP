import puppeteer, { type Browser, type Page } from "puppeteer";
import type { Finding, JobResult } from "./types";
import { scoreFromFindings } from "./audit";

const CHECKOUT_PATTERN =
  /checkout|cart|order|payment|complete|\/pay\b|\/buy\b|kassa|betala|beställ|spara-din/i;

const PAY_BUTTON_PATTERN =
  /^(pay\b|pay now|pay with|buy now|complete (?:order|purchase|payment)|submit payment|place (?:order|my order|the order)|betala\b|betala nu|slutför (?:köp|order|beställning|betalning)|genomför (?:betalning|köp)|beställ nu|gå till kassa|to (?:checkout|payment))/i;

const STRIPE_API_HOST = "api.stripe.com";
const STRIPE_JS_HOST = "js.stripe.com";

type CapturedSignal = {
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: { url: string; status: number; statusText: string }[];
  stripeRequests: string[];
};

function makeCapture(): CapturedSignal {
  return {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    stripeRequests: [],
  };
}

function wirePageEvents(page: Page, cap: CapturedSignal) {
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (text && cap.consoleErrors.length < 20) cap.consoleErrors.push(text);
    }
  });
  page.on("pageerror", (err: unknown) => {
    if (cap.pageErrors.length >= 20) return;
    const msg = err instanceof Error ? err.message : String(err);
    cap.pageErrors.push(msg);
  });
  page.on("response", (res) => {
    const url = res.url();
    const host = (() => {
      try { return new URL(url).hostname; } catch { return ""; }
    })();
    if (host === STRIPE_JS_HOST || host === STRIPE_API_HOST) {
      if (cap.stripeRequests.length < 20)
        cap.stripeRequests.push(`${res.status()} ${url}`);
    }
    if (res.status() >= 400 && cap.failedRequests.length < 20) {
      cap.failedRequests.push({
        url,
        status: res.status(),
        statusText: res.statusText(),
      });
    }
  });
}

export async function runBrowser(url: string): Promise<JobResult> {
  const findings: Finding[] = [];
  let browser: Browser | undefined;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    findings.push({
      severity: "warn",
      label: "Puppeteer could not launch a browser",
      detail: msg,
    });
    return {
      score: 50,
      summary: "Browser checks skipped — Puppeteer launch failed.",
      findings,
      details: { launchError: msg },
    };
  }

  const detail: Record<string, unknown> = {};

  try {
    // ─── Homepage render ───────────────────────────────────────────────
    const home = await browser.newPage();
    const cap = makeCapture();
    wirePageEvents(home, cap);

    const homeStart = Date.now();
    let homeNavOk = false;
    try {
      await home.goto(url, { waitUntil: "networkidle2", timeout: 20_000 });
      homeNavOk = true;
    } catch (e) {
      findings.push({
        severity: "issue",
        label: "Homepage navigation failed in headless browser",
        detail: e instanceof Error ? e.message : String(e),
      });
    }
    const homeMs = Date.now() - homeStart;

    if (homeNavOk) {
      findings.push({
        severity: "ok",
        label: `Homepage rendered in browser (${homeMs} ms)`,
      });

      // Console errors
      if (cap.consoleErrors.length > 0 || cap.pageErrors.length > 0) {
        const total = cap.consoleErrors.length + cap.pageErrors.length;
        findings.push({
          severity: total > 5 ? "issue" : "warn",
          label: `${total} JavaScript error(s) on homepage`,
          detail: [...cap.pageErrors, ...cap.consoleErrors]
            .slice(0, 3)
            .map((e) => e.slice(0, 100))
            .join(" · "),
        });
      } else {
        findings.push({ severity: "ok", label: "No JS errors on homepage" });
      }

      // Failed network requests
      if (cap.failedRequests.length > 0) {
        findings.push({
          severity: cap.failedRequests.length > 3 ? "issue" : "warn",
          label: `${cap.failedRequests.length} failed network request(s) on homepage`,
          detail: cap.failedRequests
            .slice(0, 3)
            .map((r) => `${r.status} ${new URL(r.url).pathname}`)
            .join(" · "),
        });
      }
    }

    detail.homepage = {
      ok: homeNavOk,
      ms: homeMs,
      consoleErrors: cap.consoleErrors,
      pageErrors: cap.pageErrors,
      failedRequests: cap.failedRequests,
      stripeRequests: cap.stripeRequests,
    };

    // Discover a checkout link from the rendered DOM
    let checkoutUrl: string | undefined;
    if (homeNavOk) {
      const links: string[] = await home.evaluate(() =>
        [...document.querySelectorAll("a[href]")]
          .map((a) => (a as HTMLAnchorElement).href)
          .filter((h) => !!h)
      );
      const origin = new URL(url).origin;
      const candidates = links.filter((h) => {
        try {
          const u = new URL(h);
          return u.origin === origin && CHECKOUT_PATTERN.test(u.pathname);
        } catch {
          return false;
        }
      });
      checkoutUrl = candidates[0];
    }

    await home.close();

    // ─── Checkout page render ──────────────────────────────────────────
    if (!checkoutUrl) {
      findings.push({
        severity: "warn",
        label: "No checkout path discovered in the rendered DOM",
      });
    } else {
      const checkout = await browser.newPage();
      const capCheck = makeCapture();
      wirePageEvents(checkout, capCheck);

      const checkoutStart = Date.now();
      let checkoutNavOk = false;
      let checkoutStatus = 0;
      try {
        const resp = await checkout.goto(checkoutUrl, {
          waitUntil: "networkidle2",
          timeout: 25_000,
        });
        checkoutStatus = resp?.status() ?? 0;
        checkoutNavOk = true;
      } catch (e) {
        findings.push({
          severity: "issue",
          label: "Checkout page failed to load in browser",
          detail: `${checkoutUrl} · ${e instanceof Error ? e.message : String(e)}`,
        });
      }
      const checkoutMs = Date.now() - checkoutStart;

      if (checkoutNavOk) {
        findings.push({
          severity: checkoutStatus >= 400 ? "issue" : "ok",
          label: `Checkout page rendered in browser (HTTP ${checkoutStatus}, ${checkoutMs} ms)`,
          detail: checkoutUrl,
        });

        // Wait an extra 1.5s for lazy-loaded Stripe.js to initialize.
        await new Promise((r) => setTimeout(r, 1500));

        // Stripe iframe presence after JS settles
        const stripeIframes = await checkout.$$('iframe[src*="js.stripe.com"]');
        if (stripeIframes.length > 0) {
          findings.push({
            severity: "ok",
            label: `Stripe Elements iframe mounted (${stripeIframes.length})`,
          });
        } else if (capCheck.stripeRequests.length > 0) {
          findings.push({
            severity: "warn",
            label: "Stripe.js loaded but no Elements iframe mounted",
            detail:
              "Card fields never rendered. Common when init throws or createPaymentMethod is misconfigured.",
          });
        } else {
          findings.push({
            severity: "issue",
            label: "No Stripe activity in browser — likely broken integration",
            detail:
              "No js.stripe.com / api.stripe.com network calls and no Stripe iframe in the DOM.",
          });
        }

        // Pay-button presence after JS settles
        const buttonTexts: string[] = await checkout.evaluate(() =>
          [...document.querySelectorAll("button, a")]
            .map((el) => (el.textContent ?? "").trim())
            .filter((t) => t.length > 0 && t.length < 60)
        );
        const payButtons = buttonTexts.filter((t) =>
          PAY_BUTTON_PATTERN.test(t)
        );
        if (payButtons.length > 0) {
          findings.push({
            severity: "ok",
            label: `${payButtons.length} pay/order CTA(s) rendered in browser`,
            detail: payButtons.slice(0, 3).join(" · "),
          });
        } else {
          findings.push({
            severity: "issue",
            label: "No pay/order button rendered in browser",
            detail:
              "After full JS execution, no element with pay-button text. Operator should open the page and confirm whether checkout is actionable.",
          });
        }

        // JS errors on checkout page (the most important signal)
        if (
          capCheck.consoleErrors.length > 0 ||
          capCheck.pageErrors.length > 0
        ) {
          const total =
            capCheck.consoleErrors.length + capCheck.pageErrors.length;
          findings.push({
            severity: "issue",
            label: `${total} JavaScript error(s) on checkout page`,
            detail: [...capCheck.pageErrors, ...capCheck.consoleErrors]
              .slice(0, 3)
              .map((e) => e.slice(0, 120))
              .join(" · "),
          });
        } else {
          findings.push({
            severity: "ok",
            label: "No JS errors during checkout page load",
          });
        }

        // Failed network requests on checkout
        if (capCheck.failedRequests.length > 0) {
          findings.push({
            severity: capCheck.failedRequests.length > 3 ? "issue" : "warn",
            label: `${capCheck.failedRequests.length} failed network request(s) on checkout`,
            detail: capCheck.failedRequests
              .slice(0, 3)
              .map((r) => {
                try {
                  return `${r.status} ${new URL(r.url).hostname}${new URL(r.url).pathname}`;
                } catch {
                  return `${r.status} ${r.url}`;
                }
              })
              .join(" · "),
          });
        }

        // Stripe request log
        if (capCheck.stripeRequests.length > 0) {
          findings.push({
            severity: "ok",
            label: `${capCheck.stripeRequests.length} Stripe request(s) observed`,
          });
        }
      }

      detail.checkout = {
        url: checkoutUrl,
        ok: checkoutNavOk,
        status: checkoutStatus,
        ms: checkoutMs,
        consoleErrors: capCheck.consoleErrors,
        pageErrors: capCheck.pageErrors,
        failedRequests: capCheck.failedRequests,
        stripeRequests: capCheck.stripeRequests,
      };

      await checkout.close();
    }

    const score = scoreFromFindings(findings);
    return {
      score,
      summary: `Headless render: homepage ${homeNavOk ? "ok" : "failed"}${checkoutUrl ? " · checkout " + checkoutUrl.replace(new URL(url).origin, "") : ""}.`,
      findings,
      details: detail,
    };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
