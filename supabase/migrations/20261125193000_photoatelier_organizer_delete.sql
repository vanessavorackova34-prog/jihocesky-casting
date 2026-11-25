grant delete on public.photoatelier_reservations to authenticated;
create policy photoatelier_organizer_delete on public.photoatelier_reservations
for delete to authenticated using ((select public.photoatelier_is_organizer()));
