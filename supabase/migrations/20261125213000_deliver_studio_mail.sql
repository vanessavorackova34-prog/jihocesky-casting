create extension if not exists pg_cron;
create extension if not exists pg_net;
select vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'studio_mail_worker_token');
create table studio_private.mail_delivery(
 event_id bigint references studio_private.reservation_mail(id) on delete cascade,
 recipient text not null,
 retry_after timestamptz default now() not null,
 claim uuid, sent_at timestamptz, attempts integer default 0 not null,
 primary key(event_id,recipient)
);
create function public.studio_claim_email(p_token text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare job record; credential text; lease uuid:=gen_random_uuid();
begin
 if not exists(select 1 from vault.decrypted_secrets where name='studio_mail_worker_token' and decrypted_secret=p_token) then raise insufficient_privilege; end if;
 select decrypted_secret into credential from vault.decrypted_secrets where name='studio_smtp_password';
 if coalesce(credential,'')='' then return null; end if;
 insert into studio_private.mail_delivery(event_id,recipient)
 select m.id, dest.email from studio_private.reservation_mail m
 join public.photoatelier_reservations r on r.id=m.reservation_id
 cross join lateral (select email from studio_private.new_booking_recipients where m.event='new_booking'
 union all select r.email where m.event='client_confirmation' and r.status='confirmed') dest
 where m.sent_at is null and r.status<>'cancelled' and m.booking_date >= (now() at time zone 'Europe/Prague')::date
 on conflict do nothing;
 select d.event_id,d.recipient,m.event,m.booking_date,m.booking_time into job
 from studio_private.mail_delivery d join studio_private.reservation_mail m on m.id=d.event_id
 join public.photoatelier_reservations r on r.id=m.reservation_id
 where d.sent_at is null and d.retry_after<=now() and r.status<>'cancelled'
 and m.booking_date >= (now() at time zone 'Europe/Prague')::date
 and (m.event<>'new_booking' or exists(select 1 from studio_private.new_booking_recipients n where n.email=d.recipient))
 order by d.retry_after,d.event_id limit 1 for update of d skip locked;
 if not found then return null; end if;
 update studio_private.mail_delivery set claim=lease, attempts=attempts+1, retry_after=now()+make_interval(mins=>least(60,3+attempts*3)) where event_id=job.event_id and recipient=job.recipient;
 return to_jsonb(job)||jsonb_build_object('lease',lease,'password',credential);
end $$;
create function public.studio_ack_email(p_token text,p_lease uuid) returns void
language plpgsql security definer set search_path='' as $$
declare event_key bigint;
begin
 if not exists(select 1 from vault.decrypted_secrets where name='studio_mail_worker_token' and decrypted_secret=p_token) then raise insufficient_privilege; end if;
 update studio_private.mail_delivery set sent_at=now(),claim=null where claim=p_lease returning event_id into event_key;
 update studio_private.reservation_mail set sent_at=now() where id=event_key and not exists(select 1 from studio_private.mail_delivery where event_id=event_key and sent_at is null);
end $$;
revoke all on function public.studio_claim_email(text),public.studio_ack_email(text,uuid) from public,authenticated;
grant execute on function public.studio_claim_email(text),public.studio_ack_email(text,uuid) to anon;
select cron.schedule('studio-booking-emails','* * * * *',$cron$
select net.http_post(url:='https://databaze.lexapacasting.cz/api/studio-mail',headers:=jsonb_build_object('Authorization','Bearer '||decrypted_secret),body:='{}'::jsonb,timeout_milliseconds:=55000)
from vault.decrypted_secrets where name='studio_mail_worker_token'
and exists(select 1 from vault.secrets where name='studio_smtp_password')
and exists(select 1 from studio_private.reservation_mail where sent_at is null and booking_date>=(now() at time zone 'Europe/Prague')::date)
$cron$);