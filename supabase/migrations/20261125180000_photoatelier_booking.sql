alter table public.photoatelier_reservations add column if not exists note text;

create or replace function public.photoatelier_booked_times(p_date date)
returns setof time
language sql stable security definer set search_path = ''
as $$
  select booking_time from public.photoatelier_reservations
  where booking_date = p_date and status <> 'cancelled';
$$;

create or replace function public.photoatelier_book(
  p_date date, p_time time, p_name text, p_email text, p_phone text, p_note text
)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if p_date is null or p_date < (now() at time zone 'Europe/Prague')::date + 7
    or p_time is null or coalesce(length(trim(p_name)), 0) not between 2 and 120
    or coalesce(length(trim(p_email)), 0) not between 5 and 254
    or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or coalesce(length(regexp_replace(p_phone, '[^0-9]', '', 'g')), 0) not between 7 and 15
    or length(p_phone) > 32 or length(p_note) > 1000
  then
    raise exception 'Invalid reservation' using errcode = '22023';
  end if;

  insert into public.photoatelier_reservations
    (booking_date, booking_time, client_name, email, phone, note)
  values
    (p_date, p_time, trim(p_name), trim(p_email), trim(p_phone), nullif(trim(p_note), ''));
end;
$$;

create or replace function public.photoatelier_is_organizer()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.users
    where lower(email) = lower(auth.jwt()->>'email') and role = 'organizer'
  );
$$;

revoke all on function public.photoatelier_booked_times(date) from public;
revoke all on function public.photoatelier_book(date,time,text,text,text,text) from public;
revoke all on function public.photoatelier_is_organizer() from public, anon;
grant execute on function public.photoatelier_booked_times(date) to anon, authenticated;
grant execute on function public.photoatelier_book(date,time,text,text,text,text) to anon, authenticated;
grant execute on function public.photoatelier_is_organizer() to authenticated;

revoke all on public.photoatelier_reservations from anon, authenticated;
grant select, update (booking_time, status) on public.photoatelier_reservations to authenticated;

create policy photoatelier_organizer_read on public.photoatelier_reservations
for select to authenticated using ((select public.photoatelier_is_organizer()));

create policy photoatelier_organizer_update on public.photoatelier_reservations
for update to authenticated
using ((select public.photoatelier_is_organizer()))
with check ((select public.photoatelier_is_organizer()));
