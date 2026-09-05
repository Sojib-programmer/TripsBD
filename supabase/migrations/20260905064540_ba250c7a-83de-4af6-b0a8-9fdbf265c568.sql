CREATE TABLE IF NOT EXISTS public.retained_financial_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_ref text NOT NULL,
  source text NOT NULL,
  reference text,
  vertical text,
  total_bdt numeric,
  status text,
  starts_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  retain_until timestamptz NOT NULL DEFAULT (now() + interval '6 years')
);

GRANT ALL ON public.retained_financial_records TO service_role;
ALTER TABLE public.retained_financial_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY retained_financial_staff_read ON public.retained_financial_records
  FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));

CREATE INDEX IF NOT EXISTS retained_financial_user_ref_idx ON public.retained_financial_records (user_ref);
