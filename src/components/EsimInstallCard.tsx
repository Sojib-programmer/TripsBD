import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Loader2, QrCode } from "lucide-react";
import { toast } from "sonner";

import { getEsimInstall } from "@/lib/esim.functions";

/** Install QR + manual code for a paid eSIM order. Polls while the profile is issued. */
export function EsimInstallCard({ reference }: { reference: string }) {
  const fn = useServerFn(getEsimInstall);
  const q = useQuery({
    queryKey: ["esim-install", reference],
    queryFn: () => fn({ data: { reference } }),
    refetchInterval: (query) => (query.state.data?.state === "issuing" ? 8000 : false),
  });
  const d = q.data;
  if (!d || d.state === "none" || d.state === "unpaid") return null;

  return (
    <section className="rounded-2xl border-2 border-brand p-4">
      <p className="flex items-center gap-2 text-[17px] font-semibold text-foreground">
        <QrCode size={20} className="text-brand" /> Install your eSIM
      </p>
      {d.state === "ready" ? (
        <>
          {d.qrCodeUrl ? (
            <img
              src={d.qrCodeUrl}
              alt="eSIM installation QR code"
              className="mx-auto mt-3 h-56 w-56 rounded-xl bg-background p-2"
            />
          ) : null}
          <p className="mt-3 text-[13px] text-muted-foreground">Manual activation code</p>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(d.activationCode);
              toast.success("Copied");
            }}
            className="mt-1 flex w-full items-center gap-2 rounded-xl bg-muted p-3 text-left font-mono text-[13px] text-foreground"
          >
            <span className="min-w-0 flex-1 break-all">{d.activationCode}</span>
            <Copy size={16} className="shrink-0" />
          </button>
          {d.iccid ? (
            <p className="mt-2 text-[13px] text-muted-foreground">ICCID {d.iccid}</p>
          ) : null}
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-[14px] text-muted-foreground">
            <li>Connect to Wi-Fi and install before you fly.</li>
            <li>iPhone: Settings → Mobile Data → Add eSIM → Use QR code.</li>
            <li>Android: Settings → Network → SIMs → Add eSIM → Scan QR.</li>
            <li>On arrival, switch mobile data to this eSIM and turn on Data Roaming.</li>
          </ol>
          <p className="mt-2 text-[13px] text-muted-foreground">
            A QR code can usually be installed only once. Don’t delete the eSIM after installing.
          </p>
        </>
      ) : d.state === "issuing" ? (
        <p className="mt-2 flex items-center gap-2 text-[15px] text-muted-foreground">
          <Loader2 size={16} className="animate-spin" /> Issuing your eSIM — usually under a minute.
        </p>
      ) : (
        <p className="mt-2 text-[15px] text-muted-foreground">
          Your payment is safe. We’re finishing your eSIM manually and will notify you shortly — or
          contact support with reference {reference}.
        </p>
      )}
    </section>
  );
}
