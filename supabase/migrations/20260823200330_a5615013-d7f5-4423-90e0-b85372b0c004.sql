-- ============ ENUMS ============
create type public.vertical as enum ('stay','flight','package','activity','transfer','car','esim','train');
create type public.cabin_class as enum ('economy','premium','business','first');

-- ============ AIRPORTS ============
create table public.airports (
  id uuid primary key default gen_random_uuid(),
  iata text not null unique,
  name text not null,
  city text not null,
  country text not null default 'Bangladesh',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.airports to anon, authenticated;
grant all on public.airports to service_role;
alter table public.airports enable row level security;
create policy airports_public_read on public.airports for select to anon, authenticated using (true);

-- ============ FLIGHTS ============
create table public.flights (
  id uuid primary key default gen_random_uuid(),
  airline text not null,
  airline_code text not null,
  flight_no text not null,
  from_iata text not null references public.airports(iata),
  to_iata text not null references public.airports(iata),
  depart_time time not null,
  arrive_time time not null,
  duration_min integer not null,
  stops integer not null default 0,
  cabin public.cabin_class not null default 'economy',
  fare_bdt integer not null,
  baggage_kg integer not null default 20,
  cabin_baggage_kg integer not null default 7,
  refundable boolean not null default false,
  days_of_week integer[] not null default '{0,1,2,3,4,5,6}',
  created_at timestamptz not null default now()
);
create index flights_route_idx on public.flights (from_iata, to_iata);
grant select on public.flights to anon, authenticated;
grant all on public.flights to service_role;
alter table public.flights enable row level security;
create policy flights_public_read on public.flights for select to anon, authenticated using (true);

-- ============ ACTIVITIES ============
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null default 'attraction',
  city text not null,
  country text not null default 'Bangladesh',
  summary text,
  description text,
  hero_url text,
  photos text[] not null default '{}',
  highlights text[] not null default '{}',
  duration_min integer not null default 120,
  price_bdt integer not null,
  rating numeric not null default 0,
  review_count integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.activities to anon, authenticated;
grant all on public.activities to service_role;
alter table public.activities enable row level security;
create policy activities_public_read on public.activities for select to anon, authenticated using (is_published);

create table public.activity_slots (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  start_time time not null,
  seats integer not null default 20,
  price_bdt integer not null,
  created_at timestamptz not null default now()
);
grant select on public.activity_slots to anon, authenticated;
grant all on public.activity_slots to service_role;
alter table public.activity_slots enable row level security;
create policy activity_slots_public_read on public.activity_slots for select to anon, authenticated using (true);

-- ============ TRANSFERS ============
create table public.transfers (
  id uuid primary key default gen_random_uuid(),
  airport_iata text not null references public.airports(iata),
  area text not null,
  vehicle_class text not null,
  vehicle_example text,
  seats integer not null default 3,
  luggage integer not null default 2,
  price_bdt integer not null,
  photo_url text,
  created_at timestamptz not null default now()
);
grant select on public.transfers to anon, authenticated;
grant all on public.transfers to service_role;
alter table public.transfers enable row level security;
create policy transfers_public_read on public.transfers for select to anon, authenticated using (true);

-- ============ CAR RENTALS ============
create table public.car_rentals (
  id uuid primary key default gen_random_uuid(),
  model text not null,
  car_class text not null,
  transmission text not null default 'automatic',
  seats integer not null default 5,
  bags integer not null default 2,
  price_per_day_bdt integer not null,
  supplier text not null,
  city text not null,
  photo_url text,
  with_driver boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.car_rentals to anon, authenticated;
grant all on public.car_rentals to service_role;
alter table public.car_rentals enable row level security;
create policy car_rentals_public_read on public.car_rentals for select to anon, authenticated using (true);

-- ============ ESIM ============
create table public.esim_plans (
  id uuid primary key default gen_random_uuid(),
  country text not null,
  country_code text not null,
  data_gb numeric not null,
  validity_days integer not null,
  network text not null,
  price_bdt integer not null,
  is_unlimited boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.esim_plans to anon, authenticated;
grant all on public.esim_plans to service_role;
alter table public.esim_plans enable row level security;
create policy esim_public_read on public.esim_plans for select to anon, authenticated using (true);

-- ============ TRAINS ============
create table public.trains (
  id uuid primary key default gen_random_uuid(),
  operator text not null default 'Bangladesh Railway',
  train_name text not null,
  train_no text not null,
  from_city text not null,
  to_city text not null,
  depart_time time not null,
  arrive_time time not null,
  duration_min integer not null,
  travel_class text not null,
  price_bdt integer not null,
  off_day text,
  created_at timestamptz not null default now()
);
grant select on public.trains to anon, authenticated;
grant all on public.trains to service_role;
alter table public.trains enable row level security;
create policy trains_public_read on public.trains for select to anon, authenticated using (true);

-- ============ PACKAGES ============
create table public.packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  from_iata text not null references public.airports(iata),
  to_iata text not null references public.airports(iata),
  listing_id uuid references public.listings(id),
  nights integer not null default 2,
  hero_url text,
  summary text,
  bundle_price_bdt integer not null,
  separate_price_bdt integer not null,
  saving_pct integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.packages to anon, authenticated;
grant all on public.packages to service_role;
alter table public.packages enable row level security;
create policy packages_public_read on public.packages for select to anon, authenticated using (is_published);

-- ============ ORDERS ============
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  user_id uuid not null references auth.users(id) on delete cascade,
  vertical public.vertical not null,
  item_id uuid,
  title text not null,
  subtitle text,
  hero_url text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  travellers integer not null default 1,
  total_bdt integer not null,
  currency text not null default 'BDT',
  status public.booking_status not null default 'pending',
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_idx on public.orders (user_id, starts_at desc);
grant select, insert, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy orders_own_select on public.orders for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy orders_own_insert on public.orders for insert to authenticated with check (user_id = auth.uid());
create policy orders_update on public.orders for update to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid())) with check (user_id = auth.uid() or public.is_staff(auth.uid()));
create trigger orders_updated_at before update on public.orders for each row execute function public.set_updated_at();

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status public.booking_status not null,
  message text,
  created_at timestamptz not null default now()
);
grant select on public.order_events to authenticated;
grant all on public.order_events to service_role;
alter table public.order_events enable row level security;
create policy order_events_select on public.order_events for select to authenticated
using (exists (select 1 from public.orders o where o.id = order_events.order_id and (o.user_id = auth.uid() or public.is_staff(auth.uid()))));

