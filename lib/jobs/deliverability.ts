import { promises as dns } from "node:dns";
import type { Finding, JobResult } from "./types";
import { scoreFromFindings } from "./audit";

// DNS-only sender-posture checks. No mailbox access, no SMTP credentials.
// Catches the common deliverability problems that get a site's transactional
// mail flagged as spam: missing SPF / DKIM / DMARC, weak DMARC policy, IPs
// without reverse DNS, etc.

const COMMON_DKIM_SELECTORS = [
  "default",
  "google",
  "selector1",
  "selector2",
  "selector",
  "mail",
  "dkim",
  "s1",
  "s2",
  "k1",
  "k2",
  "key1",
  "key2",
  "mandrill",
  "mailgun",
  "sendgrid",
  "smtp",
  "fm1",
  "fm2",
  "fm3",
];

const ESP_HINTS: { name: string; matches: RegExp[] }[] = [
  { name: "Google Workspace", matches: [/_spf\.google\.com/i] },
  { name: "Microsoft 365", matches: [/spf\.protection\.outlook\.com/i] },
  { name: "SendGrid", matches: [/sendgrid\.net/i] },
  { name: "Mailgun", matches: [/mailgun\.org/i] },
  { name: "Postmark", matches: [/postmarkapp\.com/i, /spf\.mtasv\.net/i] },
  { name: "Amazon SES", matches: [/amazonses\.com/i] },
  { name: "Brevo (Sendinblue)", matches: [/sendinblue|brevo/i] },
  { name: "Mailchimp / Mandrill", matches: [/mailchimp|mandrillapp/i] },
  { name: "Zoho", matches: [/zoho\.(com|eu)/i] },
  { name: "FastMail", matches: [/messagingengine\.com/i] },
  { name: "Resend", matches: [/_spf\.resend\.com/i] },
];

const DNS_TIMEOUT_MS = 4000;

