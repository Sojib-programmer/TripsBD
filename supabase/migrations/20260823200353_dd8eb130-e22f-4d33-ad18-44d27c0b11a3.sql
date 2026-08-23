revoke execute on function public.log_order_event() from anon, authenticated;
revoke execute on function public.log_booking_event() from anon, authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.set_updated_at() from anon, authenticated;
revoke execute on function public.validate_booking_dates() from anon, authenticated;
revoke execute on function public.rls_auto_enable() from anon, authenticated;