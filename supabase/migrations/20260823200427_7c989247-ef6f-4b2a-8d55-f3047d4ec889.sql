revoke all on function public.log_order_event() from public;
revoke all on function public.log_booking_event() from public;
revoke all on function public.handle_new_user() from public;
revoke all on function public.rls_auto_enable() from public;
revoke all on function public.has_role(uuid, public.app_role) from public, anon;
revoke all on function public.is_staff(uuid) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;
grant execute on function public.is_staff(uuid) to authenticated, service_role;