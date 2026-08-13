# Refer Me! 🤝 — Full Setup & Render Deployment Guide

A fair, **give-to-get referral network**. Ask for referrals, give referrals, and a
simple **Referral Points (RP)** economy keeps everyone equal.

**Model:** plain — **no escrow, no ledger.** On approval, RP is **deducted from the
requester and credited to the referrer** in one atomic step. **Proof of referral is
mandatory** on every offer.

> ⚠️ **This guide assumes you are NOT running anything on your laptop.**
> Everything is set up in the browser and deployed **directly on Render**.
> You will only ever click around in dashboards — no terminal needed.

---

## 🗺️ The big picture — what you're about to create

You will create **6 things**, in this order. Each one gives you some secret
values (keys/IDs). Keep them in a notepad as you go — you'll paste them into
Render at the end.

| # | Where | What you get from it |
|---|-------|----------------------|
| 1 | **Supabase** | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| 2 | **Google Cloud** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (for Google sign-in) |
| 3 | **Cloudinary** | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| 4 | **GitHub** | your code repo (Render deploys from here) |
| 5 | **Render — Web Service** | your backend API, gives you an API URL |
| 6 | **Render — Static Site** | your frontend, gives you the public app URL |

📝 **Open a blank notepad now** and paste this template — you'll fill it in as you go:

```
SUPABASE_URL =
SUPABASE_ANON_KEY =
SUPABASE_SERVICE_ROLE_KEY =
GOOGLE_CLIENT_ID =
GOOGLE_CLIENT_SECRET =
CLOUDINARY_CLOUD_NAME =
CLOUDINARY_API_KEY =
CLOUDINARY_API_SECRET =
BACKEND_URL (from Render, step 5) =
FRONTEND_URL (from Render, step 6) =
```

---

## 1️⃣ Supabase — database, auth & keys

### 1.1 Create the project
1. Go to **https://supabase.com** → **Start your project** → sign in with GitHub.
2. Click **New project**.
3. Fill in:
   - **Name:** `refer-me`
   - **Database Password:** click **Generate a password**, then **copy it and save it** in your notepad (you may need it later; keep it safe).
   - **Region:** pick the one closest to you (e.g. **Mumbai / South Asia**).
4. Click **Create new project** and wait ~2 minutes for it to finish setting up.

### 1.2 Get your URL and keys
1. In the left sidebar click the **gear icon (Project Settings)** → **API**.
2. You'll see three values. Copy each into your notepad:
   - **Project URL** → this is your `SUPABASE_URL`
     (looks like `https://abcdefgh.supabase.co`)
   - **Project API keys → `anon` `public`** → this is your `SUPABASE_ANON_KEY`
   - **Project API keys → `service_role` `secret`** → this is your
     `SUPABASE_SERVICE_ROLE_KEY`
     ⚠️ **Never share the service_role key or put it in the frontend.** Backend only.

### 1.3 Create the database tables
1. In the left sidebar click **SQL Editor** → **+ New query**.
2. Open the file **`supabase/schema.sql`** from this project, copy **all** of it.
3. Paste it into the SQL editor and click **Run** (bottom right).
4. You should see **"Success. No rows returned."** ✅
   This created all tables, security rules, and the approve/reject logic.

---

## 2️⃣ Google Cloud — the Google sign-in credentials

This is what lets users click **"Continue with Google"**.

### 2.1 Create a project
1. Go to **https://console.cloud.google.com**.
2. At the very top, click the **project dropdown** → **New Project**.
3. Name it `refer-me` → **Create**. Wait a few seconds, then make sure this new
   project is **selected** in the top dropdown.

### 2.2 Configure the consent screen (what users see)
1. Left menu → **APIs & Services** → **OAuth consent screen**.
2. Choose **External** → **Create**.
3. Fill in the required fields:
   - **App name:** `Refer Me!`
   - **User support email:** your email
   - **Developer contact email:** your email
4. Click **Save and Continue** through the next screens (Scopes, Test users) —
   you can leave them default. On the last screen click **Back to Dashboard**.
5. On the OAuth consent screen, under **Publishing status**, click
   **Publish App** → **Confirm** (so anyone can sign in, not just test users).

### 2.3 Create the OAuth Client ID
1. Left menu → **APIs & Services** → **Credentials**.
2. Click **+ Create Credentials** → **OAuth client ID**.
3. **Application type:** **Web application**.
4. **Name:** `refer-me-web`.
5. Under **Authorized redirect URIs**, click **+ Add URI** and paste this — but
   swap in **your** Supabase project URL from step 1.2:
   ```
   https://YOUR-PROJECT.supabase.co/auth/v1/callback
   ```
   (Example: `https://abcdefgh.supabase.co/auth/v1/callback`)
