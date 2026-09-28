import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef } from "react";

import { useAuth } from "@/hooks/useAuth";
import { getIntercomIdentity } from "@/lib/intercom.functions";

const APP_ID = import.meta.env["VITE_INTERCOM_APP_ID"] as string | undefined;

type IntercomFn = (command: string, settings?: Record<string, unknown>) => void;

function intercom(): IntercomFn | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { Intercom?: IntercomFn };
  return w.Intercom ?? null;
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
  const bootedUserRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!APP_ID || loading) return;
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

      loadScript(APP_ID);
      const api = intercom();
      if (!api) return;

      api("shutdown");
      api("boot", {
        api_base: "https://api-iam.intercom.io",
        app_id: APP_ID,
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
  }, [user, loading, fetchIdentity]);

  useEffect(() => {
    return () => {
      intercom()?.("shutdown");
    };
  }, []);

  return null;
}
