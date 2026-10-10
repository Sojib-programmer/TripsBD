/**
 * EPS (Easy Payment System, Bangladesh) gateway client.
 * Mirrors the official EPS-PG reference SDK, re-implemented with fetch + Web Crypto
 * so it runs in the Worker runtime (no axios / node crypto).
 */

type EpsEnv = {
  username: string;
  password: string;
  hashKey: string;
  merchantId: string;
  storeId: string;
  sandbox: boolean;
};

export function epsEnv(): EpsEnv | null {
  const username = process.env["EPS_USERNAME"];
  const password = process.env["EPS_PASSWORD"];
  const hashKey = process.env["EPS_HASH_KEY"];
  const merchantId = process.env["EPS_MERCHANT_ID"];
  const storeId = process.env["EPS_STORE_ID"];
  if (!username || !password || !hashKey || !merchantId || !storeId) return null;
  return {
    username,
    password,
    hashKey,
    merchantId,
    storeId,
    // Live only on explicit opt-in; anything else stays on sandbox (fail-safe).
    sandbox: !["false", "live", "production", "prod", "0"].includes(
      (process.env["EPS_SANDBOX"] ?? "true").trim().toLowerCase(),
    ),
  };
}

function base(env: EpsEnv) {
  return env.sandbox ? "https://sandboxpgapi.eps.com.bd/v1" : "https://pgapi.eps.com.bd/v1";
}

/** HMAC-SHA512(value) keyed with UTF-8 hash key, Base64 encoded. */
export async function epsHash(value: string, hashKey: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(hashKey),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(value)));
  let bin = "";
  for (const b of sig) bin += String.fromCharCode(b);
  return btoa(bin);
}

async function getToken(env: EpsEnv): Promise<string> {
  const res = await fetch(`${base(env)}/Auth/GetToken`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hash": await epsHash(env.username, env.hashKey),
    },
    body: JSON.stringify({ userName: env.username, password: env.password }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    token?: string;
    errorMessage?: string;
  };
  if (!res.ok || !data.token) {
    console.error("EPS token error", res.status, data.errorMessage);
    throw new Error("Payment service unavailable");
  }
  return data.token;
}

export function newMerchantTransactionId() {
  // Digits only, >= 10 chars, unique per attempt.
  const rand = crypto.getRandomValues(new Uint32Array(1))[0]! % 1000;
  return `${Date.now()}${String(rand).padStart(3, "0")}`;
}

export type InitInput = {
  merchantTransactionId: string;
  customerOrderId: string;
  amount: number;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  productName: string;
  ipAddress?: string | undefined;
};

export async function epsInitialize(env: EpsEnv, i: InitInput): Promise<string> {
  const token = await getToken(env);
  const body = {
    merchantId: env.merchantId,
    storeId: env.storeId,
    CustomerOrderId: i.customerOrderId,
    merchantTransactionId: i.merchantTransactionId,
    transactionTypeId: 1,
    financialEntityId: 0,
    transitionStatusId: 0,
    totalAmount: i.amount,
    ipAddress: i.ipAddress || "0.0.0.0",
    version: "1",
    successUrl: i.successUrl,
    failUrl: i.failUrl,
    cancelUrl: i.cancelUrl,
    customerName: i.customerName,
    customerEmail: i.customerEmail,
    CustomerAddress: "Bangladesh",
    CustomerAddress2: "",
    CustomerCity: "Dhaka",
    CustomerState: "Dhaka",
    CustomerPostcode: "1000",
    CustomerCountry: "BD",
    CustomerPhone: i.customerPhone,
    ShipmentName: "",
    ShipmentAddress: "",
    ShipmentAddress2: "",
    ShipmentCity: "",
    ShipmentState: "",
    ShipmentPostcode: "",
    ShipmentCountry: "",
    ValueA: i.customerOrderId,
    ValueB: "",
    ValueC: "",
    ValueD: "",
    ShippingMethod: "NO",
    NoOfItem: "1",
    ProductName: i.productName.slice(0, 120),
    ProductProfile: "general",
    ProductCategory: "travel",
    ProductList: [],
  };
  const res = await fetch(`${base(env)}/EPSEngine/InitializeEPS`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hash": await epsHash(i.merchantTransactionId, env.hashKey),
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as {
    RedirectURL?: string;
    ErrorMessage?: string;
  };
  if (!res.ok || !data.RedirectURL) {
    console.error("EPS init error", res.status, data.ErrorMessage);
    throw new Error("Could not start the payment. Please try again.");
  }
  return data.RedirectURL;
}

export type EpsVerify = {
  status: "paid" | "failed" | "pending";
  amount: number | null;
  epsTransactionId: string | null;
  method: string | null;
  raw: Record<string, unknown>;
};

/** Server-to-server status check; the only source of truth for "paid". */
export async function epsVerify(env: EpsEnv, merchantTransactionId: string): Promise<EpsVerify> {
  const token = await getToken(env);
  const url = `${base(env)}/EPSEngine/CheckMerchantTransactionStatus?merchantTransactionId=${encodeURIComponent(merchantTransactionId)}`;
  const res = await fetch(url, {
    headers: {
      "x-hash": await epsHash(merchantTransactionId, env.hashKey),
      Authorization: `Bearer ${token}`,
    },
  });
  const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  const s = String(raw["Status"] ?? "").toLowerCase();
  const amt = Number(raw["TotalAmount"] ?? raw["totalAmount"]);
  return {
    status: s === "success" ? "paid" : s === "failed" || s === "cancelled" ? "failed" : "pending",
    amount: Number.isFinite(amt) ? amt : null,
    epsTransactionId: (raw["EpsTransactionId"] ?? raw["EPSTransactionId"] ?? null) as string | null,
    method: (raw["FinancialEntity"] ?? null) as string | null,
    raw,
  };
}