6. Click **Create**.
7. A popup shows **Your Client ID** and **Your Client Secret**. Copy both into
   your notepad as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

### 2.4 Plug Google into Supabase
1. Back in **Supabase** → left sidebar **Authentication** → **Sign In / Providers**
   (older UI: **Providers**).
2. Find **Google** in the list → toggle it **ON**.
3. Paste your **`GOOGLE_CLIENT_ID`** into **Client ID** and
   **`GOOGLE_CLIENT_SECRET`** into **Client Secret**.
4. Click **Save**.

> ✅ Google sign-in is now connected. We'll set the redirect back to your app in
> **Step 7**, once we have the Render frontend URL.

---

## 3️⃣ Cloudinary — file storage (resume, JD, proof images)

1. Go to **https://cloudinary.com** → **Sign up for free** (Google sign-up is fine).
2. After signup you land on the **Dashboard / Programmable Media** page.
3. In the **Product Environment Credentials** box (top of the dashboard) you'll see:
   - **Cloud name** → your `CLOUDINARY_CLOUD_NAME`
   - **API Key** → your `CLOUDINARY_API_KEY`
   - **API Secret** → click the **eye / "reveal"** icon → your `CLOUDINARY_API_SECRET`
4. Copy all three into your notepad.

> That's it — no bucket or folder to create. The backend makes folders automatically.

---

## 4️⃣ GitHub — put the code online (Render deploys from GitHub)

Render builds your app from a GitHub repository, so the code needs to live there.

### Easiest way (all in the browser, no git commands):
1. Go to **https://github.com** → sign in → click **+ (top right)** → **New repository**.
2. **Repository name:** `refer-me` → keep it **Private** → **Create repository**.
3. On the new empty repo page, click **uploading an existing file** (the link in
   "Get started by …").
4. **Unzip** the `refer-me.zip` on your computer, then **drag the whole contents**
   of the `refer-me` folder into the browser upload box (drag the `server`,
   `client`, `supabase` folders and `README.md` together).
5. Wait for the files to finish uploading, then click **Commit changes**.

> 📌 Your repo now contains `/server`, `/client`, and `/supabase`. Render will use
> `/server` for the API and `/client` for the website.

---

## 5️⃣ Render — deploy the BACKEND (Node.js API)

1. Go to **https://render.com** → **Get Started** → sign in **with GitHub**
   (this lets Render see your repo).
