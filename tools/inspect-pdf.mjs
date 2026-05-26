import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

const parser = new PDFParse({ data: fs.readFileSync("public/reports/cip-www-vonage-com-real.pdf") });
const d = await parser.getText();
const text = d.text;

const cleanProbes = [
  "Meta description",
  "Open Graph",
  "No checkout",
  "GDPR",
  "HIGH IMPACT",
  "MED IMPACT",
  "FIX 48H",
  "FIX 7D",
  "Sender Authentication",
  "Voice Channel Compliance",
  "Procurement Risk Callouts",
  "Recommended Next Steps",
];
const corruptProbes = [
  "IdtpAciptien",
  "OpenvGroph",
  "AIG S IMPACT",
  "MEDIMPAGETUPIS",
  "ALITHRROPIC",
  "Moccheekout",
  "MemurtodinkRieteckezb",
  "AlGGDPROT",
];

console.log("CLEAN-STRING HITS in actual PDF text:");
for (const p of cleanProbes) {
  const re = new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
  console.log("  " + p.padEnd(28), (text.match(re) || []).length);
}
console.log("\nCORRUPT-STRING HITS in actual PDF text (should all be 0):");
for (const p of corruptProbes) {
  const re = new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
  console.log("  " + p.padEnd(28), (text.match(re) || []).length);
}
console.log("\nSample lines (60–100):");
const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
console.log(lines.slice(60, 100).join("\n"));
