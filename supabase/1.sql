-- ============================================================
--  MIGRATION: Referral Openings (the reverse direction)
--  Run in Supabase -> SQL Editor AFTER schema.sql + documents.sql.
--
--  Model (mirrors your requests, same fairness rules):
--    * A REFERRER posts an OPENING they can refer for.
--    * A SEEKER grabs it (a "claim") with a resume - MANDATORY.
--    * The referrer refers them, uploads PROOF - MANDATORY.
--    * The SEEKER confirms -> RP moves SEEKER -> REFERRER.
--  No escrow, no ledger. Plain deduct + credit, exactly like approve_offer.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
--  TABLE: referral_openings
--  Posted by a referrer. Has a number of slots.
-- ============================================================
create table if not exists public.referral_openings (
  id            uuid primary key default uuid_generate_v4(),
  referrer_id   uuid not null references public.profiles(id) on delete cascade,
  company_name  text not null,
  role_title    text not null,
  job_link      text,
  jd_doc_url    text,                        -- Cloudinary URL (optional JD)
  notes         text,
  slots         integer not null default 1 check (slots between 1 and 20),
  slots_filled  integer not null default 0,
  rp_price      integer not null default 50 check (rp_price between 10 and 500),
  status        text not null default 'open'
                check (status in ('open','filled','closed')),
  created_at    timestamptz not null default now()
);

create index if not exists idx_openings_status on public.referral_openings(status);
create index if not exists idx_openings_owner  on public.referral_openings(referrer_id);

-- ============================================================
--  TABLE: opening_claims  (a seeker grabs an opening)
--  resume_url mandatory on create; proof_url set later by referrer.
-- ============================================================
create table if not exists public.opening_claims (
  id                uuid primary key default uuid_generate_v4(),
  opening_id        uuid not null references public.referral_openings(id) on delete cascade,
  seeker_id         uuid not null references public.profiles(id) on delete cascade,
  resume_url        text not null,           -- MANDATORY: seeker's resume (vault or upload)
  message           text,
  proof_url         text,                    -- set by referrer when they refer
  proof_hash        text,
  status            text not null default 'pending'
                    check (status in ('pending','proof_submitted','approved','rejected')),
  rejection_reason  text,
  decided_at        timestamptz,
  created_at        timestamptz not null default now(),
  unique (opening_id, seeker_id)             -- one claim per seeker per opening
);

create index if not exists idx_claims_opening on public.opening_claims(opening_id);
create index if not exists idx_claims_seeker   on public.opening_claims(seeker_id);

-- ============================================================
--  RPC: submit_claim_proof
--  Called by the REFERRER (opening owner). Attaches proof to a claim.
-- ============================================================
create or replace function public.submit_claim_proof(p_claim_id uuid, p_proof_url text, p_proof_hash text default null)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_claim   public.opening_claims%rowtype;
  v_opening public.referral_openings%rowtype;
  v_caller  uuid := auth.uid();
begin
  if p_proof_url is null or length(trim(p_proof_url)) = 0 then
    raise exception 'PROOF_REQUIRED';
  end if;

  select * into v_claim from public.opening_claims where id = p_claim_id for update;
  if not found then raise exception 'CLAIM_NOT_FOUND'; end if;

  select * into v_opening from public.referral_openings where id = v_claim.opening_id for update;
  if not found then raise exception 'OPENING_NOT_FOUND'; end if;

  -- only the opening owner (referrer) may attach proof
  if v_opening.referrer_id <> v_caller then raise exception 'NOT_AUTHORISED'; end if;
  if v_claim.status <> 'pending' then raise exception 'CLAIM_ALREADY_DECIDED'; end if;

  update public.opening_claims
    set proof_url = p_proof_url, proof_hash = p_proof_hash, status = 'proof_submitted'
    where id = v_claim.id;

  return json_build_object('ok', true, 'claim_id', v_claim.id);
end;
$$;

-- ============================================================
--  RPC: approve_claim  (the money move - plain, no ledger)
--  Called by the SEEKER after the referrer submitted proof.
--  Deducts rp_price from seeker, credits referrer. Fills a slot.
-- ============================================================
create or replace function public.approve_claim(p_claim_id uuid)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_claim      public.opening_claims%rowtype;
  v_opening    public.referral_openings%rowtype;
  v_caller     uuid := auth.uid();
  v_seek_bal   integer;
