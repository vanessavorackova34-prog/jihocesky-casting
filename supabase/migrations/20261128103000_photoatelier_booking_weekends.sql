create or replace function public.photoatelier_enforce_booking_weekends()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  days_from_friday integer := (extract(dow from new.booking_date)::integer + 2) % 7;
  friday integer := extract(day from new.booking_date)::integer - days_from_friday;
begin
  if days_from_friday > 2 or (friday not between 1 and 7 and friday not between 15 and 21) then
    raise exception 'Photoatelier booking weekend unavailable' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create or replace trigger photoatelier_enforce_booking_weekends
before insert on public.photoatelier_reservations
for each row execute function public.photoatelier_enforce_booking_weekends();