-- ============ NOTIFICATIONS ============
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  kind text not null default 'order',
  order_reference text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy notifications_own_select on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notifications_own_update on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============ ORDER EVENT + NOTIFICATION TRIGGER ============
create or replace function public.log_order_event()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_events (order_id, status, message)
    values (new.id, new.status, 'Request received');
    insert into public.notifications (user_id, title, body, order_reference)
    values (new.user_id, 'Booking request received', new.title || ' — reference ' || new.reference, new.reference);
  elsif new.status is distinct from old.status then
    insert into public.order_events (order_id, status, message)
    values (new.id, new.status, 'Status updated to ' || new.status);
    insert into public.notifications (user_id, title, body, order_reference)
    values (new.user_id, 'Booking ' || new.status, new.title || ' — reference ' || new.reference, new.reference);
  end if;
  return new;
end $$;

create trigger orders_event_log after insert or update on public.orders
for each row execute function public.log_order_event();

alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_events;
alter publication supabase_realtime add table public.notifications;

-- ============ SEED: AIRPORTS ============
insert into public.airports (iata, name, city, country, sort_order) values
('DAC','Hazrat Shahjalal International','Dhaka','Bangladesh',1),
('CXB','Cox''s Bazar Airport','Cox''s Bazar','Bangladesh',2),
('ZYL','Osmani International','Sylhet','Bangladesh',3),
('CGP','Shah Amanat International','Chattogram','Bangladesh',4),
('JSR','Jessore Airport','Jashore','Bangladesh',5),
('SPD','Saidpur Airport','Saidpur','Bangladesh',6),
('RJH','Shah Makhdum Airport','Rajshahi','Bangladesh',7),
('BZL','Barishal Airport','Barishal','Bangladesh',8),
('CCU','Netaji Subhas Chandra Bose','Kolkata','India',9),
('BKK','Suvarnabhumi','Bangkok','Thailand',10),
('KUL','Kuala Lumpur International','Kuala Lumpur','Malaysia',11),
('DXB','Dubai International','Dubai','UAE',12),
('SIN','Changi','Singapore','Singapore',13),
('DOH','Hamad International','Doha','Qatar',14);

