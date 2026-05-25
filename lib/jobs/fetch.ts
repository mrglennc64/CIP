/**
 * Shared URL fetcher with timeout + user-agent + size limit.
 * Used by all job implementations.
 */

export type FetchedPage = {
  finalUrl: string;
  status: number;
  contentType: string;
  html: string;
  fetchedAt: number;
  durationMs: number;
};

export class FetchError extends Error {
  constructor(public status: number | "timeout" | "network", message: string) {
    super(message);
  }
}

const UA = "WebAssessmentAgencyBot/0.1 (+https://webassessment.agency)";
const MAX_BYTES = 2_000_000; // 2 MB cap

export async function fetchPage(
  rawUrl: string,
  { timeoutMs = 10_000 }: { timeoutMs?: number } = {}
): Promise<FetchedPage> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new FetchError("network", `Not a valid URL: ${rawUrl}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new FetchError("network", `Only http(s) is supported`);
  }

  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(parsed.toString(), {
      headers: { "user-agent": UA, accept: "text/html,*/*;q=0.8" },
      redirect: "follow",
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    const msg = e instanceof Error ? e.message : String(e);
    throw new FetchError(
      controller.signal.aborted ? "timeout" : "network",
      msg
    );
  } finally {
    clearTimeout(timer);
  }

  const contentType = res.headers.get("content-type") ?? "";
  // Read up to MAX_BYTES; truncate if larger.
  const reader = res.body?.getReader();
  const decoder = new TextDecoder("utf-8");
  let html = "";
  let total = 0;
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      html += decoder.decode(value, { stream: true });
      if (total >= MAX_BYTES) {
        controller.abort();
        break;
      }
    }
    html += decoder.decode();
  } else {
    html = await res.text();
  }

  return {
    finalUrl: res.url || parsed.toString(),
    status: res.status,
    contentType,
    html,
    fetchedAt: Date.now(),
    durationMs: Date.now() - start,
  };
}

export async function headOk(url: string, timeoutMs = 5_000): Promise<number> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "user-agent": UA },
      redirect: "follow",
      signal: controller.signal,
    });
    return res.status;
  } catch {
    return 0;
  } finally {
    clearTimeout(timer);
  }
}