begin
  select * into v_claim from public.opening_claims where id = p_claim_id for update;
  if not found then raise exception 'CLAIM_NOT_FOUND'; end if;

  select * into v_opening from public.referral_openings where id = v_claim.opening_id for update;
  if not found then raise exception 'OPENING_NOT_FOUND'; end if;

  -- only the seeker who made the claim may approve/confirm
  if v_claim.seeker_id <> v_caller then raise exception 'NOT_AUTHORISED'; end if;
  if v_claim.status <> 'proof_submitted' then raise exception 'PROOF_NOT_SUBMITTED'; end if;
  if v_claim.proof_url is null then raise exception 'PROOF_REQUIRED'; end if;

  -- seeker must have enough RP
  select rp_balance into v_seek_bal from public.profiles where id = v_claim.seeker_id for update;
  if v_seek_bal < v_opening.rp_price then raise exception 'INSUFFICIENT_RP'; end if;

  -- ===== plain transfer: deduct seeker, credit referrer =====
  update public.profiles
    set rp_balance = rp_balance - v_opening.rp_price
    where id = v_claim.seeker_id;

  update public.profiles
    set rp_balance  = rp_balance + v_opening.rp_price,
        trust_score = trust_score + 2
    where id = v_opening.referrer_id;

  -- mark claim approved
  update public.opening_claims
    set status = 'approved', decided_at = now()
    where id = v_claim.id;

  -- fill a slot; close opening if full
  update public.referral_openings
    set slots_filled = slots_filled + 1,
        status = case when slots_filled + 1 >= slots then 'filled' else status end
    where id = v_opening.id;

  return json_build_object(
    'ok', true,
    'rp_moved', v_opening.rp_price,
    'referrer_id', v_opening.referrer_id,
    'opening_id', v_opening.id
  );
end;
$$;

-- ============================================================
--  RPC: reject_claim  (referrer OR seeker can reject; reason required)
-- ============================================================
create or replace function public.reject_claim(p_claim_id uuid, p_reason text)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_claim   public.opening_claims%rowtype;
  v_opening public.referral_openings%rowtype;
  v_caller  uuid := auth.uid();
begin
  if p_reason is null or length(trim(p_reason)) < 3 then
    raise exception 'REASON_REQUIRED';
  end if;

  select * into v_claim from public.opening_claims where id = p_claim_id for update;
  if not found then raise exception 'CLAIM_NOT_FOUND'; end if;

  select * into v_opening from public.referral_openings where id = v_claim.opening_id;
  if not found then raise exception 'OPENING_NOT_FOUND'; end if;

  -- either party may reject
  if v_caller <> v_opening.referrer_id and v_caller <> v_claim.seeker_id then
    raise exception 'NOT_AUTHORISED';
  end if;
  if v_claim.status in ('approved','rejected') then raise exception 'CLAIM_ALREADY_DECIDED'; end if;

  update public.opening_claims
    set status = 'rejected', rejection_reason = p_reason, decided_at = now()
    where id = v_claim.id;

  return json_build_object('ok', true, 'claim_id', v_claim.id);
end;
$$;

-- ============================================================
--  ROW LEVEL SECURITY
-- ============================================================
alter table public.referral_openings enable row level security;
alter table public.opening_claims    enable row level security;

-- ---- referral_openings ----
drop policy if exists "openings_read_all" on public.referral_openings;
create policy "openings_read_all" on public.referral_openings
  for select using (true);

drop policy if exists "openings_insert_own" on public.referral_openings;
create policy "openings_insert_own" on public.referral_openings
  for insert with check (auth.uid() = referrer_id);

drop policy if exists "openings_update_own" on public.referral_openings;
create policy "openings_update_own" on public.referral_openings
  for update using (auth.uid() = referrer_id);

-- ---- opening_claims ----
-- readable by the seeker who made it OR the referrer who owns the opening
drop policy if exists "claims_read_involved" on public.opening_claims;
create policy "claims_read_involved" on public.opening_claims
  for select using (
    auth.uid() = seeker_id
    or auth.uid() = (select referrer_id from public.referral_openings o where o.id = opening_id)
  );

-- a seeker can claim an opening (resume mandatory, not their own opening)
drop policy if exists "claims_insert_seeker" on public.opening_claims;
create policy "claims_insert_seeker" on public.opening_claims
  for insert with check (
    auth.uid() = seeker_id
    and resume_url is not null
    and auth.uid() <> (select referrer_id from public.referral_openings o where o.id = opening_id)
  );

-- ============================================================
--  DONE
-- ============================================================
