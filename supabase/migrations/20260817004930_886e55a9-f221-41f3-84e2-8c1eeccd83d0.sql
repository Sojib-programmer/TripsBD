-- ENUMS
create type public.app_role as enum ('admin','ops','user');
create type public.listing_kind as enum ('hotel','home','apartment','resort','villa');
create type public.booking_status as enum ('pending','confirmed','cancelled','completed');

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

-- PROFILES
create table public.profiles (
  id uuid primary key,
  full_name text,
  avatar_url text,
  phone text,
  vip_tier text not null default 'bronze',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ROLES
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "user_roles_select_own" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin','ops'))
$$;

-- DESTINATIONS
create table public.destinations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  country text not null,
  tagline text,
  hero_url text,
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.destinations to anon, authenticated;
grant all on public.destinations to service_role;
alter table public.destinations enable row level security;
create policy "destinations_public_read" on public.destinations for select to anon, authenticated using (is_published);

-- LISTINGS
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  kind public.listing_kind not null default 'hotel',
  destination_id uuid references public.destinations(id) on delete set null,
  city text not null,
  country text not null default 'Bangladesh',
  summary text,
  description text,
  hero_url text,
  photos text[] not null default '{}',
  amenities text[] not null default '{}',
  max_guests int not null default 2,
  bedrooms int not null default 1,
  beds int not null default 1,
  baths numeric(3,1) not null default 1,
  price_bdt int not null,
  rating numeric(2,1) not null default 0,
  review_count int not null default 0,
  is_guest_favorite boolean not null default false,
  is_published boolean not null default true,
  supplier text not null default 'internal',
  supplier_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.listings to anon, authenticated;
grant all on public.listings to service_role;
alter table public.listings enable row level security;
create policy "listings_public_read" on public.listings for select to anon, authenticated using (is_published);
create trigger listings_updated_at before update on public.listings for each row execute function public.set_updated_at();
create index listings_city_idx on public.listings (city);
create index listings_destination_idx on public.listings (destination_id);

-- DEALS
create table public.deals (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  subtitle text,
  discount_pct int not null default 0,
  terms text,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.deals to anon, authenticated;
grant all on public.deals to service_role;
alter table public.deals enable row level security;
create policy "deals_public_read" on public.deals for select to anon, authenticated using (is_active);

-- SAVED
create table public.saved_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, listing_id)
);
grant select, insert, delete on public.saved_listings to authenticated;
grant all on public.saved_listings to service_role;
alter table public.saved_listings enable row level security;
create policy "saved_own_select" on public.saved_listings for select to authenticated using (user_id = auth.uid());
create policy "saved_own_insert" on public.saved_listings for insert to authenticated with check (user_id = auth.uid());
create policy "saved_own_delete" on public.saved_listings for delete to authenticated using (user_id = auth.uid());

-- BOOKINGS
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete restrict,
  check_in date not null,
  check_out date not null,
  guests int not null default 1,
  guest_name text not null,
  guest_email text not null,
  guest_phone text,
  note text,
  nights int not null default 1,
  total_bdt int not null,
  deal_code text,
  status public.booking_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.bookings to authenticated;
grant all on public.bookings to service_role;
alter table public.bookings enable row level security;
create policy "bookings_own_select" on public.bookings for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "bookings_own_insert" on public.bookings for insert to authenticated with check (user_id = auth.uid());
create policy "bookings_update" on public.bookings for update to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid())) with check (user_id = auth.uid() or public.is_staff(auth.uid()));
create trigger bookings_updated_at before update on public.bookings for each row execute function public.set_updated_at();
create index bookings_user_idx on public.bookings (user_id, created_at desc);

create or replace function public.validate_booking_dates()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.check_out <= new.check_in then raise exception 'check_out must be after check_in'; end if;
  if new.guests < 1 then raise exception 'guests must be at least 1'; end if;
  return new;
end $$;
create trigger bookings_validate before insert or update on public.bookings for each row execute function public.validate_booking_dates();

-- BOOKING TIMELINE
create table public.booking_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  status public.booking_status not null,
  message text,
  created_at timestamptz not null default now()
);
grant select on public.booking_events to authenticated;
grant all on public.booking_events to service_role;
alter table public.booking_events enable row level security;
create policy "booking_events_select" on public.booking_events for select to authenticated
  using (exists (select 1 from public.bookings b where b.id = booking_id and (b.user_id = auth.uid() or public.is_staff(auth.uid()))));

create or replace function public.log_booking_event()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.booking_events (booking_id, status, message) values (new.id, new.status, 'Booking request received');
  elsif new.status is distinct from old.status then
    insert into public.booking_events (booking_id, status, message) values (new.id, new.status, 'Status updated to ' || new.status);
  end if;
  return new;
end $$;
create trigger bookings_event_log after insert or update on public.bookings for each row execute function public.log_booking_event();

-- REALTIME
alter table public.bookings replica identity full;
alter table public.booking_events replica identity full;
alter publication supabase_realtime add table public.bookings;
alter publication supabase_realtime add table public.booking_events;

