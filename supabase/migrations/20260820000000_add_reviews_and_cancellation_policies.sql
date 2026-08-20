-- ENUMS FOR NEW FEATURES
create type public.cancellation_type as enum ('free','partial','non_refundable');
create type public.review_visibility as enum ('public','private','hidden');
create type public.payment_status as enum ('pending','paid','failed','refunded');

-- CANCELLATION POLICIES TABLE
create table public.cancellation_policies (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  policy_type public.cancellation_type not null,
  description text,
  -- Flexible: cancel up to X days before check-in for full refund
  -- Moderate: X% refund if cancelled up to Y days before check-in
  -- Strict: non-refundable after confirmation
  days_before_checkin int,
  refund_percentage int default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.cancellation_policies to anon, authenticated;
grant all on public.cancellation_policies to service_role;
alter table public.cancellation_policies enable row level security;
create policy "cancellation_policies_read" on public.cancellation_policies for select to anon, authenticated using (true);
create trigger cancellation_policies_updated_at before update on public.cancellation_policies for each row execute function public.set_updated_at();
create index cancellation_policies_listing_idx on public.cancellation_policies (listing_id);

-- PAYMENT DETAILS TABLE
create table public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade unique,
  amount_bdt int not null,
  status public.payment_status not null default 'pending',
  payment_method text, -- 'card', 'bkash', 'nagad', 'rocket', 'bank_transfer'
  transaction_id text unique,
  payment_gateway text, -- 'stripe', 'sslcommerz', 'nagad', 'bkash'
  paid_at timestamptz,
  refunded_at timestamptz,
  refund_amount_bdt int,
  refund_reason text,
  metadata jsonb, -- Store additional payment data
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.payment_transactions to authenticated;
grant all on public.payment_transactions to service_role;
alter table public.payment_transactions enable row level security;
create policy "payment_own_select" on public.payment_transactions for select to authenticated
  using (exists (select 1 from public.bookings b where b.id = booking_id and b.user_id = auth.uid()) or public.is_staff(auth.uid()));
create policy "payment_own_insert" on public.payment_transactions for insert to authenticated
  with check (exists (select 1 from public.bookings b where b.id = booking_id and b.user_id = auth.uid()));
create policy "payment_own_update" on public.payment_transactions for update to authenticated
  using (public.is_staff(auth.uid()));
create trigger payment_transactions_updated_at before update on public.payment_transactions for each row execute function public.set_updated_at();
create index payment_transactions_booking_idx on public.payment_transactions (booking_id);
create index payment_transactions_status_idx on public.payment_transactions (status);

-- REVIEWS TABLE
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade unique,
  listing_id uuid not null references public.listings(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  listing_rating int not null check (listing_rating >= 1 and listing_rating <= 5),
  cleanliness_rating int check (cleanliness_rating >= 1 and cleanliness_rating <= 5),
  communication_rating int check (communication_rating >= 1 and communication_rating <= 5),
  accuracy_rating int check (accuracy_rating >= 1 and accuracy_rating <= 5),
  location_rating int check (location_rating >= 1 and location_rating <= 5),
  value_rating int check (value_rating >= 1 and value_rating <= 5),
  title text,
  comment text,
  highlights text[], -- Array of positive points
  concerns text[], -- Array of things to improve
  would_recommend boolean default true,
  visibility public.review_visibility not null default 'public',
  is_verified_booking boolean not null default true,
  helpful_count int not null default 0,
  unhelpful_count int not null default 0,
  response_from_host text,
  response_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.reviews to anon, authenticated;
grant insert, update, delete on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "reviews_public_read" on public.reviews for select to anon, authenticated using (visibility = 'public' or reviewer_id = auth.uid());
create policy "reviews_insert_own" on public.reviews for insert to authenticated with check (reviewer_id = auth.uid());
create policy "reviews_update_own" on public.reviews for update to authenticated using (reviewer_id = auth.uid()) with check (reviewer_id = auth.uid());
create policy "reviews_delete_own" on public.reviews for delete to authenticated using (reviewer_id = auth.uid());
create trigger reviews_updated_at before update on public.reviews for each row execute function public.set_updated_at();
create index reviews_listing_idx on public.reviews (listing_id);
create index reviews_reviewer_idx on public.reviews (reviewer_id);
create index reviews_booking_idx on public.reviews (booking_id);
create index reviews_visibility_idx on public.reviews (visibility);

-- REVIEW HELPFULNESS TRACKING
create table public.review_helpfulness (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  is_helpful boolean not null,
  created_at timestamptz not null default now(),
  unique (review_id, user_id)
);
grant select, insert, delete on public.review_helpfulness to authenticated;
grant all on public.review_helpfulness to service_role;
alter table public.review_helpfulness enable row level security;
create policy "review_helpfulness_select" on public.review_helpfulness for select to authenticated using (true);
create policy "review_helpfulness_own_insert" on public.review_helpfulness for insert to authenticated with check (user_id = auth.uid());
create policy "review_helpfulness_own_delete" on public.review_helpfulness for delete to authenticated using (user_id = auth.uid());
create index review_helpfulness_review_idx on public.review_helpfulness (review_id);

-- UPDATE LISTINGS TABLE WITH REVIEW AGGREGATES
alter table public.listings 
  add column avg_cleanliness_rating numeric(3,2),
  add column avg_communication_rating numeric(3,2),
  add column avg_accuracy_rating numeric(3,2),
  add column avg_location_rating numeric(3,2),
  add column avg_value_rating numeric(3,2),
  add column total_reviews int not null default 0,
  add column cancellation_policy_id uuid references public.cancellation_policies(id) on delete set null;

-- UPDATE BOOKINGS TABLE WITH PAYMENT AND CANCELLATION INFO
alter table public.bookings
  add column cancellation_policy_id uuid references public.cancellation_policies(id) on delete set null,
  add column payment_status public.payment_status not null default 'pending',
  add column can_cancel boolean not null default true,
  add column refund_eligible boolean not null default false,
  add column refund_amount_bdt int,
  add column cancellation_reason text,
  add column cancelled_at timestamptz;

-- FUNCTION TO CALCULATE AVERAGE RATINGS
create or replace function public.update_listing_ratings()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.listings
  set
    rating = coalesce((select avg(listing_rating) from public.reviews where listing_id = new.listing_id), 0),
    avg_cleanliness_rating = (select avg(cleanliness_rating) from public.reviews where listing_id = new.listing_id),
    avg_communication_rating = (select avg(communication_rating) from public.reviews where listing_id = new.listing_id),
    avg_accuracy_rating = (select avg(accuracy_rating) from public.reviews where listing_id = new.listing_id),
    avg_location_rating = (select avg(location_rating) from public.reviews where listing_id = new.listing_id),
    avg_value_rating = (select avg(value_rating) from public.reviews where listing_id = new.listing_id),
    total_reviews = (select count(*) from public.reviews where listing_id = new.listing_id and visibility = 'public')
  where id = new.listing_id;
  return new;
end $$;

create trigger update_listing_ratings_on_review
after insert or update or delete on public.reviews
for each row execute function public.update_listing_ratings();

-- FUNCTION TO VALIDATE CANCELLATION ELIGIBILITY
create or replace function public.calculate_refund_eligibility()
returns trigger language plpgsql set search_path = public as $$
declare
  v_policy public.cancellation_policies;
  v_days_until_checkin int;
  v_refund_amount int;
begin
  if new.status = 'cancelled' then
    select * into v_policy from public.cancellation_policies where id = new.cancellation_policy_id;
    
    if v_policy is not null then
      v_days_until_checkin := (new.check_in - current_date)::int;
      
      if v_policy.policy_type = 'free' then
        if v_days_until_checkin > v_policy.days_before_checkin then
          new.refund_eligible := true;
          new.refund_amount_bdt := new.total_bdt;
        else
          new.refund_eligible := false;
          new.refund_amount_bdt := 0;
        end if;
      elsif v_policy.policy_type = 'partial' then
        if v_days_until_checkin > v_policy.days_before_checkin then
          new.refund_eligible := true;
          new.refund_amount_bdt := (new.total_bdt * v_policy.refund_percentage) / 100;
        else
          new.refund_eligible := false;
          new.refund_amount_bdt := 0;
        end if;
      elsif v_policy.policy_type = 'non_refundable' then
        new.refund_eligible := false;
        new.refund_amount_bdt := 0;
      end if;
    end if;
    
    new.cancelled_at := now();
  end if;
  
  return new;
end $$;

create trigger bookings_calculate_refund
before update on public.bookings
for each row
when (new.status is distinct from old.status and new.status = 'cancelled')
execute function public.calculate_refund_eligibility();

-- SEED CANCELLATION POLICIES FOR EXISTING LISTINGS
insert into public.cancellation_policies (listing_id, policy_type, days_before_checkin, refund_percentage, description)
select 
  id,
  'partial',
  7,
  75,
  'Free cancellation up to 7 days before check-in. After that, 75% refund.'
from public.listings
on conflict do nothing;

-- ADD DEFAULT CANCELLATION POLICIES TO LISTINGS
update public.listings l
set cancellation_policy_id = (
  select id from public.cancellation_policies cp where cp.listing_id = l.id limit 1
)
where cancellation_policy_id is null;

-- REALTIME SUPPORT FOR NEW TABLES
alter table public.reviews replica identity full;
alter table public.payment_transactions replica identity full;
alter table public.review_helpfulness replica identity full;
alter publication supabase_realtime add table public.reviews;
alter publication supabase_realtime add table public.payment_transactions;

-- EXAMPLE REVIEWS SEED DATA (optional)
insert into public.reviews (booking_id, listing_id, reviewer_id, listing_rating, cleanliness_rating, communication_rating, accuracy_rating, location_rating, value_rating, title, comment, highlights, concerns, would_recommend)
select 
  b.id,
  b.listing_id,
  b.user_id,
  5,
  5,
  5,
  5,
  4,
  4,
  'Amazing beachfront stay!',
  'Wonderful property with excellent service. The views are stunning and the staff was very helpful. Would definitely come back!',
  array['Clean rooms', 'Great location', 'Friendly staff', 'Amazing views'],
  array['Could use fresher towels'],
  true
from public.bookings b
where b.status = 'completed'
limit 3
on conflict do nothing;