async function withTimeout<T>(p: Promise<T>, fallback: T): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const t = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), DNS_TIMEOUT_MS);
  });
  try {
    return await Promise.race([p, t]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function resolveTxtSafe(name: string): Promise<string[]> {
  const records = await withTimeout(dns.resolveTxt(name).catch(() => [] as string[][]), [] as string[][]);
  return records.map((r) => r.join(""));
}

async function resolveMxSafe(name: string) {
  return withTimeout(
    dns.resolveMx(name).catch(() => [] as { exchange: string; priority: number }[]),
    [] as { exchange: string; priority: number }[],
  );
}

async function resolvePtrSafe(ip: string): Promise<string[]> {
  return withTimeout(dns.reverse(ip).catch(() => [] as string[]), [] as string[]);
}

function classifyEsps(includes: string[]): string[] {
  const found = new Set<string>();
  for (const inc of includes) {
    for (const esp of ESP_HINTS) {
      if (esp.matches.some((re) => re.test(inc))) found.add(esp.name);
    }
  }
  return [...found];
}

function classifyMxProvider(exchange: string): string {
  const lower = exchange.toLowerCase();
  if (/google\.com|googlemail\.com/.test(lower)) return "Google Workspace";
  if (/protection\.outlook\.com|outlook\.com/.test(lower)) return "Microsoft 365";
  if (/zoho\.(com|eu)/.test(lower)) return "Zoho Mail";
  if (/mailgun\.org/.test(lower)) return "Mailgun";
  if (/messagingengine\.com/.test(lower)) return "FastMail";
  if (/proton(mail)?/.test(lower)) return "Proton Mail";
  if (/yandex/.test(lower)) return "Yandex";
  return exchange;
}

export async function runDeliverability(rawUrl: string): Promise<JobResult> {
  let domain: string;
  try {
    const u = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
    domain = u.hostname.replace(/^www\./, "");
  } catch {
    return {
      score: 0,
      summary: "Could not parse URL for DNS lookups.",
      findings: [{ severity: "issue", label: "Invalid URL", detail: rawUrl }],
    };
  }

  const findings: Finding[] = [];

  // Run independent lookups in parallel.
  const [apexTxt, dmarcTxt, mx, mtaStsTxt, tlsRptTxt, dkimResults] = await Promise.all([
    resolveTxtSafe(domain),
    resolveTxtSafe(`_dmarc.${domain}`),
    resolveMxSafe(domain),
    resolveTxtSafe(`_mta-sts.${domain}`),
    resolveTxtSafe(`_smtp._tls.${domain}`),
    Promise.all(
      COMMON_DKIM_SELECTORS.map(async (sel) => {
        const recs = await resolveTxtSafe(`${sel}._domainkey.${domain}`);
        const hit = recs.some((r) => /v=DKIM1/i.test(r) || /(^|;|\s)p=/i.test(r));
        return hit ? sel : null;
      }),
    ),
  ]);

  // ---------- SPF ----------
  const spfRecord = apexTxt.find((r) => /^v=spf1\b/i.test(r));
  // SPF can delegate via `redirect=<domain>`; resolve one hop so we can
  // analyze the effective record (e.g. gmail.com → _spf.google.com).
  const spfRedirectTarget = spfRecord?.match(/\bredirect=(\S+)/i)?.[1];
  let effectiveSpf = spfRecord;
  if (spfRedirectTarget) {
    const redirected = await resolveTxtSafe(spfRedirectTarget);
    const target = redirected.find((r) => /^v=spf1\b/i.test(r));
    if (target) effectiveSpf = target;
  }
  const spfIncludes = effectiveSpf
    ? [...effectiveSpf.matchAll(/include:(\S+)/gi)].map((m) => m[1])
    : [];
  // If we followed a redirect, count the redirect target as an authorized
  // sender too (it's effectively an include).
  if (spfRedirectTarget && !spfIncludes.includes(spfRedirectTarget)) {
    spfIncludes.unshift(spfRedirectTarget);
  }
  const spfEsps = classifyEsps(spfIncludes);
  const spfMechanism = effectiveSpf?.match(/[~?\-+]all\s*$/i)?.[0]?.trim();

  if (!spfRecord) {
    findings.push({
      severity: "issue",
      label: "No SPF record",
      detail: `No v=spf1 record on ${domain}. Receivers can't verify which servers may send mail from this domain — common cause of inbox-side spoof flags.`,
    });
  } else if (spfMechanism === "-all" || spfMechanism === "~all") {
    findings.push({
      severity: "ok",
      label: `SPF present (${spfMechanism})`,
      detail: spfEsps.length > 0 ? `Authorized senders: ${spfEsps.join(", ")}.` : spfRecord,
    });
  } else {
    findings.push({
      severity: "warn",
      label: `SPF present but weak policy${spfMechanism ? ` (${spfMechanism})` : " (no terminating all)"}`,
      detail: `Tighten to ~all or -all. Record: ${spfRecord}`,
    });
  }

  if (spfRecord && spfIncludes.length > 8) {
    findings.push({
      severity: "warn",
      label: `SPF has ${spfIncludes.length} include lookups`,
      detail: "SPF allows 10 DNS lookups max — risk of PermError.",
    });
  }

  // ---------- DMARC ----------
  const dmarcRecord = dmarcTxt.find((r) => /^v=DMARC1\b/i.test(r));
  const dmarcPolicy = dmarcRecord?.match(/\bp=(\w+)/i)?.[1]?.toLowerCase();
  const dmarcPct = dmarcRecord?.match(/\bpct=(\d+)/i)?.[1];
  const dmarcRua = dmarcRecord?.match(/rua=([^;\s]+)/i)?.[1];

  if (!dmarcRecord) {
    findings.push({
      severity: "issue",
      label: "No DMARC record",
      detail: `No v=DMARC1 record at _dmarc.${domain}. Receivers have no policy guidance when SPF or DKIM fails — high spoofing risk.`,
    });
  } else if (dmarcPolicy === "reject" || dmarcPolicy === "quarantine") {
    findings.push({
      severity: "ok",
      label: `DMARC policy p=${dmarcPolicy}${dmarcPct ? ` (pct=${dmarcPct})` : ""}`,
      detail: dmarcRua ? `Reports sent to: ${dmarcRua}` : dmarcRecord,
    });
  } else if (dmarcPolicy === "none") {
    findings.push({
      severity: "warn",
      label: "DMARC policy: p=none (monitor only)",
      detail: "Spoofed mail won't be quarantined or rejected. After a monitoring period, move to p=quarantine.",
    });
  } else {
    findings.push({
      severity: "warn",
      label: "DMARC record present but policy not set",
      detail: dmarcRecord,
    });
  }

  // ---------- DKIM ----------
  const dkimSelectorsFound = dkimResults.filter((s): s is string => s !== null);
  if (dkimSelectorsFound.length > 0) {
    findings.push({
      severity: "ok",
      label: `DKIM detected at selector(s): ${dkimSelectorsFound.join(", ")}`,
      detail: `Probed ${COMMON_DKIM_SELECTORS.length} common selectors.`,
    });
  } else {
    findings.push({
      severity: "warn",
      label: "No DKIM found at common selectors",
      detail: `Probed ${COMMON_DKIM_SELECTORS.length} selectors. If you use a custom selector, this check may miss it — but if mail is unsigned, it's a major deliverability gap.`,
    });
  }

  // ---------- MX ----------
  let mxProvider: string | undefined;
  if (mx.length === 0) {
    findings.push({
      severity: "issue",
      label: "No MX records — domain cannot receive mail",
      detail: `No MX records on ${domain}. Reply-to addresses on this domain will bounce.`,
    });
  } else {
    const top = [...mx].sort((a, b) => a.priority - b.priority)[0];
    mxProvider = classifyMxProvider(top.exchange);
    findings.push({
      severity: "ok",
      label: `MX configured · receiver: ${mxProvider}`,
      detail: `Top MX: ${top.exchange} (priority ${top.priority}).`,
    });
  }

  // ---------- MTA-STS ----------
  const mtaSts = mtaStsTxt.find((r) => /v=STSv1/i.test(r));
  if (mtaSts) {
    findings.push({ severity: "ok", label: "MTA-STS record present" });
  } else if (mx.length > 0) {
    findings.push({
      severity: "warn",
      label: "No MTA-STS record",
      detail: "Optional but recommended — enforces TLS on inbound mail.",
    });
  }

  // ---------- TLS-RPT (informational only) ----------
  const tlsRpt = tlsRptTxt.find((r) => /v=TLSRPTv1/i.test(r));
  if (tlsRpt) {
    findings.push({ severity: "ok", label: "TLS-RPT record present" });
  }

  // ---------- Reverse DNS on SPF ip4: entries (best-effort) ----------
  const spfIp4s = spfRecord
    ? [...spfRecord.matchAll(/\bip4:(\S+)/gi)].map((m) => m[1].split("/")[0])
    : [];
  const ipChecks: { ip: string; ptr: string[] }[] = [];
  for (const ip of spfIp4s.slice(0, 3)) {
    if (!/^\d+\.\d+\.\d+\.\d+$/.test(ip)) continue;
    const ptr = await resolvePtrSafe(ip);
    ipChecks.push({ ip, ptr });
    if (ptr.length === 0) {
      findings.push({
        severity: "warn",
        label: `SPF-listed IP ${ip} has no PTR record`,
        detail:
          "Most receivers reject or heavily penalize mail from IPs without matching reverse DNS. If this IP is your sending server, add a PTR record at the hosting provider.",
      });
    }
  }

  // Deterministic "fix-it" DNS records. Built from what's missing or weak;
  // intentionally bypasses any LLM rewrite layer so the operator can paste
  // them straight into their DNS panel.
  type DnsRecommendation = {
    kind: "TXT" | "PTR" | "FILE";
    host: string;
    value: string;
    rationale: string;
  };
  const recommendedRecords: DnsRecommendation[] = [];

  if (!spfRecord) {
    recommendedRecords.push({
      kind: "TXT",
      host: domain,
      value: "v=spf1 include:<your-mail-sender> ~all",
      rationale: `Adds SPF so receivers can verify authorized senders. Replace <your-mail-sender> with your ESP host (e.g. _spf.google.com, sendgrid.net, spf.protection.outlook.com, _custspf.one.com).`,
    });
  } else if (!spfMechanism || spfMechanism === "?all" || spfMechanism === "+all") {
    const tightened = (effectiveSpf ?? "v=spf1").replace(/\s*[~?\-+]all\s*$/i, "") + " ~all";
    recommendedRecords.push({
      kind: "TXT",
      host: domain,
      value: tightened,
      rationale: "Adds a terminating soft-fail policy (~all). Receivers will treat mail from unauthorized senders as suspicious. Promote to -all once confident no legitimate mail uses unauthorized servers.",
    });
  }

  if (!dmarcRecord) {
    recommendedRecords.push({
      kind: "TXT",
      host: `_dmarc.${domain}`,
      value: `v=DMARC1; p=none; rua=mailto:dmarc@${domain}; fo=1`,
      rationale: `Starts DMARC in monitor mode. Aggregate reports arrive at dmarc@${domain} (create that mailbox first, or use a free aggregator like postmarkapp.com/dmarc). After ~7 days of reports, you will know which IPs send mail under this domain. Then tighten to p=quarantine.`,
    });
  } else if (dmarcPolicy === "none") {
    recommendedRecords.push({
      kind: "TXT",
      host: `_dmarc.${domain}`,
      value: dmarcRecord.replace(/\bp=none\b/i, "p=quarantine"),
      rationale: "Promotes DMARC from monitor-only to quarantine. Run p=none for at least 7 days first so legitimate senders are confirmed in the aggregate reports — otherwise real mail starts going to spam.",
    });
  }

  if (mx.length > 0 && !mtaSts) {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    recommendedRecords.push({
      kind: "TXT",
      host: `_mta-sts.${domain}`,
      value: `v=STSv1; id=${today}01`,
      rationale: `Advertises an MTA-STS policy. Also requires the policy file served at https://mta-sts.${domain}/.well-known/mta-sts.txt — contents below.`,
    });
    recommendedRecords.push({
      kind: "FILE",
      host: `https://mta-sts.${domain}/.well-known/mta-sts.txt`,
      value: [
        "version: STSv1",
        "mode: testing",
        ...mx.map((m) => `mx: ${m.exchange.replace(/\.$/, "")}`),
        "max_age: 86400",
      ].join("\n"),
      rationale: "Companion policy file for the MTA-STS TXT record. Start in mode: testing; promote to mode: enforce after a week of monitoring.",
    });
  }

  if (mx.length > 0 && !tlsRpt) {
    recommendedRecords.push({
      kind: "TXT",
      host: `_smtp._tls.${domain}`,
      value: `v=TLSRPTv1; rua=mailto:tls-reports@${domain}`,
      rationale: "Reports TLS handshake failures to your monitoring inbox. Useful once MTA-STS is in place.",
    });
  }

  for (const ipCheck of ipChecks) {
    if (ipCheck.ptr.length === 0) {
      recommendedRecords.push({
        kind: "PTR",
        host: ipCheck.ip,
        value: `mail.${domain}`,
        rationale: `Set the reverse-DNS / PTR record for ${ipCheck.ip} at your hosting provider's control panel. Most receivers reject or heavily penalize mail from IPs without matching reverse DNS.`,
      });
    }
  }

  const score = scoreFromFindings(findings);
  const summary = `DNS sender-posture for ${domain}. ${findings.filter((f) => f.severity === "issue").length} critical · ${findings.filter((f) => f.severity === "warn").length} watch · ${findings.filter((f) => f.severity === "ok").length} pass.`;

  return {
    score,
    summary,
    findings,
    details: {
      domain,
      spfRecord: spfRecord ?? null,
      spfRedirectTarget: spfRedirectTarget ?? null,
      spfEffectiveRecord: effectiveSpf ?? null,
      spfMechanism: spfMechanism ?? null,
      spfIncludes,
      spfEsps,
      dmarcRecord: dmarcRecord ?? null,
      dmarcPolicy: dmarcPolicy ?? null,
      dmarcPct: dmarcPct ?? null,
      dmarcRua: dmarcRua ?? null,
      dkimSelectorsFound,
      dkimSelectorsProbed: COMMON_DKIM_SELECTORS.length,
      mxRecords: mx,
      mxProvider: mxProvider ?? null,
      mtaSts: !!mtaSts,
      tlsRpt: !!tlsRpt,
      ipChecks,
      recommendedRecords,
    },
  };
}
