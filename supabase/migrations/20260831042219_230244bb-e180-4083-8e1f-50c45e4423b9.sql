-- 1. Private schema for role helpers (not exposed to the Data API)
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, anon, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

CREATE OR REPLACE FUNCTION private.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin','ops'))
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_staff(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION private.is_staff(uuid) TO authenticated, anon, service_role;

-- 2. Repoint every policy that used the public helpers
DROP POLICY IF EXISTS bookings_own_select ON public.bookings;
CREATE POLICY bookings_own_select ON public.bookings
  FOR SELECT USING ((user_id = auth.uid()) OR private.is_staff(auth.uid()));

DROP POLICY IF EXISTS bookings_update ON public.bookings;
CREATE POLICY bookings_update ON public.bookings
  FOR UPDATE USING ((user_id = auth.uid()) OR private.is_staff(auth.uid()))
  WITH CHECK ((user_id = auth.uid()) OR private.is_staff(auth.uid()));

DROP POLICY IF EXISTS booking_events_select ON public.booking_events;
CREATE POLICY booking_events_select ON public.booking_events
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_events.booking_id
      AND (b.user_id = auth.uid() OR private.is_staff(auth.uid()))
  ));

DROP POLICY IF EXISTS orders_own_select ON public.orders;
CREATE POLICY orders_own_select ON public.orders
  FOR SELECT USING ((user_id = auth.uid()) OR private.is_staff(auth.uid()));

DROP POLICY IF EXISTS orders_update ON public.orders;
CREATE POLICY orders_update ON public.orders
  FOR UPDATE USING ((user_id = auth.uid()) OR private.is_staff(auth.uid()))
  WITH CHECK ((user_id = auth.uid()) OR private.is_staff(auth.uid()));

DROP POLICY IF EXISTS order_events_select ON public.order_events;
CREATE POLICY order_events_select ON public.order_events
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_events.order_id
      AND (o.user_id = auth.uid() OR private.is_staff(auth.uid()))
  ));

-- 3. Booking trigger must stop calling the soon-to-be-dropped public helper
CREATE OR REPLACE FUNCTION public.protect_booking_financial_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR private.is_staff(auth.uid()) THEN
    RETURN NEW;
  END IF;

  NEW.total_bdt := OLD.total_bdt;
  NEW.nights := OLD.nights;
  NEW.deal_code := OLD.deal_code;
  NEW.listing_id := OLD.listing_id;
  NEW.reference := OLD.reference;
  NEW.user_id := OLD.user_id;
  NEW.check_in := OLD.check_in;
  NEW.check_out := OLD.check_out;

  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'cancelled'::public.booking_status THEN
    RAISE EXCEPTION 'Booking status can only be changed to cancelled by the traveller';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_booking_financial_columns() FROM PUBLIC, anon, authenticated;

-- 4. Drop the API-exposed role helpers
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.is_staff(uuid);

-- 5. Same financial protection for unified orders (price / payment status tampering)
CREATE OR REPLACE FUNCTION public.protect_order_financial_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR private.is_staff(auth.uid()) THEN
    RETURN NEW;
  END IF;

  NEW.total_bdt := OLD.total_bdt;
  NEW.currency := OLD.currency;
  NEW.reference := OLD.reference;
  NEW.user_id := OLD.user_id;
  NEW.vertical := OLD.vertical;
  NEW.item_id := OLD.item_id;
  NEW.title := OLD.title;
  NEW.subtitle := OLD.subtitle;
  NEW.hero_url := OLD.hero_url;
  NEW.starts_at := OLD.starts_at;
  NEW.ends_at := OLD.ends_at;
  NEW.travellers := OLD.travellers;
  NEW.details := OLD.details;

  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'cancelled'::public.booking_status THEN
    RAISE EXCEPTION 'Order status can only be changed to cancelled by the traveller';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_order_financial_columns() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS protect_order_financial_columns_trg ON public.orders;
CREATE TRIGGER protect_order_financial_columns_trg
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.protect_order_financial_columns();