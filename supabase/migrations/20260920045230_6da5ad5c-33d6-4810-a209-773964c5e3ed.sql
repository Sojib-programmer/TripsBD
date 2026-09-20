create type public.spot_type as enum ('restaurant','cafe','bar','attraction','museum','park','shopping','entertainment','hotel','transit','beach','nightlife');

create table public.trip_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New trip',
  destination text,
  start_date date,
  end_date date,
  hero_url text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trip_plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.trip_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (plan_id, date)
);

create table public.trip_plan_spots (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.trip_plans(id) on delete cascade,
  day_id uuid references public.trip_plan_days(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  spot_type public.spot_type not null default 'attraction',
  type_label text,
  address text,
  slot_index integer not null default 0,
  listing_id uuid references public.listings(id) on delete set null,
  activity_id uuid references public.activities(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.trip_plan_messages (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.trip_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index trip_plan_days_plan_idx on public.trip_plan_days(plan_id);
create index trip_plan_spots_plan_idx on public.trip_plan_spots(plan_id);
create index trip_plan_messages_plan_idx on public.trip_plan_messages(plan_id, created_at);
create index trip_plans_user_idx on public.trip_plans(user_id, updated_at desc);

grant select, insert, update, delete on public.trip_plans to authenticated;
grant select, insert, update, delete on public.trip_plan_days to authenticated;
grant select, insert, update, delete on public.trip_plan_spots to authenticated;
grant select, insert, update, delete on public.trip_plan_messages to authenticated;
grant all on public.trip_plans to service_role;
grant all on public.trip_plan_days to service_role;
grant all on public.trip_plan_spots to service_role;
grant all on public.trip_plan_messages to service_role;

alter table public.trip_plans enable row level security;
alter table public.trip_plan_days enable row level security;
alter table public.trip_plan_spots enable row level security;
alter table public.trip_plan_messages enable row level security;

create policy "own trip plans" on public.trip_plans for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own trip plan days" on public.trip_plan_days for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own trip plan spots" on public.trip_plan_spots for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own trip plan messages" on public.trip_plan_messages for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger trip_plans_updated_at before update on public.trip_plans for each row execute function public.set_updated_at();

create or replace function public.enforce_trip_plan_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  plan_count integer;
begin
  select count(*) into plan_count from public.trip_plans where user_id = new.user_id;
  if plan_count >= 3 then
    raise exception 'Free plan limit reached: you can keep up to 3 trip plans.';
  end if;
  return new;
end $$;

create trigger trip_plans_cap before insert on public.trip_plans for each row execute function public.enforce_trip_plan_cap();

create or replace function public.increment_trips_created()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then return; end if;
  insert into public.usage_counters (user_id, date, trips_created)
  values (uid, current_date, 1)
  on conflict (user_id, date)
  do update set trips_created = public.usage_counters.trips_created + 1;
end $$;