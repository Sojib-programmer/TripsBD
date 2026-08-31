CREATE OR REPLACE FUNCTION public.protect_booking_financial_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_staff(auth.uid()) OR auth.uid() IS NULL THEN
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

  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'cancelled'::booking_status THEN
    RAISE EXCEPTION 'Booking status can only be changed to cancelled by the traveller';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.protect_booking_financial_columns() FROM anon, authenticated;

DROP TRIGGER IF EXISTS protect_booking_financial_columns_trg ON public.bookings;
CREATE TRIGGER protect_booking_financial_columns_trg
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.protect_booking_financial_columns();