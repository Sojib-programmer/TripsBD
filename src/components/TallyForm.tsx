import { tallyUrl, type TallyFormKey } from "@/lib/tally";

export function TallyForm({
  form,
  title,
  prefill,
  height = 720,
}: {
  form: TallyFormKey;
  title: string;
  prefill?: Record<string, string | undefined>;
  height?: number;
}) {
  return (
    <iframe
      src={tallyUrl(form, prefill)}
      title={title}
      loading="lazy"
      width="100%"
      height={height}
      className="w-full border-0 bg-transparent"
    />
  );
}
