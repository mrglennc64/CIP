// Quick smoke test for the new CIP modules.
// Usage: node --import tsx tools/smoke-test.mjs <domain>
import { runDeliverability } from "../lib/jobs/deliverability.ts";
import { runInventory } from "../lib/jobs/inventory.ts";
import { runIvr } from "../lib/jobs/ivr.ts";

const url = process.argv[2] || "https://usesmpt.com";
console.log(`\n=== CIP smoke test: ${url} ===\n`);

console.log("→ Comms Surface Security (deliverability + TLS)...");
const d = await runDeliverability(url);
console.log(`  score=${d.score}, findings=${d.findings.length}`);
for (const f of d.findings) console.log(`    [${f.severity}] ${f.label}`);

console.log("\n→ Comms Surfaces Inventory (crt.sh)...");
const i = await runInventory(url);
console.log(`  score=${i.score}, findings=${i.findings.length}`);
for (const f of i.findings) console.log(`    [${f.severity}] ${f.label}`);

console.log("\n→ IVR Audit (sample)...");
const v = await runIvr(url);
console.log(`  score=${v.score}, findings=${v.findings.length}`);
for (const f of v.findings) console.log(`    [${f.severity}] ${f.label}`);

console.log("\n=== done ===\n");
