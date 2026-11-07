import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { VerticalHeader } from "@/components/VerticalHeader";
import { supabase } from "@/integrations/supabase/client";
import { callStatus, joinCall, pullTracks, pushTracks, renegotiate } from "@/lib/calls.functions";

export const Route = createFileRoute("/call/$reference")({
  component: CallPage,
  head: () => ({
    meta: [
      { title: "Voice call with Trips.bd support" },
      { name: "description", content: "Talk to the Trips.bd team about your booking, in the app." },
      { property: "og:title", content: "Voice call — Trips.bd" },
      { property: "og:description", content: "In-app voice call about your booking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type Peer = { sessionId: string; trackName: string; role: string };
type Phase = "idle" | "connecting" | "live" | "error";

function CallPage() {
  const { reference } = Route.useParams();
  const room = reference.toUpperCase();
  const statusFn = useServerFn(callStatus);
  const joinFn = useServerFn(joinCall);
  const pushFn = useServerFn(pushTracks);
  const pullFn = useServerFn(pullTracks);
  const renegFn = useServerFn(renegotiate);
  const status = useQuery({ queryKey: ["call-status"], queryFn: () => statusFn() });

  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [others, setOthers] = useState<Peer[]>([]);
  const pc = useRef<RTCPeerConnection | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const channel = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pulled = useRef(new Set<string>());
  const audioBox = useRef<HTMLDivElement>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  const hangUp = () => {
    void channel.current?.unsubscribe();
    channel.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    pc.current?.close();
    pc.current = null;
    pulled.current.clear();
    if (audioBox.current) audioBox.current.innerHTML = "";
    setOthers([]);
    setPhase("idle");
  };
  useEffect(() => hangUp, []);

  async function start() {
    setError(null);
    setPhase("connecting");
    try {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = mic;
      const { sessionId, role } = await joinFn({ data: { room } });
      const conn = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.cloudflare.com:3478" }],
        bundlePolicy: "max-bundle",
      });
      pc.current = conn;
      conn.ontrack = (ev) => {
        const el = document.createElement("audio");
        el.autoplay = true;
        el.srcObject = new MediaStream([ev.track]);
        audioBox.current?.appendChild(el);
      };
      const track = mic.getAudioTracks()[0]!;
      const tx = conn.addTransceiver(track, { direction: "sendonly" });
      const offer = await conn.createOffer();
      await conn.setLocalDescription(offer);
      const trackName = `a${crypto.randomUUID().replace(/-/g, "")}`;
      const { sdp } = await pushFn({
        data: { room, sessionId, sdp: offer.sdp!, tracks: [{ mid: tx.mid!, trackName }] },
      });
      await conn.setRemoteDescription({ type: "answer", sdp });

      const pull = (peer: Peer) =>
        (queue.current = queue.current.then(async () => {
          if (pulled.current.has(peer.sessionId) || !pc.current) return;
          pulled.current.add(peer.sessionId);
          const r = await pullFn({
            data: { room, sessionId, remoteSessionId: peer.sessionId, trackNames: [peer.trackName] },
          });
          if (r.sdp && r.renegotiate) {
            await conn.setRemoteDescription({ type: "offer", sdp: r.sdp });
            const answer = await conn.createAnswer();
            await conn.setLocalDescription(answer);
            await renegFn({ data: { room, sessionId, sdp: answer.sdp! } });
          }
        }).catch((e) => setError(e instanceof Error ? e.message : String(e))));

      const ch = supabase.channel(`call:${room}`, { config: { presence: { key: sessionId } } });
      channel.current = ch;
      ch.on("presence", { event: "sync" }, () => {
        const peers = Object.values(ch.presenceState<Peer>())
          .flat()
          .filter((p) => p.sessionId !== sessionId);
        setOthers(peers);
        peers.forEach(pull);
      });
      ch.subscribe((s) => {
        if (s === "SUBSCRIBED") void ch.track({ sessionId, trackName, role });
      });
      setPhase("live");
    } catch (e) {
      hangUp();
      setPhase("error");
      setError(
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "Microphone permission is needed for the call."
          : e instanceof Error
            ? e.message
            : String(e),
      );
    }
  }

  const toggleMute = () => {
    const t = stream.current?.getAudioTracks()[0];
    if (!t) return;
    t.enabled = muted;
    setMuted(!muted);
  };

  const otherLabel = others.length
    ? others.map((o) => (o.role === "staff" ? "Trips.bd team" : "Traveller")).join(", ")
    : "Waiting for the other side to join…";

  return (
    <AppShell>
      <VerticalHeader title="Voice call" summary={`Booking ${room}`} />
      <div className="space-y-5 px-5 py-8 text-center">
        <h1 className="text-[22px] font-bold text-foreground">Talk to us about {room}</h1>
        {status.data && !status.data.enabled ? (
          <p className="text-[15px] text-muted-foreground">
            In-app calling isn’t switched on yet. Use{" "}
            <Link to="/support" className="text-brand underline">
              Help Centre chat
            </Link>{" "}
            instead.
          </p>
        ) : phase === "live" ? (
          <>
            <p className="text-[16px] text-foreground">{otherLabel}</p>
            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? "Unmute" : "Mute"}
                className="flex h-16 w-16 items-center justify-center rounded-full border border-border text-foreground"
              >
                {muted ? <MicOff /> : <Mic />}
              </button>
              <button
                type="button"
                onClick={hangUp}
                aria-label="Hang up"
                className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
              >
                <PhoneOff />
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => void start()}
            disabled={phase === "connecting" || !status.data}
            className="mx-auto flex items-center justify-center gap-2 rounded-full bg-brand px-8 py-4 text-[17px] font-semibold text-brand-foreground disabled:opacity-60"
          >
            {phase === "connecting" ? <Loader2 className="animate-spin" /> : <Phone />}
            Start call
          </button>
        )}
        {error ? (
          <p role="alert" className="text-[14px] text-destructive">
            {error}
          </p>
        ) : null}
        <p className="text-[13px] text-muted-foreground">
          Calls are voice only and aren’t recorded. Only you and our team can join.
        </p>
        <div ref={audioBox} className="hidden" />
      </div>
    </AppShell>
  );
}
