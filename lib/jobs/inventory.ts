import type { Finding, JobResult } from "./types";

// Public comms-surface inventory via Certificate Transparency logs.
// Source: https://crt.sh — public CT log mirror. No active scanning of the
// target, no port probing, no credential hunting. CT logs are a public record
// of every TLS cert ever issued for a domain; we read that record and report
// what subdomains the brand has exposed publicly.

const CRTSH_TIMEOUT_MS = 12_000;
const HEAD_TIMEOUT_MS = 4_000;
const MAX_PROBE = 25;

type CrtshEntry = {
  common_name?: string;
  name_value?: string;
};

type SurfaceCategory = "marketing" | "status" | "docs" | "support" | "api" | "app" | "auth" | "other";

function categorize(host: string): SurfaceCategory {
  const h = host.toLowerCase();
  if (/^(www|web|home|landing)\b/.test(h) || h.split(".").length === 2) return "marketing";
  if (/^(status|statuspage|uptime)\b/.test(h)) return "status";
  if (/^(docs?|developer|developers|reference)\b/.test(h)) return "docs";
  if (/^(support|help|kb|faq)\b/.test(h)) return "support";
  if (/^(api|graphql|rpc)\b/.test(h)) return "api";
  if (/^(app|portal|dashboard|console)\b/.test(h)) return "app";
  if (/^(auth|login|sso|oauth|accounts?)\b/.test(h)) return "auth";
  return "other";
}

async function fetchCrtsh(domain: string): Promise<string[]> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), CRTSH_TIMEOUT_MS);
  try {
    const res = await fetch(`https://crt.sh/?q=%25.${encodeURIComponent(domain)}&output=json`, {
      signal: ac.signal,
      headers: { "User-Agent": "cip-comms-inventory" },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as CrtshEntry[];
    const set = new Set<string>();
    for (const row of json) {
      const names = [row.common_name, ...(row.name_value?.split("\n") ?? [])].filter(Boolean) as string[];
      for (const raw of names) {
        const n = raw.trim().toLowerCase();
        if (!n) continue;
        if (n.startsWith("*.")) continue;
        if (!n.endsWith(domain)) continue;
        if (n === domain) continue;
        set.add(n);
      }
    }
    return [...set].sort();
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function probeHead(host: string): Promise<{ host: string; status: number | null }> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), HEAD_TIMEOUT_MS);
  try {
    const res = await fetch(`https://${host}/`, {
      method: "HEAD",
      signal: ac.signal,
      redirect: "manual",
      headers: { "User-Agent": "cip-comms-inventory" },
    });
    return { host, status: res.status };
  } catch {
    return { host, status: null };
  } finally {
    clearTimeout(timer);
  }
}

export async function runInventory(rawUrl: string): Promise<JobResult> {
  let domain: string;
  try {
    const u = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
    domain = u.hostname.replace(/^www\./, "");
  } catch {
    return {
      score: 0,
      summary: "Could not parse URL for inventory.",
      findings: [{ severity: "issue", label: "Invalid URL", detail: rawUrl }],
    };
  }

  const subdomains = await fetchCrtsh(domain);
  const findings: Finding[] = [];

  if (subdomains.length === 0) {
    findings.push({
      severity: "warn",
      label: "No public comms surfaces detected in CT logs",
      detail: `crt.sh returned zero matching certificates for ${domain}. Either the domain is brand-new, the CT mirror is unreachable, or the brand uses only the apex.`,
    });
    return {
      score: 50,
      summary: `No public comms surfaces found for ${domain}.`,
      findings,
      details: { domain, subdomains: [], probes: [] },
    };
  }

  findings.push({
    severity: "ok",
    label: `${subdomains.length} unique public comms surface${subdomains.length === 1 ? "" : "s"} discovered`,
    detail: `Source: Certificate Transparency logs (crt.sh). Apex excluded; wildcards excluded.`,
  });

  // Probe up to MAX_PROBE for live/dead status. CT logs include retired
  // certs, so we want to know which surfaces are currently reachable.
  const toProbe = subdomains.slice(0, MAX_PROBE);
  const probes = await Promise.all(toProbe.map(probeHead));
  const live = probes.filter((p) => p.status !== null && p.status < 500);
  const dead = probes.filter((p) => p.status === null);
  const errors = probes.filter((p) => p.status !== null && p.status >= 500);

  findings.push({
    severity: "ok",
    label: `${live.length} of ${toProbe.length} surfaces respond on HTTPS`,
    detail: live.map((p) => `${p.host} (${p.status})`).join("; "),
  });

  if (dead.length > 0) {
    findings.push({
      severity: "warn",
      label: `${dead.length} surface${dead.length === 1 ? "" : "s"} unreachable`,
      detail: `${dead.map((p) => p.host).join(", ")}. Listed in CT logs but no HTTPS response — stale, retired, or internal-only.`,
    });
  }

  if (errors.length > 0) {
    findings.push({
      severity: "issue",
      label: `${errors.length} surface${errors.length === 1 ? "" : "s"} returning 5xx`,
      detail: errors.map((p) => `${p.host} (${p.status})`).join("; "),
    });
  }

  // Categorize live surfaces
  const buckets = new Map<SurfaceCategory, string[]>();
  for (const p of live) {
    const cat = categorize(p.host.replace(`.${domain}`, ""));
    if (!buckets.has(cat)) buckets.set(cat, []);
    buckets.get(cat)!.push(p.host);
  }
  const summary = [...buckets.entries()]
    .map(([cat, hosts]) => `${cat}: ${hosts.length}`)
    .join(", ");
  if (summary) {
    findings.push({
      severity: "ok",
      label: `Comms surface mix — ${summary}`,
      detail: [...buckets.entries()].map(([cat, hosts]) => `${cat}: ${hosts.join(", ")}`).join("; "),
    });
  }

  // Score: live ratio out of probed. 100 if all live, drops with dead/errors.
  const score =
    toProbe.length === 0
      ? 50
      : Math.round((live.length / toProbe.length) * 100) - errors.length * 15;

  return {
    score: Math.max(0, Math.min(100, score)),
    summary: `${subdomains.length} surface${subdomains.length === 1 ? "" : "s"} in CT logs. ${live.length} live, ${dead.length} unreachable, ${errors.length} errored.`,
    findings,
    details: {
      domain,
      totalInCtLogs: subdomains.length,
      probed: toProbe.length,
      probes,
      buckets: Object.fromEntries(buckets),
    },
  };
}