-- SEED
insert into public.destinations (slug, name, country, tagline, hero_url, sort_order) values
('coxs-bazar','Cox''s Bazar','Bangladesh','World''s longest natural sea beach','https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',1),
('sylhet','Sylhet','Bangladesh','Tea gardens, hills and haors','https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&q=80',2),
('dhaka','Dhaka','Bangladesh','The pulse of Bangladesh','https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1200&q=80',3),
('sundarbans','Sundarbans','Bangladesh','Mangrove wilderness and river safaris','https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80',4),
('bandarban','Bandarban','Bangladesh','Hill tracks above the clouds','https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',5),
('kathmandu','Kathmandu','Nepal','Himalayan gateway','https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&q=80',6);

insert into public.listings (slug, title, kind, destination_id, city, country, summary, description, hero_url, photos, amenities, max_guests, bedrooms, beds, baths, price_bdt, rating, review_count, is_guest_favorite) values
('sea-pearl-beach-resort','Sea Pearl Beach Resort & Spa','resort',(select id from public.destinations where slug='coxs-bazar'),'Cox''s Bazar','Bangladesh','Beachfront five-star with infinity pool','Direct beach access, three restaurants, full-service spa and the largest pool deck in Cox''s Bazar.','https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80',array['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80','https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80'],array['Pool','Spa','Beachfront','Breakfast','Free WiFi'],4,1,2,1.0,18500,4.8,412,true),
('long-beach-hotel','Long Beach Hotel','hotel',(select id from public.destinations where slug='coxs-bazar'),'Cox''s Bazar','Bangladesh','Sea-view rooms steps from Laboni Point','Rooftop pool, sea-facing balconies and a 24/7 coffee shop minutes from the main beach.','https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200&q=80',array['https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200&q=80'],array['Pool','Sea view','Breakfast','Free WiFi'],3,1,2,1.0,9200,4.5,286,false),
('tea-valley-bungalow','Tea Valley Bungalow','villa',(select id from public.destinations where slug='sylhet'),'Sreemangal','Bangladesh','Colonial bungalow inside a working tea estate','Wake to mist over the tea rows, private cook, veranda seating and guided estate walks.','https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80',array['https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&q=80'],array['Garden','Private chef','Free parking','Free WiFi'],8,4,5,3.0,14500,4.9,97,true),
('grand-sylhet-hotel','Grand Sylhet Hotel & Resort','hotel',(select id from public.destinations where slug='sylhet'),'Sylhet','Bangladesh','Riverside luxury near Osmani Airport','Full-service resort with lagoon pool, three dining rooms and a 10-minute airport transfer.','https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80',array['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80'],array['Pool','Gym','Airport transfer','Breakfast'],4,2,2,2.0,16800,4.7,203,false),
('gulshan-serviced-apartment','Gulshan Serviced Apartment','apartment',(select id from public.destinations where slug='dhaka'),'Dhaka','Bangladesh','Two-bedroom apartment in Gulshan 2','Full kitchen, backup generator, lift access and walking distance to Gulshan Circle.','https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80',array['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80'],array['Kitchen','Washer','Generator','Free WiFi'],5,2,3,2.0,7800,4.6,158,true),
('banani-boutique-stay','Banani Boutique Stay','home',(select id from public.destinations where slug='dhaka'),'Dhaka','Bangladesh','Designer one-bed near Banani 11','Quiet lane, rooftop garden and a workspace built for long stays.','https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80',array['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80'],array['Workspace','Kitchen','Rooftop','Free WiFi'],2,1,1,1.0,5400,4.4,88,false),
('sundarban-river-lodge','Sundarban River Lodge','resort',(select id from public.destinations where slug='sundarbans'),'Mongla','Bangladesh','Stilted lodge on the mangrove edge','Overwater rooms, ranger-led boat safaris at dawn and all meals included.','https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80',array['https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80'],array['All meals','Boat safari','Guide','River view'],4,2,2,2.0,12900,4.7,64,true),
('nilgiri-hill-cottage','Nilgiri Hill Cottage','villa',(select id from public.destinations where slug='bandarban'),'Bandarban','Bangladesh','Cottage above the cloud line at Nilgiri','Panoramic hill views, bonfire deck and jeep pickup from Bandarban town.','https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',array['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80'],array['Mountain view','Bonfire','Breakfast','Jeep transfer'],6,3,4,2.0,11200,4.8,71,false);

insert into public.deals (code, title, subtitle, discount_pct, terms, expires_at) values
('FIRST8','Up to 8% off','Your first hotel booking',8,'Valid on first completed booking per account.', now() + interval '90 days'),
('VIPGOLD','VIP Gold trial','Up to 18% off selected stays',18,'Applies to VIP-eligible properties only.', now() + interval '60 days'),
('COAST12','Cox''s Bazar escape','12% off beachfront stays',12,'Minimum two nights at participating beach properties.', now() + interval '45 days'),
('HILLS10','Hill tracks getaway','10% off Bandarban & Sylhet',10,'Minimum two nights, blackout dates may apply.', now() + interval '30 days');