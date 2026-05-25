import * as cheerio from "cheerio";
import { fetchPage, headOk } from "./fetch";
import type { Finding, JobResult } from "./types";
import { scoreFromFindings } from "./audit";

export async function runSeo(url: string): Promise<JobResult> {
  const page = await fetchPage(url);
  const $ = cheerio.load(page.html);
  const origin = new URL(page.finalUrl).origin;
  const findings: Finding[] = [];

  const meta = (name: string) =>
    $(`meta[name="${name}"]`).attr("content") ??
    $(`meta[property="${name}"]`).attr("content");

  const description = meta("description");
  if (!description) {
    findings.push({ severity: "issue", label: "No meta description" });
  } else if (description.length < 50 || description.length > 160) {
    findings.push({
      severity: "warn",
      label: `Meta description length ${description.length} (50–160 recommended)`,
    });
  } else {
    findings.push({ severity: "ok", label: "Meta description present", detail: description });
  }

  const ogImage = meta("og:image");
  const ogTitle = meta("og:title");
  if (!ogImage || !ogTitle) {
    findings.push({
      severity: "warn",
      label: "Open Graph tags missing or incomplete",
      detail: `og:image: ${ogImage ? "yes" : "no"} · og:title: ${ogTitle ? "yes" : "no"}`,
    });
  } else {
    findings.push({ severity: "ok", label: "Open Graph image + title present" });
  }

  const twitterCard = meta("twitter:card");
  if (twitterCard) {
    findings.push({ severity: "ok", label: `Twitter card: ${twitterCard}` });
  } else {
    findings.push({ severity: "warn", label: "No Twitter card meta" });
  }

  const jsonLd = $('script[type="application/ld+json"]').length;
  if (jsonLd > 0) {
    findings.push({ severity: "ok", label: `${jsonLd} JSON-LD block(s) found` });
  } else {
    findings.push({ severity: "warn", label: "No structured data (JSON-LD)" });
  }

  // robots.txt + sitemap
  const [robotsStatus, sitemapStatus] = await Promise.all([
    headOk(`${origin}/robots.txt`),
    headOk(`${origin}/sitemap.xml`),
  ]);
  findings.push({
    severity: robotsStatus === 200 ? "ok" : "warn",
    label: `robots.txt: ${robotsStatus || "unreachable"}`,
  });
  findings.push({
    severity: sitemapStatus === 200 ? "ok" : "warn",
    label: `sitemap.xml: ${sitemapStatus || "unreachable"}`,
  });

  // Broken-link sample: take up to 10 internal links and HEAD them.
  const internalLinks = new Set<string>();
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    try {
      const u = new URL(href, page.finalUrl);
      if (u.origin === origin && /^https?:$/.test(u.protocol)) {
        internalLinks.add(u.toString().split("#")[0]);
      }
    } catch {
      // ignore
    }
  });
  const sample = [...internalLinks].slice(0, 10);
  const statuses = await Promise.all(sample.map((u) => headOk(u)));
  const broken = sample.filter((_, i) => statuses[i] >= 400 || statuses[i] === 0);
  if (broken.length === 0 && sample.length > 0) {
    findings.push({
      severity: "ok",
      label: `Checked ${sample.length} internal links — all OK`,
    });
  } else if (broken.length > 0) {
    findings.push({
      severity: broken.length > 2 ? "issue" : "warn",
      label: `${broken.length} of ${sample.length} sampled links broken`,
      detail: broken.slice(0, 3).join(", "),
    });
  }

  const score = scoreFromFindings(findings);
  return {
    score,
    summary: `SEO scan of ${origin}. ${findings.filter((f) => f.severity === "issue").length} critical · ${findings.filter((f) => f.severity === "warn").length} watch.`,
    findings,
    details: {
      origin,
      sampledLinks: sample.length,
      brokenLinks: broken,
      jsonLdBlocks: jsonLd,
    },
  };
}
