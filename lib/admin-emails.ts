// Email allowlist that bypasses public gates (currently: free-scan rate limit).
// Add more via env var WAR_ADMIN_EMAILS=foo@x.com,bar@y.com,…

const BAKED_IN = ["mrglenncarter@gmail.com"];

function loadEnvList(): string[] {
  const raw = process.env.WAR_ADMIN_EMAILS;
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

const adminSet = new Set<string>([
  ...BAKED_IN.map((s) => s.toLowerCase()),
  ...loadEnvList(),
]);

export function isAdminEmail(email: string): boolean {
  return adminSet.has(email.trim().toLowerCase());
}
