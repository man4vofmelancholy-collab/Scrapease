
-- Enums
create type public.app_role as enum ('admin','customer');
create type public.scrap_unit as enum ('kg','piece','litre');
create type public.pickup_status as enum ('pending','confirmed','assigned','picked_up','completed','cancelled');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  mobile text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);

-- Roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles read" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "admin profiles read" on public.profiles for select to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'));
  insert into public.user_roles (user_id, role) values (new.id, 'customer');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

-- Categories
create table public.scrap_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  description text,
  unit public.scrap_unit not null default 'kg',
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.scrap_categories to anon, authenticated;
grant insert, update, delete on public.scrap_categories to authenticated;
grant all on public.scrap_categories to service_role;
alter table public.scrap_categories enable row level security;
create policy "public read active" on public.scrap_categories for select to anon, authenticated using (is_active or public.has_role(auth.uid(),'admin'));
create policy "admin write" on public.scrap_categories for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger categories_touch before update on public.scrap_categories for each row execute function public.touch_updated_at();

-- Rates (append-only)
create table public.scrap_rates (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.scrap_categories(id) on delete cascade,
  rate_per_unit numeric(10,2) not null check (rate_per_unit > 0),
  effective_from timestamptz not null default now(),
  created_by uuid,
  created_at timestamptz not null default now()
);
create index on public.scrap_rates (category_id, effective_from desc);
grant select on public.scrap_rates to anon, authenticated;
grant insert on public.scrap_rates to authenticated;
grant all on public.scrap_rates to service_role;
alter table public.scrap_rates enable row level security;
create policy "public read rates" on public.scrap_rates for select to anon, authenticated using (true);
create policy "admin insert rates" on public.scrap_rates for insert to authenticated with check (public.has_role(auth.uid(),'admin'));

create view public.current_scrap_rates with (security_invoker = true) as
select distinct on (c.id) c.id as category_id, c.name, c.slug, c.description, c.unit, c.sort_order,
  r.rate_per_unit, r.effective_from as rate_updated_at
from public.scrap_categories c
join public.scrap_rates r on r.category_id = c.id and r.effective_from <= now()
where c.is_active
order by c.id, r.effective_from desc;
grant select on public.current_scrap_rates to anon, authenticated;

-- Pickup requests
create table public.pickup_requests (
  id uuid primary key default gen_random_uuid(),
  request_code text not null unique,
  customer_id uuid,
  customer_name text not null check (char_length(customer_name) between 2 and 100),
  mobile text not null check (mobile ~ '^[6-9][0-9]{9}$'),
  address text not null check (char_length(address) between 5 and 500),
  pincode text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  preferred_date date,
  notes text check (notes is null or char_length(notes) <= 1000),
  status public.pickup_status not null default 'pending',
  estimated_total numeric(12,2) not null default 0,
  final_total numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.pickup_requests to authenticated;
grant all on public.pickup_requests to service_role;
alter table public.pickup_requests enable row level security;
create policy "own requests read" on public.pickup_requests for select to authenticated using (customer_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admin update requests" on public.pickup_requests for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger requests_touch before update on public.pickup_requests for each row execute function public.touch_updated_at();

create table public.pickup_request_items (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.pickup_requests(id) on delete cascade,
  category_id uuid not null references public.scrap_categories(id),
  category_name text not null,
  quantity numeric(10,2) not null check (quantity > 0 and quantity <= 100000),
  unit public.scrap_unit not null,
  rate_snapshot numeric(10,2) not null,
  line_estimate numeric(12,2) not null
);
grant select on public.pickup_request_items to authenticated;
grant all on public.pickup_request_items to service_role;
alter table public.pickup_request_items enable row level security;
create policy "items read via request" on public.pickup_request_items for select to authenticated using (
  exists (select 1 from public.pickup_requests p where p.id = request_id and (p.customer_id = auth.uid() or public.has_role(auth.uid(),'admin'))));

create table public.request_status_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.pickup_requests(id) on delete cascade,
  from_status public.pickup_status,
  to_status public.pickup_status not null,
  changed_by uuid,
  changed_at timestamptz not null default now()
);
grant select on public.request_status_history to authenticated;
grant all on public.request_status_history to service_role;
alter table public.request_status_history enable row level security;
create policy "history read via request" on public.request_status_history for select to authenticated using (
  exists (select 1 from public.pickup_requests p where p.id = request_id and (p.customer_id = auth.uid() or public.has_role(auth.uid(),'admin'))));

-- Status transition enforcement + history
create or replace function public.enforce_status_transition() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    if not (
      (old.status='pending' and new.status in ('confirmed','cancelled')) or
      (old.status='confirmed' and new.status in ('assigned','cancelled')) or
      (old.status='assigned' and new.status in ('picked_up','cancelled')) or
      (old.status='picked_up' and new.status in ('completed','cancelled'))
    ) then
      raise exception 'Invalid status change from % to %', old.status, new.status;
    end if;
    insert into public.request_status_history(request_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  if new.request_code <> old.request_code or new.estimated_total <> old.estimated_total then
    raise exception 'Request code and estimate cannot be changed';
  end if;
  return new;
end $$;
create trigger requests_status before update on public.pickup_requests for each row execute function public.enforce_status_transition();

-- Secure submission function
create sequence public.pickup_request_seq;
create or replace function public.submit_pickup_request(
  _name text, _mobile text, _address text, _pincode text, _preferred_date date, _notes text, _items jsonb
) returns table (request_code text, estimated_total numeric)
language plpgsql security definer set search_path = public as $$
declare
  _req_id uuid; _code text; _total numeric := 0; _item jsonb; _cat record; _qty numeric;
begin
  if _items is null or jsonb_typeof(_items) <> 'array' or jsonb_array_length(_items) = 0 then
    raise exception 'Select at least one material';
  end if;
  if jsonb_array_length(_items) > 20 then raise exception 'Too many items'; end if;
  if _preferred_date is not null and _preferred_date < current_date then
    raise exception 'Preferred date cannot be in the past';
  end if;
  _code := 'SCR-' || to_char(now() at time zone 'Asia/Kolkata','YYYYMMDD') || '-' || lpad(nextval('public.pickup_request_seq')::text, 4, '0');
  insert into public.pickup_requests(request_code, customer_id, customer_name, mobile, address, pincode, preferred_date, notes)
  values (_code, auth.uid(), trim(_name), trim(_mobile), trim(_address), trim(_pincode), _preferred_date, nullif(trim(coalesce(_notes,'')),''))
  returning id into _req_id;
  for _item in select * from jsonb_array_elements(_items) loop
    _qty := (_item->>'quantity')::numeric;
    select * into _cat from public.current_scrap_rates where category_id = (_item->>'category_id')::uuid;
    if not found then raise exception 'Material not available'; end if;
    insert into public.pickup_request_items(request_id, category_id, category_name, quantity, unit, rate_snapshot, line_estimate)
    values (_req_id, _cat.category_id, _cat.name, _qty, _cat.unit, _cat.rate_per_unit, round(_qty * _cat.rate_per_unit, 2));
    _total := _total + round(_qty * _cat.rate_per_unit, 2);
  end loop;
  -- bypass estimate-lock trigger check by setting before any status change (same row, estimate changes from 0)
  update public.pickup_requests set estimated_total = _total where id = _req_id;
  insert into public.request_status_history(request_id, from_status, to_status, changed_by) values (_req_id, null, 'pending', auth.uid());
  return query select _code, _total;
end $$;
grant execute on function public.submit_pickup_request(text,text,text,text,date,text,jsonb) to anon, authenticated;
