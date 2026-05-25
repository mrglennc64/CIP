import * as cheerio from "cheerio";
import { fetchPage } from "./fetch";
import type { Finding, JobResult } from "./types";
import { scoreFromFindings } from "./audit";

const ESP_FINGERPRINTS = [
  { key: "Klaviyo", pattern: /klaviyo\.com|static\.klaviyo/i },
  { key: "Mailchimp", pattern: /chimpstatic\.com|mailchimp/i },
  { key: "ActiveCampaign", pattern: /activehosted\.com|trackcmp\.net/i },
  { key: "HubSpot", pattern: /hs-scripts|hubspot\.com|js\.hs-/i },
  { key: "ConvertKit", pattern: /convertkit\.com|ck\.page/i },
  { key: "Brevo / Sendinblue", pattern: /sendinblue|brevo\.com/i },
  { key: "Drip", pattern: /getdrip\.com/i },
  { key: "Customer.io", pattern: /customer\.io/i },
];

export async function runEmail(url: string): Promise<JobResult> {
  const page = await fetchPage(url);
  const $ = cheerio.load(page.html);
  const findings: Finding[] = [];

  // ESP fingerprints in scripts
  const espHits: string[] = [];
  $("script[src]").each((_, el) => {
    const src = $(el).attr("src") ?? "";
    for (const esp of ESP_FINGERPRINTS) {
      if (esp.pattern.test(src) && !espHits.includes(esp.key)) {
        espHits.push(esp.key);
      }
    }
  });
  // Also scan inline script content for fingerprints
  $("script:not([src])").each((_, el) => {
    const code = $(el).text();
    for (const esp of ESP_FINGERPRINTS) {
      if (esp.pattern.test(code) && !espHits.includes(esp.key)) {
        espHits.push(esp.key);
      }
    }
  });
  if (espHits.length > 0) {
    findings.push({
      severity: "ok",
      label: `ESP detected: ${espHits.join(", ")}`,
    });
  } else {
    findings.push({
      severity: "warn",
      label: "No common ESP script detected",
      detail: "Klaviyo / Mailchimp / ActiveCampaign / HubSpot etc. not found.",
    });
  }

  // Email signup forms
  const emailInputs = $('input[type="email"]').length;
  const newsletterForms = $('form').toArray().filter((el) => {
    const txt = $(el).text().toLowerCase();
    return (
      $(el).find('input[type="email"]').length > 0 ||
      /newsletter|subscribe|signup|sign up/.test(txt)
    );
  }).length;

  if (newsletterForms > 0) {
    findings.push({
      severity: "ok",
      label: `${newsletterForms} email signup form(s) on this page`,
    });
  } else if (emailInputs > 0) {
    findings.push({
      severity: "ok",
      label: `${emailInputs} email input(s) detected`,
    });
  } else {
    findings.push({
      severity: "warn",
      label: "No email capture on this page",
      detail: "Consider a newsletter signup or lead-magnet form above the fold.",
    });
  }

  // mailto: links
  const mailtos = new Set<string>();
  $('a[href^="mailto:"]').each((_, el) => {
    const href = $(el).attr("href") ?? "";
    mailtos.add(href.slice(7).split("?")[0]);
  });
  if (mailtos.size > 0) {
    findings.push({
      severity: "ok",
      label: `${mailtos.size} contact email address(es)`,
      detail: [...mailtos].slice(0, 3).join(" · "),
    });
  } else {
    findings.push({
      severity: "warn",
      label: "No mailto: contact link found",
    });
  }

  // Privacy / consent signal (GDPR matters for Nordic audience)
  const hasPrivacy = /href="[^"]*privacy/i.test(page.html);
  const hasConsent = /consent|cookie|gdpr/i.test(page.html);
  if (hasPrivacy && hasConsent) {
    findings.push({
      severity: "ok",
      label: "Privacy + cookie/consent references present",
    });
  } else {
    findings.push({
      severity: "warn",
      label: "Privacy or consent signals missing",
      detail: `privacy:${hasPrivacy ? "✓" : "✗"} · consent:${hasConsent ? "✓" : "✗"}`,
    });
  }

  return {
    score: scoreFromFindings(findings),
    summary: `Email scan. ${espHits.length} ESP(s) · ${newsletterForms} signup form(s) · ${mailtos.size} mailto address(es).`,
    findings,
    details: { esps: espHits, newsletterForms, mailtoCount: mailtos.size },
  };
}
