// Generates a REAL Communications Intelligence Report PDF from a live scan.
// Runs every channel against the supplied URL, builds a Run record, then
// calls renderHealthReportPdf().
//
// Usage: npx tsx tools/generate-real-pdf.mjs <url> [customer-name]

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
const url = process.argv[2] || "https://usesmpt.com";
const customer = process.argv[3] || "Pilot Customer";

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

console.log(`\n=== Generating CIP report for ${url} ===\n`);

const hostname = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
const runId = `cip-${Date.now().toString(36)}`;
const createdAt = new Date().toISOString();

const jobs = {};
for (const ch of channels) {
  jobs[ch] = { channel: ch, status: "pending" };
}

const run = {
  id: runId,
  url,
  hostname,
  customer,
  plan: "Standard",
  createdAt,
  jobs,
};

console.log(`Running ${channels.length} channels in parallel...\n`);

await Promise.all(
  channels.map(async (ch) => {
    const start = Date.now();
    try {
      const result = await handlers[ch](url);
      const dur = Date.now() - start;
      jobs[ch] = {
        channel: ch,
        status: "done",
        startedAt: new Date(start).toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: dur,
        result,
      };
      console.log(`  ✓ ${ch.padEnd(15)} score=${result.score.toString().padStart(3)} (${dur}ms, ${result.findings.length} findings)`);
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

console.log(`\nRendering PDF...`);

const buf = await renderHealthReportPdf(run);
const outPath = resolve(here, "..", "public", "reports", `cip-${hostname.replace(/\W+/g, "-")}-real.pdf`);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, buf);

console.log(`\nWrote ${outPath}\n`);
