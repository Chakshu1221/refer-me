# Referral Openings — wiring guide

You already ran the Phase 1 SQL migration. Now add these files and 3 small edits.

## 1. File placement

| File | Put it at |
|------|-----------|
| `server/openings.js` | `server/src/routes/openings.js` |
| `client/openingsApi.js` | `client/src/lib/openingsApi.js` |
| `client/openings.css` | `client/src/pages/css/openings.css` |
| `client/BrowseOpenings.jsx` | `client/src/pages/BrowseOpenings.jsx` |
| `client/PostOpening.jsx` | `client/src/pages/PostOpening.jsx` |
| `client/OpeningDetail.jsx` | `client/src/pages/OpeningDetail.jsx` |
| `client/MyOpenings.jsx` | `client/src/pages/MyOpenings.jsx` |

## 2. Mount the backend route — `server/src/index.js`

Add the import near the other route imports:

```js
import openingRoutes from './routes/openings.js';
```

Add the mount near the other `app.use('/api/...')` lines:

```js
app.use('/api/openings', openingRoutes);
```

## 3. Add routes in the frontend — `client/src/App.jsx`

Add the imports:

```js
import BrowseOpenings from './pages/BrowseOpenings.jsx';
import PostOpening from './pages/PostOpening.jsx';
import OpeningDetail from './pages/OpeningDetail.jsx';
import MyOpenings from './pages/MyOpenings.jsx';
```

Add these routes inside `<Routes>` (protected like your others):

```jsx
<Route path="/openings" element={
  <ProtectedRoute><BrowseOpenings /></ProtectedRoute>
} />
<Route path="/offer" element={
  <ProtectedRoute><PostOpening /></ProtectedRoute>
} />
<Route path="/opening/:id" element={
  <ProtectedRoute><OpeningDetail /></ProtectedRoute>
} />
<Route path="/my-openings" element={
  <ProtectedRoute><MyOpenings /></ProtectedRoute>
} />
```

## 4. (Optional) Nav links — `client/src/components/Navbar.jsx`

Add to the `LINKS` array so people can reach the new marketplace:

```js
{ to: '/openings', label: 'Openings' },
{ to: '/my-openings', label: 'My Openings' },
```

`Ask` (your existing `/create`) stays for "request a referral".
`/offer` is the new "offer a referral" page — you can add a link/button anywhere.

## How the flow works (matches your fairness rules)

1. Referrer posts an opening (`/offer`): company, role, slots, RP price.
2. Seeker browses (`/openings`) → **grabs** a slot (attaches a resume, ideally from the vault).
3. Referrer opens the opening → for each grab: **Refer & upload proof** (mandatory).
4. Seeker sees proof → **Approve** → RP moves **seeker → referrer** (plain transfer, no escrow/ledger). Slot is used; when slots run out the opening auto-fills/closes.
5. Either side can **reject** with a reason.

RP direction stays consistent with requests: the person **receiving** the referral pays, the person **giving** it earns. Proof is always mandatory before any RP moves.