-- ============ SEED: FLIGHTS ============
insert into public.flights (airline, airline_code, flight_no, from_iata, to_iata, depart_time, arrive_time, duration_min, stops, cabin, fare_bdt, baggage_kg, refundable) values
('Biman Bangladesh Airlines','BG','BG-435','DAC','CXB','07:30','08:35',65,0,'economy',6450,20,true),
('US-Bangla Airlines','BS','BS-141','DAC','CXB','09:15','10:20',65,0,'economy',5890,20,false),
('Novoair','VQ','VQ-921','DAC','CXB','11:40','12:45',65,0,'economy',6190,20,false),
('Air Astra','2A','2A-661','DAC','CXB','15:20','16:25',65,0,'economy',5650,20,false),
('US-Bangla Airlines','BS','BS-143','DAC','CXB','17:50','18:55',65,0,'business',12400,30,true),
('Biman Bangladesh Airlines','BG','BG-601','DAC','ZYL','08:00','08:50',50,0,'economy',4950,20,true),
('US-Bangla Airlines','BS','BS-201','DAC','ZYL','13:10','14:00',50,0,'economy',4390,20,false),
('Novoair','VQ','VQ-931','DAC','CGP','07:05','08:00',55,0,'economy',4790,20,false),
('US-Bangla Airlines','BS','BS-121','DAC','CGP','16:30','17:25',55,0,'economy',4590,20,false),
('Biman Bangladesh Airlines','BG','BG-411','DAC','JSR','10:00','10:55',55,0,'economy',4290,20,true),
('US-Bangla Airlines','BS','BS-171','DAC','SPD','09:40','10:45',65,0,'economy',5290,20,false),
('Novoair','VQ','VQ-911','DAC','RJH','12:20','13:15',55,0,'economy',4990,20,false),
('US-Bangla Airlines','BS','BS-311','DAC','CCU','11:00','11:55',55,0,'economy',9800,25,false),
('Biman Bangladesh Airlines','BG','BG-095','DAC','CCU','14:20','15:15',55,0,'economy',10450,30,true),
('Biman Bangladesh Airlines','BG','BG-388','DAC','BKK','23:30','03:20',230,0,'economy',31500,30,true),
('Thai Airways','TG','TG-322','DAC','BKK','01:15','05:05',230,0,'economy',34900,30,true),
('Malaysia Airlines','MH','MH-197','DAC','KUL','13:45','19:55',250,0,'economy',38900,30,true),
('Emirates','EK','EK-587','DAC','DXB','04:10','07:35',325,0,'economy',52400,30,true),
('Biman Bangladesh Airlines','BG','BG-047','DAC','DXB','20:15','23:40',325,0,'business',124000,40,true),
('Singapore Airlines','SQ','SQ-447','DAC','SIN','23:55','06:20',265,0,'economy',46700,30,true),
('Qatar Airways','QR','QR-635','DAC','DOH','03:05','06:15',310,0,'economy',49500,30,true),
('US-Bangla Airlines','BS','BS-142','CXB','DAC','11:10','12:15',65,0,'economy',5990,20,false),
('Biman Bangladesh Airlines','BG','BG-436','CXB','DAC','19:20','20:25',65,0,'economy',6550,20,true),
('Novoair','VQ','VQ-922','CXB','DAC','13:30','14:35',65,0,'economy',6290,20,false),
('US-Bangla Airlines','BS','BS-202','ZYL','DAC','15:00','15:50',50,0,'economy',4490,20,false),
('Biman Bangladesh Airlines','BG','BG-602','ZYL','DAC','09:40','10:30',50,0,'economy',5050,20,true),
('US-Bangla Airlines','BS','BS-122','CGP','DAC','18:15','19:10',55,0,'economy',4690,20,false),
('Novoair','VQ','VQ-932','CGP','DAC','08:50','09:45',55,0,'economy',4890,20,false),
('Emirates','EK','EK-586','DXB','DAC','09:35','18:05',270,0,'economy',54100,30,true),
('Thai Airways','TG','TG-321','BKK','DAC','17:45','19:35',230,0,'economy',33900,30,true);