2. Click **New +** (top right) → **Web Service**.
3. **Connect** your `refer-me` GitHub repo (authorize Render if it asks).
4. Fill in the settings:
   - **Name:** `refer-me-api`
   - **Region:** closest to you (e.g. **Singapore**)
   - **Branch:** `main`
   - **Root Directory:** `server`  ← **important**
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** **Free**
5. Scroll down to **Environment Variables** → click **Add Environment Variable**
   and add each of these (name on the left, your saved value on the right):

   | Key | Value |
   |-----|-------|
   | `SUPABASE_URL` | *(from notepad)* |
   | `SUPABASE_ANON_KEY` | *(from notepad)* |
   | `SUPABASE_SERVICE_ROLE_KEY` | *(from notepad)* |
   | `CLOUDINARY_CLOUD_NAME` | *(from notepad)* |
   | `CLOUDINARY_API_KEY` | *(from notepad)* |
   | `CLOUDINARY_API_SECRET` | *(from notepad)* |
   | `CLOUDINARY_UPLOAD_FOLDER` | `refer-me` |
   | `STARTER_RP` | `100` |
   | `MAX_OPEN_REQUESTS` | `5` |
   | `CLIENT_ORIGIN` | *(leave blank for now — you'll add it in Step 7)* |

6. Click **Create Web Service**. Render will build and start it (takes 1–3 min).
7. When it's live (green **"Live"** badge), copy the URL at the top — it looks like
   `https://refer-me-api.onrender.com`. Save it as **`BACKEND_URL`** in your notepad.
8. Test it: open `https://refer-me-api.onrender.com/health` in a browser — you
   should see `{"status":"healthy",...}` ✅

---

## 6️⃣ Render — deploy the FRONTEND (the website)

1. In Render click **New +** → **Static Site**.
2. Select the **same** `refer-me` repo.
3. Fill in:
   - **Name:** `refer-me-app`
   - **Branch:** `main`
   - **Root Directory:** `client`  ← **important**
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Scroll to **Environment Variables** → add these three:

   | Key | Value |
   |-----|-------|
   | `VITE_SUPABASE_URL` | *(your `SUPABASE_URL`)* |
   | `VITE_SUPABASE_ANON_KEY` | *(your `SUPABASE_ANON_KEY`)* |
   | `VITE_API_BASE` | *(your `BACKEND_URL` from step 5, e.g. `https://refer-me-api.onrender.com`)* |

5. Click **Create Static Site**. Wait for the build to finish.
6. Copy the site URL (e.g. `https://refer-me-app.onrender.com`). Save it as
   **`FRONTEND_URL`** in your notepad.

### 6.1 Make browser refresh work (SPA rewrite)
Because this is a single-page React app, add a redirect so deep links don't 404:
1. Open your `refer-me-app` static site in Render → **Redirects/Rewrites** tab.
2. Click **Add Rule**:
   - **Source:** `/*`
   - **Destination:** `/index.html`
   - **Action:** **Rewrite**
3. **Save**.

---

## 7️⃣ Connect the two URLs (final wiring) 🔗

Now that you have both URLs, link everything together:

### 7.1 Tell the backend to trust the frontend
1. Render → **refer-me-api** (the Web Service) → **Environment** tab.
2. Edit **`CLIENT_ORIGIN`** and set it to your **`FRONTEND_URL`**
   (e.g. `https://refer-me-app.onrender.com`) → **Save Changes**.
3. Render redeploys the API automatically.

### 7.2 Tell Supabase where to send users after Google login
1. Supabase → **Authentication** → **URL Configuration**.
2. **Site URL:** set to your **`FRONTEND_URL`**.
3. Under **Redirect URLs**, click **Add URL** and add your `FRONTEND_URL`
   (and `FRONTEND_URL/*` to be safe).
4. **Save**.

---

## ✅ 8️⃣ Test the whole thing

1. Open your **`FRONTEND_URL`** in a browser.
2. Click **Continue with Google** → sign in.
3. Fill in your profile (company, role) → **Save**.
4. You should land on the dashboard showing **⚡ 100 RP**.
5. Click **Ask** → post a referral request.
6. Open the app in a **different Google account** (or ask a friend), find your
   request under **Browse**, upload a **proof** image, and submit an offer.
7. Back in your first account, open the request → **Approve** → watch **RP move**
   from the requester to the referrer. 🎉

> 💤 **Note on Render Free tier:** the backend "sleeps" after ~15 min of no use, so
> the **first** request after idle can take ~30–50 seconds to wake up. This is
> normal on the free plan. (Later you can add a cron pinger or upgrade.)

---

## 🔐 Where each secret lives (quick reference)

| Secret | Frontend? | Backend? | Notes |
|--------|:--------:|:--------:|-------|
| `SUPABASE_URL` | ✅ | ✅ | public, safe |
| `SUPABASE_ANON_KEY` | ✅ | ✅ | public, safe |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ | ✅ | **secret** — backend only |
| `GOOGLE_CLIENT_ID / SECRET` | ❌ | ❌ | lives inside Supabase only |
| `CLOUDINARY_API_SECRET` | ❌ | ✅ | **secret** — backend only |

---

## 🧩 Troubleshooting

- **Google login shows "redirect_uri_mismatch"** → the URI in Google Cloud
  (Step 2.3) must be **exactly** `https://YOUR-PROJECT.supabase.co/auth/v1/callback`.
  Re-check for typos.
- **After login it loops / goes nowhere** → you forgot Step 7.2 (Supabase Site URL
  + Redirect URLs). Add your `FRONTEND_URL` there.
- **App loads but every action fails / CORS error** → `CLIENT_ORIGIN` on the
  backend (Step 7.1) doesn't match your frontend URL, or `VITE_API_BASE` is wrong.
- **Uploads fail** → re-check the three Cloudinary values on the **backend**.
- **"Success. No rows returned."** in SQL editor is **correct** — that means the
  schema ran fine.
- **First action after a break is very slow** → free-tier backend waking up; wait
  ~40 seconds and retry.

---

## 📁 Project structure

```
refer-me/
├── supabase/schema.sql      # tables, security rules, approve/reject logic
├── server/                  # Node.js + Express API  →  Render Web Service
│   ├── render.yaml
│   └── src/{config,middleware,routes,index.js}
└── client/                  # React + Vite website    →  Render Static Site
    └── src/{lib,context,components,pages}
```

---

## 💎 Premium (optional, later)

Premium raises **limits/convenience only** — it **never gives free RP**, so the
core stays equal for everyone. To make it real, create a **Razorpay** account,
add a subscription button, and call `/api/subscriptions/activate` from the
Razorpay **webhook** after a successful payment. Say the word and I'll wire it.
