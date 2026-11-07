/**
 * eSIM Access (api.esimaccess.com) server client. Server-only: the access code
 * never leaves the worker. Prices from the provider are in 1/10000 USD.
 */
const BASE = "https://api.esimaccess.com/api/v1/open";

/** BDT per USD used to price plans. Change here to reprice the whole catalogue. */
export const USD_TO_BDT = 125;

export type EsimPackage = {
  code: string;
  name: string;
  locationCode: string;
  country: string;
  dataGb: number;
  days: number;
  speed: string;
  operators: string[];
  priceBdt: number;
  countries: number;
};

export type EsimProfile = {
  iccid: string | null;
  activationCode: string | null;
  qrCodeUrl: string | null;
  status: string | null;
};

type Raw = Record<string, unknown>;

function key(): string {
  const k = process.env["ESIM_API_KEY"];
  if (!k) throw new Error("eSIM provider is not configured");
  return k;
}

async function call<T = Raw>(path: string, body: Raw): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "RT-AccessCode": key(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`eSIM provider HTTP ${res.status}: ${text.slice(0, 200)}`);
  const json = JSON.parse(text) as {
    success: boolean;
    errorCode?: string;
    errorMsg?: string;
    obj?: T;
  };
  if (!json.success)
    throw new Error(`eSIM provider error ${json.errorCode}: ${json.errorMsg ?? ""}`);
  return json.obj as T;
}

export function priceBdt(retailUnits: number): number {
  return Math.ceil(((retailUnits / 10000) * USD_TO_BDT) / 10) * 10;
}

function mapPackage(p: Raw): EsimPackage {
  const nets = (p["locationNetworkList"] as Raw[] | undefined) ?? [];
  const ops = nets.flatMap((n) =>
    ((n["operatorList"] as Raw[] | undefined) ?? []).map((o) =>
      `${o["operatorName"]} ${o["networkType"] ?? ""}`.trim(),
    ),
  );
  const volume = Number(p["volume"] ?? 0);
  return {
    code: String(p["packageCode"]),
    name: String(p["name"]),
    locationCode: String(p["locationCode"] ?? p["location"] ?? ""),
    country: String(nets[0]?.["locationName"] ?? p["location"] ?? ""),
    dataGb: Math.round((volume / 1073741824) * 10) / 10,
    days: Number(p["duration"] ?? 0),
    speed: String(p["speed"] ?? ""),
    operators: [...new Set(ops)].slice(0, 4),
    priceBdt: priceBdt(Number(p["retailPrice"] ?? p["price"] ?? 0)),
    countries: Math.max(1, nets.length),
  };
}

const cache = new Map<string, { at: number; rows: EsimPackage[] }>();
const TTL = 30 * 60 * 1000;

/** Single-country plans (locationCode = ISO2). Cached 30 min per worker. */
export async function listPackages(locationCode: string): Promise<EsimPackage[]> {
  const hit = cache.get(locationCode);
  if (hit && Date.now() - hit.at < TTL) return hit.rows;
  const obj = await call<{ packageList: Raw[] }>("/package/list", {
    locationCode,
    type: "BASE",
  });
  const rows = (obj.packageList ?? [])
    .map(mapPackage)
    .filter((p) => p.priceBdt > 0 && p.countries === 1)
    .sort((a, b) => a.priceBdt - b.priceBdt);
  cache.set(locationCode, { at: Date.now(), rows });
  return rows;
}

/** Look a package up fresh from the provider so the price is never client-supplied. */
export async function getPackage(code: string): Promise<EsimPackage | null> {
  const obj = await call<{ packageList: Raw[] }>("/package/list", {
    packageCode: code,
    type: "BASE",
  });
  const p = (obj.packageList ?? []).find((x) => x["packageCode"] === code);
  return p ? mapPackage(p) : null;
}

/** Place the order. transactionId = our order reference (provider de-duplicates on it). */
export async function placeOrder(reference: string, packageCode: string): Promise<string> {
  const obj = await call<{ orderNo: string }>("/esim/order", {
    transactionId: reference,
    packageInfoList: [{ packageCode, count: 1 }],
  });
  return obj.orderNo;
}

/** Profiles are allocated asynchronously; returns null until ready. */
export async function queryProfile(orderNo: string): Promise<EsimProfile | null> {
  const obj = await call<{ esimList?: Raw[] }>("/esim/query", {
    orderNo,
    pager: { pageNum: 1, pageSize: 5 },
  });
  const e = obj.esimList?.[0];
  if (!e) return null;
  return {
    iccid: (e["iccid"] as string) ?? null,
    activationCode: (e["ac"] as string) ?? null,
    qrCodeUrl: (e["qrCodeUrl"] as string) ?? null,
    status: (e["esimStatus"] as string) ?? null,
  };
}
