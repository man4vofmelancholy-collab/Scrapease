
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
  if new.request_code <> old.request_code or (old.estimated_total <> 0 and new.estimated_total <> old.estimated_total) then
    raise exception 'Request code and estimate cannot be changed';
  end if;
  return new;
end $$;

-- Sample starter materials (marked as samples; edit in admin)
with c as (
  insert into public.scrap_categories (name, slug, description, unit, sort_order) values
  ('Newspaper','newspaper','Old newspapers (sample rate)','kg',1),
  ('Cardboard','cardboard','Cartons and boxes (sample rate)','kg',2),
  ('Iron','iron','Iron and steel scrap (sample rate)','kg',3),
  ('Copper','copper','Copper wire and parts (sample rate)','kg',4),
  ('Aluminium','aluminium','Cans, utensils, frames (sample rate)','kg',5),
  ('Plastic','plastic','Hard plastic items (sample rate)','kg',6),
  ('Refrigerator','refrigerator','Old fridge, any size (sample rate)','piece',7)
  returning id, slug)
insert into public.scrap_rates (category_id, rate_per_unit)
select id, case slug when 'newspaper' then 14 when 'cardboard' then 8 when 'iron' then 26 when 'copper' then 425 when 'aluminium' then 105 when 'plastic' then 10 else 1200 end from c;
