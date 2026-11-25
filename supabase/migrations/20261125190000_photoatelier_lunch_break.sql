alter table public.photoatelier_reservations add constraint photoatelier_lunch_break check (status = 'cancelled' or booking_time < time '12:00' or booking_time >= time '13:00') not valid;
