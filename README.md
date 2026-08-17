<div align="center">

# 🤝 Refer Me!

### The fair referral marketplace where professionals help each other get hired.

*Give a referral, earn the right to get one. No favours hoarded. No free-riding.*

`give-to-get` · `proof-backed` · `everyone-starts-equal`

</div>

---

## 📌 Table of contents

1. [The problem](#-the-problem)
2. [The idea](#-the-idea-in-one-line)
3. [Why Refer Me! is different](#-why-refer-me-is-different)
4. [How it works](#-how-it-works)
5. [The Referral Points (RP) economy](#-the-referral-points-rp-economy)
6. [Feature list](#-feature-list)
7. [Who it's for](#-who-its-for-personas)
8. [Real user journeys](#-real-user-journeys)
9. [Trust & safety](#-trust--safety)
10. [Premium](#-premium)
11. [Tech overview](#-tech-overview)
12. [Setup & deployment](#-setup--deployment)
13. [Roadmap](#-roadmap)
14. [FAQ](#-faq)

---

## 🎯 The problem

Getting a job today is less about applications and more about **referrals**. A referred
candidate is many times more likely to get an interview. But referrals are broken:

- 🙇 **Asking is awkward.** You cold-message strangers on LinkedIn and get ignored.
- 🎭 **It's one-sided.** Some people only ever *take* referrals and never give back.
- 🤥 **Fake promises.** "Sure, I referred you!" — but did they really?
- 🕸️ **No structure.** No way to find who at a company is actually willing to refer.

There's no fair, trustworthy place where **giving** and **getting** referrals is balanced.

---

## 💡 The idea in one line

> **Refer Me!** is a two-sided referral marketplace where a simple points economy makes
> helping each other the *only* way to get ahead — and every referral must be **proven**.

If you want referrals, you have to give referrals. Simple, fair, self-sustaining.

---

## 🌟 Why Refer Me! is different

| Ordinary networking | **Refer Me!** |
|---------------------|---------------|
| Beg strangers for favours | A **marketplace** of people ready to help |
| Takers exploit the system | **Give-to-get economy** — takers run out of points |
| "I'll refer you" (maybe) | **Proof mandatory** before anything counts |
| Head starts for the popular | **Everyone starts equal** (100 points) |
| Pay to win | Points earned **only** by genuinely helping |
| No accountability | **Trust score** + reasons on every rejection |

The magic isn't "connecting people" — LinkedIn does that. The magic is making referrals
**fair, mutual, and real.**

---

## 🔁 How it works

Refer Me! works in **two directions** — you can pull help toward you, or push help out.

### 🙋 Direction 1 — Requests (you ask)
> *"Please refer me at Google for an SDET role."*

1. You post a **request** and set a points reward.
2. Someone who works there refers you and **uploads proof**.
3. You review the proof and **approve** — points transfer to them. 🎉

### 🎁 Direction 2 — Openings (you offer)
> *"I can refer 2 people at Google for SDET."*

1. You post an **opening** with a few slots.
2. Job seekers **grab a slot** and attach their resume.
3. You refer them, **upload proof**, they **approve** — you earn points.

Either way, the rule is the same:
**the person receiving the referral pays points, the person giving it earns them — and proof is always required.**

---

## ⚡ The Referral Points (RP) economy

RP is the heartbeat of fairness. It's not money and it can't be bought outright.

| Action | RP effect | Why |
|--------|-----------|-----|
| 🆕 Sign up | **+100 RP** | Everyone starts identical — no head starts |
| 🙏 Get referred (request or opening) | **− reward** | You can't just keep taking |
| 🤝 Give a referral (proven + approved) | **+ reward** | Helping is the *only* way to keep going |
| 🛡️ Successful, verified help | **Trust ↑** | Good actors rise |
| 🚩 False rejection / abuse | **Trust ↓** | Bad actors throttle themselves out |

**Design choices that keep it clean:**
- 💸 **No escrow, no ledger complexity** — on approval, points are simply deducted from
  one person and credited to the other, atomically.
- 🔒 **You can never promise more RP than you hold** — enforced on both the slider and the server.
- 🧾 **Points move only after proof is approved** — silence or fake claims can't cheat anyone.

The result: a take-only account naturally **runs out of points** and must start helping.
The community polices itself.

---

## 🧩 Feature list

### 👤 Identity & profile
- 🔐 **Google sign-in** (one-tap, no passwords)
- 📝 Mandatory profile setup (company, role, seniority)
- 🖼️ Avatar upload
- 🛡️ **Trust score** + 💎 Premium badge shown across the app
- 📊 Personal stats: RP balance, trust, plan

### 📁 Document vault *(storage-saving power feature)*
- Save multiple **named resumes / JDs once** (e.g. "Backend Resume 2026")
- **Reuse them** when asking for or grabbing referrals — no re-uploading
- Saves Cloudinary storage and your time
- View / delete anytime

### 🙋 Requests marketplace
- Post a referral request with role, company, JD, resume, notes
- **Points-reward slider** capped to your wallet
- Rich, searchable/filterable job-board style browse
- Offer to refer with **mandatory proof upload**
- Approve / reject (reason required) with a **proof lightbox**

### 🎁 Openings marketplace *(new)*
- Post *"I can refer X people"* with **multiple slots** and a price
- Seekers **grab a slot** using a saved resume
- Referrer refers → **uploads proof** → seeker **approves** → points move
- Slots auto-decrement; opening auto-fills when full
- "My Openings" with **Posted** vs **Grabbed** tabs

### 🏠 Dashboard
- Personalized greeting + live RP counter
- Stat cards (posted / open / fulfilled / referrals given)
- Quick actions and recent activity

### 💎 Premium
- Monthly / yearly plans with a live **savings** calculation
- Higher limits, priority placement, advanced filters, larger vault, Verified Pro badge
- **Never grants free RP** — fairness stays sacred

### 🎨 Experience
- World-class, responsive UI (mobile / tablet / laptop)
- Consistent design language across every screen
- Skeleton loaders, empty states, inline validation, toasts
- Light-only theme (no broken auto-dark inversion)

---

## 👥 Who it's for (personas)

- **🎓 The Job Seeker** — wants referrals at target companies without cold-messaging.
- **🤝 The Helper** — happy to refer good people and get rewarded (and karma) for it.
- **🔁 The Switcher** — both at once: gives referrals in their domain, seeks them elsewhere.
- **🚀 The Networker** — builds trust score and reputation as a reliable connector.

Most users are **all of these at different times** — which is exactly why the give-to-get
loop works.

---

## 🎬 Real user journeys

### Journey A — "I need a referral at Stripe"
1. Priya signs up → gets 100 RP → completes profile.
2. Posts a **request**: *Backend Engineer @ Stripe*, reward 80 RP, attaches her saved resume from the **vault**.
3. Rahul (works at Stripe) sees it, refers her via Stripe's portal, **uploads the confirmation screenshot**.
4. Priya opens the proof in the lightbox, approves → **80 RP moves to Rahul**, her request is fulfilled.

### Journey B — "I can refer people at my company"
1. Rahul posts an **opening**: *2 slots, SDET @ Stripe, 60 RP each*.
2. Two seekers **grab** slots with their resumes.
3. Rahul refers both, **uploads proof** on each claim.
4. Each seeker **approves** → Rahul earns **120 RP total**, opening auto-fills.

### Journey C — "I keep my resumes ready"
1. Meera uploads 3 named resumes to her **vault** once.
2. Every time she asks for or grabs a referral, she **picks one** — zero re-uploading.

---

## 🛡️ Trust & safety

Refer Me! is designed so **honesty is the easy path** and cheating is self-defeating:

- 🧾 **Proof-first** — no points move without an uploaded, approved proof.
- ⚖️ **Reason-gated rejections** — rejecting requires a written reason (discourages
  bad-faith refusals).
- 📉 **Reputation staking** — false rejections and upheld reports lower trust; low-trust
  accounts get throttled.
- 🚫 **Self-dealing blocked** — you can't refer your own request or grab your own opening.
- 🔑 **Row-Level Security** — users can only touch their own data at the database level.
- 🧮 **Wallet guard** — you can never spend points you don't have.

*(Planned: automated anti-collusion — reused-proof detection and mutual-referral flags.)*

---

## 💎 Premium

Premium is about **convenience and reach**, never buying your way past helping others:

| | Free (everyone equal) | Premium |
|---|---|---|
| Ask / give referrals | ✅ | ✅ |
| Proof-backed fairness | ✅ | ✅ |
| Daily limits | Standard | **Higher** |
| Feed placement | Standard | **Priority** |
| Advanced filters | — | ✅ |
| Document vault size | Standard | **Larger** |
| Verified Pro badge | — | ✅ |

**Premium never gives free RP.** The core economy stays identical for everyone.

---

## 🧱 Tech overview

| Layer | Tech |
|-------|------|
| Frontend | React + Vite (Render Static Site) |
| Auth | Supabase Auth — Google only |
| Database | Supabase Postgres + Row Level Security |
| Files | Cloudinary (signed uploads) |
| Backend | Node.js + Express (Render Web Service) |
| Payments | Razorpay subscriptions (stub) |

**Data model:** `profiles`, `referral_requests`, `referral_offers`, `user_documents`,
`referral_openings`, `opening_claims`, `subscriptions` — with atomic security-definer
RPCs handling every points transfer (no escrow, no ledger).

*(Full folder tree, tables, and RPC list are in [`ARCHITECTURE`](#-project-structure) below.)*

### 📁 Project structure

```
refer-me/
├── supabase/   schema.sql · documents.sql · openings.sql
├── server/     Express API — routes: profile, requests, offers,
│               documents, openings, uploads, subscriptions
└── client/     React app — pages, per-page CSS, auth context,
                api + openingsApi helpers
```

---

## 🚀 Setup & deployment

Deploys entirely on **Render** (no local run needed). Full step-by-step:

1. **Supabase** — create project → run `schema.sql`, `documents.sql`, `openings.sql` in
   order → copy URL + anon + service-role keys.
2. **Google OAuth** — create Web client → redirect URI
   `https://YOUR-PROJECT.supabase.co/auth/v1/callback` → paste ID/secret into Supabase.
3. **Cloudinary** — grab cloud name + API key + secret.
4. **GitHub** — push the repo.
5. **Render backend** (Web Service) — root `server`, add env vars (Supabase, Cloudinary,
   `STARTER_RP=100`).
6. **Render frontend** (Static Site) — root `client`, build `npm install && npm run build`,
   publish `dist`, add `VITE_*` vars, add SPA rewrite `/* → /index.html`.
7. **Wire URLs** — set backend `CLIENT_ORIGIN` and Supabase Site/Redirect URLs to the
   frontend URL.

> **Render free tier:** the API sleeps after ~15 min idle; first wake takes ~30–50s.

**Secrets rule:** the `service_role` key and Cloudinary secret live **only** on the
backend. The frontend uses the anon key.

---

## 🗺️ Roadmap

- [ ] Unified marketplace: one page with a **Requests ⇄ Openings** toggle
- [ ] Compact nav: grouped **Post ▾** and **Activity ▾** menus
- [ ] 🔔 In-app **notifications** (new offers, grabs, proofs, approvals)
- [ ] 🤖 Automated **anti-collusion** (reused-proof + mutual-referral detection)
- [ ] 💳 Real **Razorpay** subscription + webhook
- [ ] ⭐ Reviews / endorsements after a successful referral
- [ ] 📈 Leaderboard of top helpers by trust score

---

## ❓ FAQ

**Is Refer Me! free?**
Yes. Everyone starts with 100 RP and can fully use the platform for free. Premium only
adds convenience and higher limits.

**Does Premium give me free points?**
No — never. Points are earned only by genuinely helping people. The core stays equal.

**What stops fake referrals?**
Proof is mandatory before any points move, and rejections need a written reason. Trust
score punishes bad actors automatically.

**Who pays the points — the seeker or the referrer?**
The **person receiving** the referral pays; the **person giving** it earns. Same in both
Requests and Openings.

**Do I have to re-upload my resume every time?**
No — save it once in your **Document Vault** and reuse it anywhere.

---

<div align="center">

**Built for professionals who help each other. 🤝**

*Give-to-get. Proof-backed. Fair by design.*

</div>
