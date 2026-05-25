import * as cheerio from "cheerio";
import { fetchPage } from "./fetch";
import type { Finding, JobResult } from "./types";

export async function runAudit(url: string): Promise<JobResult> {
  const page = await fetchPage(url);
  const $ = cheerio.load(page.html);

  const findings: Finding[] = [];

  const title = $("head > title").first().text().trim();
  if (!title) {
    findings.push({ severity: "issue", label: "Missing <title>", detail: "No <title> tag found in the document head." });
  } else if (title.length < 10) {
    findings.push({ severity: "warn", label: `<title> is short (${title.length} chars)`, detail: title });
  } else {
    findings.push({ severity: "ok", label: `<title> present`, detail: title });
  }

  const h1Count = $("h1").length;
  if (h1Count === 0) {
    findings.push({ severity: "issue", label: "No <h1> on the page" });
  } else if (h1Count > 1) {
    findings.push({ severity: "warn", label: `Multiple <h1> tags (${h1Count})` });
  } else {
    findings.push({ severity: "ok", label: "Single <h1> as expected" });
  }

  const images = $("img");
  const missingAlt = images.toArray().filter((img) => {
    const alt = $(img).attr("alt");
    return alt === undefined || alt.trim() === "";
  }).length;
  if (missingAlt > 0) {
    findings.push({
      severity: missingAlt > 5 ? "issue" : "warn",
      label: `${missingAlt} of ${images.length} images missing alt text`,
    });
  } else if (images.length > 0) {
    findings.push({ severity: "ok", label: `All ${images.length} images have alt text` });
  }

  const buttons = $('button, a.btn, a[class*="button"], [role="button"]').length;
  const ctaWords = ["sign up", "get started", "buy", "subscribe", "try", "book", "contact", "start"];
  const lowerBody = $("body").text().toLowerCase();
  const ctaPresent = ctaWords.some((w) => lowerBody.includes(w));
  if (buttons === 0 && !ctaPresent) {
    findings.push({ severity: "warn", label: "No obvious CTA detected" });
  } else {
    findings.push({ severity: "ok", label: `${buttons} interactive elements detected` });
  }

  const pageBytes = new TextEncoder().encode(page.html).byteLength;
  if (pageBytes > 1_500_000) {
    findings.push({
      severity: "warn",
      label: `HTML payload is ${Math.round(pageBytes / 1024)} KB`,
      detail: "Above 1.5 MB — consider trimming inline scripts/styles.",
    });
  } else {
    findings.push({
      severity: "ok",
      label: `HTML payload ${Math.round(pageBytes / 1024)} KB · loaded in ${page.durationMs} ms`,
    });
  }

  const score = scoreFromFindings(findings);
  return {
    score,
    summary: `Crawled ${page.finalUrl}. ${findings.filter((f) => f.severity === "issue").length} critical · ${findings.filter((f) => f.severity === "warn").length} watch · ${findings.filter((f) => f.severity === "ok").length} pass.`,
    findings,
    details: {
      finalUrl: page.finalUrl,
      status: page.status,
      durationMs: page.durationMs,
      h1Count,
      imageCount: images.length,
      missingAlt,
      buttonCount: buttons,
    },
  };
}

export function scoreFromFindings(findings: Finding[]): number {
  let score = 100;
  for (const f of findings) {
    if (f.severity === "issue") score -= 15;
    else if (f.severity === "warn") score -= 5;
  }
  return Math.max(0, Math.min(100, score));
}