-- ============ SEED: ACTIVITIES ============
insert into public.activities (slug, title, category, city, summary, description, hero_url, photos, highlights, duration_min, price_bdt, rating, review_count) values
('sundarbans-mangrove-cruise','Sundarbans Mangrove Cruise','tour','Khulna','Three-day live-aboard through the world''s largest mangrove forest.','Cruise the Sundarbans with a naturalist guide, spotting spotted deer, crocodiles and if you are lucky the Royal Bengal tiger. Includes all meals, cabin accommodation and canoe safaris through the narrow canals.','https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200','{"https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200"}','{"Naturalist guide","All meals included","Canoe canal safari","Karamjal watchtower"}',4320,18500,4.8,312),
('coxs-bazar-sunset-catamaran','Cox''s Bazar Sunset Catamaran','water','Cox''s Bazar','Two hours on the Bay of Bengal as the sun drops behind the longest beach on earth.','A relaxed catamaran sail from Laboni Point with tea, snacks and live acoustic music as the sun sets over the Bay of Bengal.','https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200','{"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200"}','{"Sunset sail","Snacks and tea","Live music","Hotel pickup"}',120,2450,4.6,188),
('srimangal-tea-trail','Srimangal Seven-Layer Tea Trail','food','Srimangal','Walk the tea gardens, then taste the famous seven-layer tea.','Guided walk through Lakkatura and Finlay tea estates with a factory visit, ending at Nilkantha Tea Cabin for the legendary seven-layer tea.','https://images.unsplash.com/photo-1523920290228-4f321a939b4c?w=1200','{"https://images.unsplash.com/photo-1523920290228-4f321a939b4c?w=1200"}','{"Tea factory tour","Seven-layer tea tasting","Local guide","Garden walk"}',300,1850,4.7,241),
('old-dhaka-heritage-walk','Old Dhaka Heritage Walk','culture','Dhaka','Ahsan Manzil, Shankhari Bazar and the spice lanes on foot.','A four-hour walking tour through Mughal-era Dhaka: Ahsan Manzil, Star Mosque, Shankhari Bazar and Chawkbazar, finishing with a street-food tasting.','https://images.unsplash.com/photo-1558431382-27e303142255?w=1200','{"https://images.unsplash.com/photo-1558431382-27e303142255?w=1200"}','{"Ahsan Manzil entry","Street food tasting","Rickshaw ride","Small group"}',240,1450,4.5,403),
('bandarban-nilgiri-trek','Bandarban Nilgiri Hill Trek','adventure','Bandarban','Above the clouds at 2,200 feet in the Chittagong Hill Tracts.','Full-day 4WD and trekking trip to Nilgiri, Chimbuk Hill and a Mru village, with a packed lunch at the summit viewpoint.','https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200','{"https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200"}','{"4WD transport","Mru village visit","Packed lunch","Permit handled"}',600,3900,4.9,157),
('saint-martin-snorkel','Saint Martin''s Coral Snorkelling','water','Saint Martin''s Island','The only coral island in Bangladesh, from under the surface.','Boat out to Chera Dwip with snorkelling gear, a reef guide and a beach barbecue lunch on the sandbar.','https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200','{"https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200"}','{"Snorkel gear included","Chera Dwip boat","BBQ lunch","Reef guide"}',420,4200,4.7,209),
('paharpur-somapura-day-trip','Paharpur Somapura Mahavihara','culture','Naogaon','UNESCO-listed Buddhist monastery from the 8th century.','Day trip from Rajshahi to Somapura Mahavihara and the site museum with an archaeology guide.','https://images.unsplash.com/photo-1548013146-72479768bada?w=1200','{"https://images.unsplash.com/photo-1548013146-72479768bada?w=1200"}','{"UNESCO site","Archaeology guide","Museum entry","AC transport"}',480,2900,4.4,96),
('dhaka-airport-fast-track','Dhaka Airport Fast-Track & Lounge','service','Dhaka','Skip the queue at HSIA with meet-and-greet plus lounge access.','Airport representative meets you kerbside, escorts you through immigration fast-track and into the Balaka lounge with buffet and Wi-Fi.','https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200','{"https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200"}','{"Immigration fast-track","Lounge access","Porter service","24/7 available"}',180,3600,4.6,132);

