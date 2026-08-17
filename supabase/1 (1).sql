-- ============================================================
--  MIGRATION: Notifications
--  Run in Supabase -> SQL Editor (after all previous migrations).
--
--  A `notifications` table + triggers that auto-create a
--  notification whenever something happens that a user should know:
--    * someone offers on your request
--    * your offer is approved / rejected
--    * someone grabs your opening
--    * a referrer submits proof (seeker must confirm)
--    * a claim is confirmed (referrer gets RP) / rejected
--  Triggers are SECURITY DEFINER so they can always write.
-- ============================================================

create extension if not exists "uuid-ossp";

create table if not exists public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null,
  title       text not null,
  body        text,
  link        text,                      -- in-app path, e.g. /request/<id>
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_notif_user on public.notifications(user_id, read, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notif_read_own" on public.notifications;
create policy "notif_read_own" on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists "notif_update_own" on public.notifications;
create policy "notif_update_own" on public.notifications
  for update using (auth.uid() = user_id);

-- ============================================================
--  TRIGGER 1: new offer on a request  -> notify request owner
-- ============================================================
create or replace function public.notify_new_offer()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_role text;
begin
  select requester_id, role_title into v_owner, v_role
    from public.referral_requests where id = new.request_id;
  if v_owner is not null then
    insert into public.notifications(user_id, type, title, body, link)
    values (v_owner, 'offer_new', 'New referral offer 🤝',
            'Someone offered to refer you for ' || coalesce(v_role, 'a role') || '.',
            '/request/' || new.request_id);
  end if;
  return new;
end; $$;

drop trigger if exists trg_notify_new_offer on public.referral_offers;
create trigger trg_notify_new_offer
  after insert on public.referral_offers
  for each row execute function public.notify_new_offer();

-- ============================================================
--  TRIGGER 2: offer approved / rejected -> notify referrer
-- ============================================================
create or replace function public.notify_offer_decided()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_role text;
begin
  if new.status = old.status then return new; end if;
  select role_title into v_role from public.referral_requests where id = new.request_id;

  if new.status = 'approved' then
    insert into public.notifications(user_id, type, title, body, link)
    values (new.referrer_id, 'offer_approved', 'Referral approved 🎉',
            'Your referral for ' || coalesce(v_role, 'a role') || ' was approved — RP credited.',
            '/my-offers');
  elsif new.status = 'rejected' then
    insert into public.notifications(user_id, type, title, body, link)
    values (new.referrer_id, 'offer_rejected', 'Referral not approved',
            'Your referral for ' || coalesce(v_role, 'a role') || ' was declined.',
            '/my-offers');
  end if;
  return new;
end; $$;

drop trigger if exists trg_notify_offer_decided on public.referral_offers;
create trigger trg_notify_offer_decided
  after update on public.referral_offers
  for each row execute function public.notify_offer_decided();

-- ============================================================
--  TRIGGER 3: new claim on an opening -> notify opening owner
-- ============================================================
create or replace function public.notify_new_claim()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_role text;
begin
  select referrer_id, role_title into v_owner, v_role
    from public.referral_openings where id = new.opening_id;
  if v_owner is not null then
    insert into public.notifications(user_id, type, title, body, link)
    values (v_owner, 'claim_new', 'Someone grabbed your opening 🎁',
            'A seeker grabbed your ' || coalesce(v_role, 'opening') || '.',
            '/opening/' || new.opening_id);
  end if;
  return new;
end; $$;

drop trigger if exists trg_notify_new_claim on public.opening_claims;
create trigger trg_notify_new_claim
  after insert on public.opening_claims
  for each row execute function public.notify_new_claim();

-- ============================================================
--  TRIGGER 4: claim status change
--    proof_submitted -> notify seeker (confirm now)
--    approved        -> notify referrer (RP received)
--    rejected        -> notify the OTHER party
-- ============================================================
create or replace function public.notify_claim_decided()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_role text; v_actor uuid := auth.uid();
begin
  if new.status = old.status then return new; end if;
  select referrer_id, role_title into v_owner, v_role
    from public.referral_openings where id = new.opening_id;

  if new.status = 'proof_submitted' then
    insert into public.notifications(user_id, type, title, body, link)
    values (new.seeker_id, 'claim_proof', 'Action needed: confirm referral ✅',
            'The referrer submitted proof for ' || coalesce(v_role, 'the opening') ||
            '. Confirm to release RP.',
            '/opening/' || new.opening_id);

  elsif new.status = 'approved' then
    insert into public.notifications(user_id, type, title, body, link)
    values (v_owner, 'claim_approved', 'Referral confirmed 🎉',
            'A seeker confirmed your referral — RP received.',
            '/opening/' || new.opening_id);

  elsif new.status = 'rejected' then
    -- notify whoever did NOT reject
    if v_actor = new.seeker_id then
      insert into public.notifications(user_id, type, title, body, link)
      values (v_owner, 'claim_rejected', 'A grab was cancelled',
              'A seeker cancelled their grab on ' || coalesce(v_role, 'your opening') || '.',
              '/opening/' || new.opening_id);
    else
      insert into public.notifications(user_id, type, title, body, link)
      values (new.seeker_id, 'claim_rejected', 'Grab not accepted',
              'Your grab for ' || coalesce(v_role, 'an opening') || ' was declined.',
              '/my-offers');
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists trg_notify_claim_decided on public.opening_claims;
create trigger trg_notify_claim_decided
  after update on public.opening_claims
  for each row execute function public.notify_claim_decided();

-- ============================================================
--  DONE
-- ============================================================
