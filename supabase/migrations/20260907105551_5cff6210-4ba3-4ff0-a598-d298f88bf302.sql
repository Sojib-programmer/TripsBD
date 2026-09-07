DROP TABLE IF EXISTS public.review_helpfulness CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.payment_transactions CASCADE;
DROP TABLE IF EXISTS public.cancellation_policies CASCADE;

CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  topic text NOT NULL DEFAULT 'general',
  order_reference text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.support_messages TO authenticated;
GRANT INSERT ON public.support_messages TO anon;
GRANT ALL ON public.support_messages TO service_role;

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can send a support message"
ON public.support_messages FOR INSERT TO anon, authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users read their own support messages"
ON public.support_messages FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Staff read all support messages"
ON public.support_messages FOR SELECT TO authenticated
USING (private.is_staff(auth.uid()));

CREATE POLICY "Staff update support messages"
ON public.support_messages FOR UPDATE TO authenticated
USING (private.is_staff(auth.uid()))
WITH CHECK (private.is_staff(auth.uid()));

DROP TRIGGER IF EXISTS set_support_messages_updated_at ON public.support_messages;
CREATE TRIGGER set_support_messages_updated_at
BEFORE UPDATE ON public.support_messages
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();