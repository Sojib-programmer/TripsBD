import { COMPANY } from "@/lib/company";

/** Registered-operator block. Play requires real, verifiable developer details. */
export function CompanyDetails({ heading = "Registered operator" }: { heading?: string }) {
  return (
    <section className="mx-5 mt-6 rounded-2xl border border-border p-4">
      <h2 className="text-[17px] font-semibold text-foreground">{heading}</h2>
      <address className="mt-2 space-y-1 text-[15px] not-italic leading-relaxed text-muted-foreground">
        <p className="font-medium text-foreground">{COMPANY.legalName}</p>
        <p>
          Reg. No {COMPANY.registrationNo} · TIN {COMPANY.tin} · Trade Licence{" "}
          {COMPANY.tradeLicence}
        </p>
        {COMPANY.addressLines.map((line) => (
          <p key={line}>{line}</p>
        ))}
        <p>
          <a
            href={COMPANY.phoneHref}
            className="font-medium text-brand underline underline-offset-2"
          >
            {COMPANY.phone}
          </a>
          {" · "}
          <a
            href={`mailto:${COMPANY.supportEmail}`}
            className="font-medium text-brand underline underline-offset-2"
          >
            {COMPANY.supportEmail}
          </a>
        </p>
        <p className="text-[13px]">{COMPANY.incorporation}</p>
      </address>
    </section>
  );
}
