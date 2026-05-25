/**
 * Tiny shared auth for /ops/* routes.
 * Cookie value = HMAC-SHA256(OPS_AUTH_SECRET, OPS_FINGERPRINT).
 * Anyone who knows OPS_PASSWORD can authenticate; anyone who knows
 * OPS_AUTH_SECRET could forge a cookie, but both should only live
 * in your local .env.local for a single-operator install.
 */

const OPS_FINGERPRINT = "ops-authenticated-v1";

export const OPS_COOKIE = "wa_ops";

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

export async function makeCookieValue(secret: string): Promise<string> {
  return hmac(secret, OPS_FINGERPRINT);
}

export async function verifyCookieValue(
  value: string | undefined,
  secret: string
): Promise<boolean> {
  if (!value) return false;
  const expected = await hmac(secret, OPS_FINGERPRINT);
  // Constant-time comparison (best-effort in JS).
  if (value.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < value.length; i++) {
    diff |= value.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