insert into public.activity_slots (activity_id, start_time, seats, price_bdt)
select a.id, s.t, s.seats, a.price_bdt
from public.activities a
cross join (values (time '07:00', 20), (time '10:00', 20), (time '14:00', 16), (time '16:30', 12)) as s(t, seats);

-- ============ SEED: TRANSFERS ============
insert into public.transfers (airport_iata, area, vehicle_class, vehicle_example, seats, luggage, price_bdt) values
('DAC','Gulshan / Banani','Economy sedan','Toyota Axio',3,2,1450),
('DAC','Gulshan / Banani','Premium sedan','Toyota Premio',3,3,2200),
('DAC','Gulshan / Banani','SUV','Toyota Harrier',5,4,3400),
('DAC','Gulshan / Banani','Minivan','Toyota Hiace',10,8,4800),
('DAC','Uttara','Economy sedan','Toyota Axio',3,2,950),
('DAC','Uttara','SUV','Toyota Harrier',5,4,2400),
('DAC','Dhanmondi / Mohammadpur','Economy sedan','Toyota Axio',3,2,1750),
('DAC','Dhanmondi / Mohammadpur','Premium sedan','Toyota Allion',3,3,2600),
('DAC','Motijheel / Old Dhaka','Economy sedan','Toyota Axio',3,2,1950),
('CXB','Kolatoli / Laboni Beach','Economy sedan','Toyota Axio',3,2,850),
('CXB','Kolatoli / Laboni Beach','Minivan','Toyota Hiace',10,8,2400),
('CXB','Inani / Himchari','SUV','Toyota Harrier',5,4,2900),
('ZYL','Sylhet City','Economy sedan','Toyota Axio',3,2,900),
('ZYL','Srimangal','SUV','Toyota Harrier',5,4,4500),
('CGP','Agrabad / GEC','Economy sedan','Toyota Axio',3,2,1100),
('CGP','Patenga','Premium sedan','Toyota Premio',3,3,1900);

-- ============ SEED: CARS ============
insert into public.car_rentals (model, car_class, transmission, seats, bags, price_per_day_bdt, supplier, city, with_driver) values
('Toyota Axio','Economy','automatic',4,2,4200,'Trips.bd Fleet','Dhaka',true),
('Toyota Premio','Comfort','automatic',4,3,5600,'Trips.bd Fleet','Dhaka',true),
('Toyota Harrier','SUV','automatic',5,4,9800,'Navana Rent','Dhaka',true),
('Toyota Hiace','Minivan','manual',11,8,11500,'Navana Rent','Dhaka',true),
('Honda Grace','Economy','automatic',4,2,4500,'Rent A Car BD','Dhaka',true),
('Toyota Noah','Van','automatic',7,5,8200,'Rent A Car BD','Chattogram',true),
('Toyota Axio','Economy','automatic',4,2,3900,'Coast Wheels','Cox''s Bazar',true),
('Toyota Harrier','SUV','automatic',5,4,9200,'Coast Wheels','Cox''s Bazar',true),
('Mitsubishi Pajero','SUV','automatic',7,5,12500,'Hill Track Motors','Sylhet',true),
('Toyota Premio','Comfort','automatic',4,3,5400,'Hill Track Motors','Sylhet',true);

-- ============ SEED: ESIM ============
insert into public.esim_plans (country, country_code, data_gb, validity_days, network, price_bdt, is_unlimited) values
('Thailand','TH',3,7,'AIS / True',890,false),
('Thailand','TH',10,15,'AIS / True',1990,false),
('Malaysia','MY',5,10,'Maxis',1250,false),
('Malaysia','MY',15,30,'Maxis',2790,false),
('Singapore','SG',5,10,'Singtel',1450,false),
('United Arab Emirates','AE',3,7,'Etisalat',1690,false),
('United Arab Emirates','AE',10,30,'Etisalat',3450,false),
('India','IN',5,10,'Airtel / Jio',990,false),
('India','IN',20,30,'Airtel / Jio',2290,false),
('Saudi Arabia','SA',8,15,'STC',2650,false),
('Turkey','TR',10,15,'Turkcell',2450,false),
('United Kingdom','GB',10,30,'EE / Vodafone',3290,false),
('Europe (39 countries)','EU',10,30,'Multi-network',3890,false),
('United States','US',12,30,'T-Mobile',3590,false),
('Global (120 countries)','WW',5,15,'Multi-network',4990,false),
('Thailand','TH',0,15,'AIS Unlimited',3490,true);

