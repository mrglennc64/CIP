/**
 * Signed share links for /ops/runs/[id] health reports.
 *
 * URL shape: /r/{runId}/{exp}/{sig}
 *   exp = unix seconds when the link stops working
 *   sig = HMAC-SHA256(OPS_AUTH_SECRET, `${runId}.${exp}`)
 *
 * Anyone holding a non-expired (runId, exp, sig) triple can fetch the PDF
 * without authenticating. To invalidate every outstanding share link at
 * once, rotate OPS_AUTH_SECRET.
 */

const enc = new TextEncoder();

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const DEFAULT_SHARE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export async function makeShareToken(
  runId: string,
  expiresAtSec: number,
  secret: string
): Promise<string> {
  return hmac(secret, `${runId}.${expiresAtSec}`);
}

export async function makeShareUrl(
  runId: string,
  secret: string,
  ttlSec: number = DEFAULT_SHARE_TTL_SECONDS
): Promise<{ path: string; expiresAt: number }> {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSec;
  const sig = await makeShareToken(runId, expiresAt, secret);
  return { path: `/r/${runId}/${expiresAt}/${sig}`, expiresAt };
}

export type VerifyResult =
  | { valid: true }
  | { valid: false; reason: "expired" | "invalid" | "malformed" };

export async function verifyShareToken(
  runId: string,
  expString: string,
  sig: string,
  secret: string
): Promise<VerifyResult> {
  // Format check
  if (
    !runId ||
    !/^\d+$/.test(expString) ||
    !/^[0-9a-f]{64}$/.test(sig)
  ) {
    return { valid: false, reason: "malformed" };
  }

  const exp = Number(expString);
  if (!Number.isFinite(exp)) return { valid: false, reason: "malformed" };

  // Expiry check first so an expired link doesn't even compute HMAC.
  if (Math.floor(Date.now() / 1000) > exp) {
    return { valid: false, reason: "expired" };
  }

  const expected = await makeShareToken(runId, exp, secret);
  // Constant-time-ish comparison.
  if (expected.length !== sig.length) return { valid: false, reason: "invalid" };
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return diff === 0 ? { valid: true } : { valid: false, reason: "invalid" };
}
