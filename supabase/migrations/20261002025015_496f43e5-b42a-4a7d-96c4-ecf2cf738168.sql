CREATE TABLE public.payment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('booking','order')),
  reference text NOT NULL,
  merchant_transaction_id text NOT NULL UNIQUE,
  eps_transaction_id text,
  amount_bdt integer NOT NULL CHECK (amount_bdt > 0),
  status text NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated','paid','failed','cancelled')),
  payment_method text,
  gateway_response jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_records TO authenticated;
GRANT ALL ON public.payment_records TO service_role;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_records_select_own" ON public.payment_records
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE INDEX payment_records_reference_idx ON public.payment_records (reference);
CREATE INDEX payment_records_user_idx ON public.payment_records (user_id);
CREATE TRIGGER payment_records_updated_at BEFORE UPDATE ON public.payment_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();