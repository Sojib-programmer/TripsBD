ALTER TABLE public.deletion_requests
  ADD COLUMN IF NOT EXISTS processed_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS note text;

CREATE TABLE IF NOT EXISTS public.deletion_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid,
  user_ref text NOT NULL,
  email_hash text NOT NULL,
  deleted_counts jsonb NOT NULL DEFAULT '{}'::jsonb,
  retained_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.deletion_audit TO service_role;
ALTER TABLE public.deletion_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY deletion_audit_staff_read ON public.deletion_audit
  FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
