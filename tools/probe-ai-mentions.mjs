import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

const path = process.argv[2] || "public/reports/cip-rawhemp-se-real.pdf";
const parser = new PDFParse({ data: fs.readFileSync(path) });
const d = await parser.getText();
const text = d.text;

const aiTerms = ["ANTHROPIC", "Anthropic", "anthropic", "Claude", "claude", "Gemini", "GEMINI", "OpenAI", "LLM", "AI-generated", "AI generated"];
console.log("AI-mention probe in", path, ":");
let any = false;
for (const t of aiTerms) {
  const hits = (text.match(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
  if (hits > 0) any = true;
  console.log("  " + t.padEnd(16), hits);
}
console.log(any ? "\nFAILED: AI mentions still present." : "\nPASS: no AI mentions in PDF.");
