-- ============================================================
--  REFER ME!  — Supabase schema (Postgres)
--  Model: NO escrow, NO ledger.
--  On approval: deduct rp_cost from requester, credit referrer.
--  Proof is MANDATORY on every offer (NOT NULL enforced).
-- ============================================================

-- ---------- Extensions ----------
create extension if not exists "uuid-ossp";

-- ============================================================
--  TABLE: profiles  (1 row per auth user)
-- ============================================================
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  email             text,
  full_name         text,
  avatar_url        text,
  current_company   text,
  role_title        text,
  seniority         text,                       -- e.g. Junior / Mid / Senior / Lead
  linkedin_url      text,
  rp_balance        integer not null default 100,   -- everyone starts equal
  trust_score       integer not null default 100,
  is_premium        boolean not null default false,
  premium_expiry    timestamptz,
  profile_complete  boolean not null default false,
  flagged           boolean not null default false,
  created_at        timestamptz not null default now()
);

-- ============================================================
--  TABLE: referral_requests
-- ============================================================
create table if not exists public.referral_requests (
  id            uuid primary key default uuid_generate_v4(),
  requester_id  uuid not null references public.profiles(id) on delete cascade,
  company_name  text not null,
  role_title    text not null,
  job_link      text,
  jd_doc_url    text,                     -- Cloudinary URL (job description)
  resume_url    text,                     -- Cloudinary URL (requester's resume)
  notes         text,
  rp_cost       integer not null default 50 check (rp_cost between 10 and 500),
  status        text not null default 'open'
                check (status in ('open','fulfilled','closed')),
  created_at    timestamptz not null default now()
);

create index if not exists idx_requests_status  on public.referral_requests(status);
create index if not exists idx_requests_owner    on public.referral_requests(requester_id);

-- ============================================================
--  TABLE: referral_offers  (proof mandatory)
-- ============================================================
create table if not exists public.referral_offers (
  id                uuid primary key default uuid_generate_v4(),
  request_id        uuid not null references public.referral_requests(id) on delete cascade,
  referrer_id       uuid not null references public.profiles(id) on delete cascade,
  proof_url         text not null,          -- MANDATORY: Cloudinary proof of referral
  proof_hash        text,                   -- to detect reused/recycled proofs
  message           text,
  status            text not null default 'pending'
                    check (status in ('pending','approved','rejected')),
  rejection_reason  text,
  decided_at        timestamptz,
  created_at        timestamptz not null default now(),
  unique (request_id, referrer_id)          -- one offer per referrer per request
);

create index if not exists idx_offers_request on public.referral_offers(request_id);
create index if not exists idx_offers_referrer on public.referral_offers(referrer_id);

-- ============================================================
--  TABLE: subscriptions (premium)
-- ============================================================
create table if not exists public.subscriptions (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  plan          text not null check (plan in ('monthly','yearly')),
  status        text not null default 'active'
                check (status in ('active','cancelled','expired')),
  provider_id   text,                       -- Razorpay subscription id
  start_date    timestamptz not null default now(),
  end_date      timestamptz,
  created_at    timestamptz not null default now()
);

-- ============================================================
--  TABLE: reports
-- ============================================================
create table if not exists public.reports (
  id            uuid primary key default uuid_generate_v4(),
  reporter_id   uuid not null references public.profiles(id) on delete cascade,
  target_id     uuid not null references public.profiles(id) on delete cascade,
  offer_id      uuid references public.referral_offers(id) on delete set null,
  reason        text not null,
  status        text not null default 'open' check (status in ('open','resolved')),
  created_at    timestamptz not null default now()
);

-- ============================================================
--  TRIGGER: auto-create profile row on new auth user
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
--  RPC: approve_offer  (the core money-move — plain, no ledger)
--  Called by the REQUESTER. Runs atomically.
-- ============================================================
create or replace function public.approve_offer(p_offer_id uuid)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_offer      public.referral_offers%rowtype;
  v_request    public.referral_requests%rowtype;
  v_caller     uuid := auth.uid();
  v_req_balance integer;
begin
  -- lock the offer row
  select * into v_offer from public.referral_offers
    where id = p_offer_id for update;
  if not found then raise exception 'OFFER_NOT_FOUND'; end if;

  select * into v_request from public.referral_requests
    where id = v_offer.request_id for update;
  if not found then raise exception 'REQUEST_NOT_FOUND'; end if;

  -- only the requester may approve
  if v_request.requester_id <> v_caller then
    raise exception 'NOT_AUTHORISED';
  end if;
  if v_offer.status <> 'pending' then
    raise exception 'OFFER_ALREADY_DECIDED';
  end if;
  if v_request.status <> 'open' then
    raise exception 'REQUEST_NOT_OPEN';
  end if;
  if v_offer.proof_url is null then
    raise exception 'PROOF_REQUIRED';
  end if;

  -- requester must have enough RP
  select rp_balance into v_req_balance from public.profiles
    where id = v_request.requester_id for update;
  if v_req_balance < v_request.rp_cost then
    raise exception 'INSUFFICIENT_RP';
  end if;

  -- ===== the plain transfer: deduct then credit =====
  update public.profiles
    set rp_balance = rp_balance - v_request.rp_cost
    where id = v_request.requester_id;

  update public.profiles
    set rp_balance  = rp_balance + v_request.rp_cost,
        trust_score = trust_score + 2
    where id = v_offer.referrer_id;

  -- mark this offer approved, request fulfilled
  update public.referral_offers
    set status = 'approved', decided_at = now()
    where id = v_offer.id;

  update public.referral_requests
    set status = 'fulfilled'
    where id = v_request.id;

  -- auto-reject the remaining pending offers on this request
  update public.referral_offers
    set status = 'rejected', rejection_reason = 'Another referrer was approved',
        decided_at = now()
    where request_id = v_request.id and id <> v_offer.id and status = 'pending';

  return json_build_object(
    'ok', true,
    'rp_moved', v_request.rp_cost,
    'referrer_id', v_offer.referrer_id,
    'request_id', v_request.id
  );
end;
$$;

-- ============================================================
--  RPC: reject_offer  (requester rejects; reason mandatory)
-- ============================================================
create or replace function public.reject_offer(p_offer_id uuid, p_reason text)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_offer   public.referral_offers%rowtype;
  v_request public.referral_requests%rowtype;
  v_caller  uuid := auth.uid();
begin
  if p_reason is null or length(trim(p_reason)) < 3 then
    raise exception 'REASON_REQUIRED';
  end if;

  select * into v_offer from public.referral_offers where id = p_offer_id for update;
  if not found then raise exception 'OFFER_NOT_FOUND'; end if;

  select * into v_request from public.referral_requests where id = v_offer.request_id;
  if v_request.requester_id <> v_caller then raise exception 'NOT_AUTHORISED'; end if;
  if v_offer.status <> 'pending' then raise exception 'OFFER_ALREADY_DECIDED'; end if;

  update public.referral_offers
    set status = 'rejected', rejection_reason = p_reason, decided_at = now()
    where id = v_offer.id;

  return json_build_object('ok', true, 'offer_id', v_offer.id);
end;
$$;

-- ============================================================
--  ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles          enable row level security;
alter table public.referral_requests enable row level security;
alter table public.referral_offers   enable row level security;
alter table public.subscriptions     enable row level security;
alter table public.reports           enable row level security;

-- ---- profiles ----
drop policy if exists "profiles_read_all"  on public.profiles;
create policy "profiles_read_all" on public.profiles
  for select using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- ---- referral_requests ----
drop policy if exists "requests_read_all" on public.referral_requests;
create policy "requests_read_all" on public.referral_requests
  for select using (true);

drop policy if exists "requests_insert_own" on public.referral_requests;
create policy "requests_insert_own" on public.referral_requests
  for insert with check (auth.uid() = requester_id);

drop policy if exists "requests_update_own" on public.referral_requests;
create policy "requests_update_own" on public.referral_requests
  for update using (auth.uid() = requester_id);

-- ---- referral_offers ----
drop policy if exists "offers_read_involved" on public.referral_offers;
create policy "offers_read_involved" on public.referral_offers
  for select using (
    auth.uid() = referrer_id
    or auth.uid() = (select requester_id from public.referral_requests r where r.id = request_id)
  );

drop policy if exists "offers_insert_own" on public.referral_offers;
create policy "offers_insert_own" on public.referral_offers
  for insert with check (
    auth.uid() = referrer_id
    and proof_url is not null
    and auth.uid() <> (select requester_id from public.referral_requests r where r.id = request_id)
  );

-- ---- subscriptions ----
drop policy if exists "subs_read_own" on public.subscriptions;
create policy "subs_read_own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- ---- reports ----
drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports
  for insert with check (auth.uid() = reporter_id);

drop policy if exists "reports_read_own" on public.reports;
create policy "reports_read_own" on public.reports
  for select using (auth.uid() = reporter_id);

-- ============================================================
--  DONE
-- ============================================================