-- ============ SEED: TRAINS ============
insert into public.trains (train_name, train_no, from_city, to_city, depart_time, arrive_time, duration_min, travel_class, price_bdt, off_day) values
('Sonar Bangla Express','787','Dhaka','Chattogram','07:00','12:00',300,'Snigdha',1150,'Tuesday'),
('Sonar Bangla Express','787','Dhaka','Chattogram','07:00','12:00',300,'S_Chair',505,'Tuesday'),
('Subarna Express','701','Dhaka','Chattogram','16:30','21:50',320,'Snigdha',1150,'Monday'),
('Mohanagar Provati','703','Dhaka','Chattogram','07:45','14:00',375,'S_Chair',505,null),
('Parabat Express','709','Dhaka','Sylhet','06:20','13:00',400,'Snigdha',1180,'Tuesday'),
('Kalni Express','773','Dhaka','Sylhet','14:45','21:30',405,'S_Chair',375,'Friday'),
('Upaban Express','739','Dhaka','Sylhet','20:30','05:00',510,'AC_Berth',1288,null),
('Ekota Express','705','Dhaka','Dinajpur','10:10','20:05',595,'Snigdha',1265,null),
('Panchagarh Express','793','Dhaka','Panchagarh','10:45','21:00',615,'AC_Seat',1495,null),
('Silkcity Express','753','Dhaka','Rajshahi','14:45','20:30',345,'Snigdha',1005,'Sunday'),
('Banalata Express','791','Dhaka','Rajshahi','13:30','18:20',290,'AC_Seat',1145,'Friday'),
('Sundarban Express','725','Dhaka','Khulna','08:15','17:40',565,'Snigdha',1300,'Tuesday'),
('Chitra Express','763','Dhaka','Khulna','19:00','03:40',520,'S_Chair',625,'Monday'),
('Jamuna Express','745','Dhaka','Jamalpur','16:45','21:35',290,'S_Chair',260,null),
('Turag Express','709','Dhaka','Gazipur','05:00','06:05',65,'Shovon',35,'Friday');

-- ============ SEED: PACKAGES ============
insert into public.packages (slug, title, from_iata, to_iata, listing_id, nights, hero_url, summary, bundle_price_bdt, separate_price_bdt, saving_pct)
select
  p.slug, p.title, p.from_iata, p.to_iata,
  (select id from public.listings where city = p.city order by rating desc limit 1),
  p.nights, p.hero_url, p.summary, p.bundle, p.separate, p.saving
from (values
  ('dhaka-coxsbazar-2n','Dhaka to Cox''s Bazar · 2 nights','DAC','CXB','Cox''s Bazar',2,'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200','Return flights plus a beachfront stay on the longest sea beach in the world.',24900,29800,16),
  ('dhaka-coxsbazar-3n','Dhaka to Cox''s Bazar · 3 nights','DAC','CXB','Cox''s Bazar',3,'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200','Three nights by the Bay of Bengal with return flights and daily breakfast.',32400,39600,18),
  ('dhaka-sylhet-2n','Dhaka to Sylhet · 2 nights','DAC','ZYL','Sylhet',2,'https://images.unsplash.com/photo-1523920290228-4f321a939b4c?w=1200','Tea-garden weekend with return flights and a hillside resort.',21500,25900,17),
  ('dhaka-chattogram-2n','Dhaka to Chattogram · 2 nights','DAC','CGP','Chattogram',2,'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200','Port-city break with return flights and a central city hotel.',19800,23400,15),
  ('dhaka-bangkok-4n','Dhaka to Bangkok · 4 nights','DAC','BKK','Dhaka',4,'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200','Return international flights plus four nights in central Bangkok.',89500,108000,17)
) as p(slug, title, from_iata, to_iata, city, nights, hero_url, summary, bundle, separate, saving);