/** Cloudflare Realtime (Calls) SFU client. Server-only: the app token never reaches the browser. */
type Json = Record<string, unknown>;

export function callsConfigured(): boolean {
  return (
    !!process.env["CLOUDFLARE_REALTIME_APP_ID"] && !!process.env["CLOUDFLARE_REALTIME_APP_TOKEN"]
  );
}

export async function cf<T = Json>(method: "POST" | "PUT", path: string, body?: Json): Promise<T> {
  const appId = process.env["CLOUDFLARE_REALTIME_APP_ID"];
  const token = process.env["CLOUDFLARE_REALTIME_APP_TOKEN"];
  if (!appId || !token) throw new Error("Calling is not configured yet.");
  const res = await fetch(`https://rtc.live.cloudflare.com/v1/apps/${appId}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`Cloudflare Realtime ${res.status}: ${text.slice(0, 300)}`);
    throw new Error(`Call service error (${res.status})`);
  }
  const json = JSON.parse(text) as T & { errorCode?: string; errorDescription?: string };
  if (json.errorCode)
    throw new Error(`Call service error: ${json.errorDescription ?? json.errorCode}`);
  return json;
}
