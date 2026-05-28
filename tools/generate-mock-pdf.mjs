// Generates a Communications Intelligence Report PDF from a live scan, but
// rebrands the displayed hostname to a mock domain. Real findings, mock name.
// Use for sample reports linked from the landing page.
//
// Usage: npx tsx tools/generate-mock-pdf.mjs <real-url> <mock-host> [out-name]
//
// Example: tsx tools/generate-mock-pdf.mjs https://vonage.com acme-comms.example sample-comms-report

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { channels } from "../lib/jobs/types.ts";
import { runAudit } from "../lib/jobs/audit.ts";
import { runSeo } from "../lib/jobs/seo.ts";
import { runFunnel } from "../lib/jobs/funnel.ts";
import { runEmail } from "../lib/jobs/email.ts";
import { runDeliverability } from "../lib/jobs/deliverability.ts";
import { runSocial } from "../lib/jobs/social.ts";
import { runBrowser } from "../lib/jobs/browser.ts";
import { runInventory } from "../lib/jobs/inventory.ts";
import { runIvr } from "../lib/jobs/ivr.ts";
import { renderHealthReportPdf } from "../lib/pdf/health-report.tsx";

const here = dirname(fileURLToPath(import.meta.url));
const realUrl = process.argv[2] || "https://vonage.com";
const mockHost = process.argv[3] || "acme-comms.example";
const outName = process.argv[4] || "sample-comms-report";

const handlers = {
  audit: runAudit,
  seo: runSeo,
  funnel: runFunnel,
  email: runEmail,
  deliverability: runDeliverability,
  social: runSocial,
  browser: runBrowser,
  inventory: runInventory,
  ivr: runIvr,
};

const realHostname = new URL(realUrl.startsWith("http") ? realUrl : `https://${realUrl}`).hostname;
const realApex = realHostname.replace(/^www\./, "");

console.log(`\n=== Mock CIP report ===`);
console.log(`  scanning:   ${realUrl}`);
console.log(`  displaying: ${mockHost}\n`);

const jobs = {};
for (const ch of channels) jobs[ch] = { channel: ch, status: "pending" };

const run = {
  id: `cip-${Date.now().toString(36)}`,
  url: realUrl,
  hostname: realHostname,
  customer: "Sample",
  plan: "Standard",
  createdAt: new Date().toISOString(),
  jobs,
};

await Promise.all(
  channels.map(async (ch) => {
    const start = Date.now();
    try {
      const result = await handlers[ch](realUrl);
      jobs[ch] = {
        channel: ch,
        status: "done",
        startedAt: new Date(start).toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - start,
        result,
      };
      console.log(`  ✓ ${ch.padEnd(15)} score=${result.score.toString().padStart(3)} (${result.findings.length} findings)`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      jobs[ch] = {
        channel: ch,
        status: "failed",
        startedAt: new Date(start).toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - start,
        error: msg,
      };
      console.log(`  ✗ ${ch.padEnd(15)} FAILED: ${msg}`);
    }
  }),
);

// Rebrand: JSON-level string replace of every variant of the real hostname.
// Longest-first so www.<apex> is replaced before <apex>.
const variants = [realHostname, `www.${realApex}`, realApex]
  .filter((v, i, a) => a.indexOf(v) === i)
  .sort((a, b) => b.length - a.length);

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
let json = JSON.stringify(run);
for (const v of variants) {
  json = json.replace(new RegExp(escape(v), "g"), mockHost);
}
const rebranded = JSON.parse(json);
rebranded.hostname = mockHost;
rebranded.url = `https://${mockHost}`;

console.log(`\nRendering PDF...`);
const buf = await renderHealthReportPdf(rebranded);
const outPath = resolve(here, "..", "public", "reports", `${outName}.pdf`);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, buf);

console.log(`\nWrote ${outPath}\n`);
