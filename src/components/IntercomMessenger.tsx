import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { getIntercomConfig, getIntercomIdentity } from "@/lib/intercom.functions";

type IntercomFn = (command: string, settings?: Record<string, unknown>) => void;

function intercom(): IntercomFn | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { Intercom?: IntercomFn };
  return w.Intercom ?? null;
}

/** Opens the Messenger on demand (the floating launcher is hidden). Returns false if not loaded. */
export function openIntercomChat(): boolean {
  const api = intercom();
  if (!api) return false;
  api("show");
  return true;
}

function loadScript(appId: string) {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    Intercom?: IntercomFn & { q?: unknown[]; c?: (args: unknown) => void };
    intercomSettings?: Record<string, unknown>;
  };
  if (w.Intercom) return;

  const shim = function (...args: unknown[]) {
    (shim as unknown as { q: unknown[] }).q.push(args);
  } as unknown as IntercomFn & { q: unknown[] };
  shim.q = [];
  w.Intercom = shim;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://widget.intercom.io/widget/${appId}`;
  document.head.appendChild(script);
}

/**
 * Intercom Messenger with Identity Verification.
 * Signed-in visitors boot with a server-computed HMAC so sessions cannot be spoofed;
 * signing out shuts the messenger down so conversations never leak between accounts.
 */
export function IntercomMessenger() {
  const { user, loading } = useAuth();
  const fetchIdentity = useServerFn(getIntercomIdentity);
  const fetchConfig = useServerFn(getIntercomConfig);
  const [appId, setAppId] = useState<string | null>(null);

  useEffect(() => {
    void fetchConfig()
      .then((c) => setAppId(c.appId))
      .catch(() => setAppId(null));
  }, [fetchConfig]);
  const bootedUserRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!appId || loading) return;
    let cancelled = false;

    const key = user?.id ?? null;
    if (bootedUserRef.current === key) return;

    void (async () => {
      let userHash: string | null = null;
      if (user) {
        try {
          const res = await fetchIdentity();
          userHash = res.userHash;
        } catch {
          userHash = null;
        }
      }
      if (cancelled) return;

      loadScript(appId);
      const api = intercom();
      if (!api) return;

      api("shutdown");
      api("boot", {
        api_base: "https://api-iam.intercom.io",
        app_id: appId,
        hide_default_launcher: true,
        ...(user
          ? {
              user_id: user.id,
              email: user.email,
              name:
                (user.user_metadata?.["full_name"] as string | undefined) ??
                user.email?.split("@")[0],
              ...(userHash ? { user_hash: userHash } : {}),
            }
          : {}),
      });
      bootedUserRef.current = key;
    })();

    return () => {
      cancelled = true;
    };
  }, [user, loading, fetchIdentity, appId]);

  useEffect(() => {
    return () => {
      intercom()?.("shutdown");
    };
  }, []);

  return null;
}
