# GeoStock — Web App (Frontend)

A modern, **map-centric Supply Chain Management (SCM)** platform. Manage warehouses, stores,
inventory, transfers, sales and analytics for multiple companies from a single dashboard —
every warehouse and store is a live node on an interactive map, with real-time updates.

Built with **React + TypeScript + Vite + TailwindCSS**, in a Binance-inspired dark UI.

---

## 🚀 Live demo

### ▶︎ **https://geo-stack-five.vercel.app**

Sign in with any of these demo accounts (they showcase different roles & permissions):

| Email | Password | Role | What you can do |
|---|---|---|---|
| `owner@northwind.co` | `Demo1234!` | **Company Owner** | Everything — full access |
| `manager@northwind.co` | `Demo1234!` | Warehouse Manager | Inventory, transfers, dispatch/receive |
| `store@northwind.co` | `Demo1234!` | Store Manager | Sales, requests, receive stock |
| `cashier@northwind.co` | `Demo1234!` | Cashier | Record sales |
| `analyst@northwind.co` | `Demo1234!` | Analyst | **Read-only** — view everything, change nothing |

> Tip: sign in as the **Owner** for the full experience, then try the **Analyst** to see how the
> UI hides every create/edit/delete action for read-only roles. You can also **register your own
> company** from the login screen to start with a clean workspace.

- **Backend API:** https://geostack-backend.onrender.com  ·  [backend repo](https://github.com/Archit-Chauhan/GeoStack-Backend)

---

## Highlights

- 🗺️ **Live network map** — warehouses & stores plotted on Leaflet + OpenStreetMap, colored by
  type; click a node for its inventory summary, manager and capacity.
- 📊 **Dashboard** — revenue / inventory / transfer / low-stock KPIs, throughput & category charts.
- 🔄 **Transfers** — full lifecycle (`requested → … → received`) with a visual pipeline stepper.
- 📦 **Inventory & Sales** — filterable tables, stock adjustments, point-of-sale flow.
- 🔐 **Role-based UI** — sidebar items and actions are gated by the signed-in user's permissions.
- ⚡ **Real-time** — inventory/transfer/sale changes push over Socket.IO and update the UI live.
- 🌗 **Dark / light theme** with a persistent toggle.

---

## Tech stack

| Concern | Choice |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| Styling | TailwindCSS (Binance-inspired design tokens) |
| Server state | TanStack Query (React Query) |
| Client state | Redux Toolkit (auth + UI) |
| Routing | React Router v6 (protected routes + RBAC guards) |
| HTTP | axios (Bearer + auto token-refresh interceptor) |
| Real-time | socket.io-client |
| Maps | Leaflet + React-Leaflet (OpenStreetMap / CartoDB tiles) |
| Charts | Recharts |
| Motion | Framer Motion |

---

## Architecture

- **State** — `authSlice` + `uiSlice` in Redux Toolkit (token, user, theme, sidebar; persisted to
  `localStorage`); all server data flows through **TanStack Query** hooks (`features/*`).
- **API client** (`lib/api.ts`) — axios instance with `withCredentials`, a Bearer interceptor, and
  a single-flight **401 → `/auth/refresh` → retry → logout** flow. Unwraps the
  `{ success, data }` envelope.
- **Real-time** (`lib/socket.ts` + `SocketProvider`) — connects with the access token and maps
  server events to `queryClient.invalidateQueries`, so the UI stays live.
- **RBAC** (`lib/rbac.ts`) — mirrors the backend role→permission map; a `<Can permission>` guard
  and `usePermissions` hook hide UI the role can't use (the server still enforces).
- **Design system** — dark-first tokens (near-black canvas, single yellow accent, trading
  green/red) in `index.css`, wired into Tailwind; `Inter` for text, `JetBrains Mono` for numbers.

```
client/src/
├─ app/            # Redux store + hooks
├─ lib/            # api, socket, queryClient, rbac, colors, format
├─ features/       # TanStack Query hooks per resource (auth, warehouses, inventory, …)
├─ components/     # Layout, Sidebar, Navbar, ui/*, NetworkMap, charts/*, TransferPipeline
├─ pages/          # Login, Register, Dashboard, Map, Warehouses, Stores, Inventory,
│                  #   Transfers, Sales, Analytics, Settings
├─ routes/         # ProtectedRoute + RBAC route config
└─ types/          # shared API entity types
```

---

## Environment variables

Copy `.env.example` → `.env`:

| Key | Value (local) |
|---|---|
| `VITE_API_URL` | `http://localhost:5000/api/v1` |
| `VITE_SOCKET_URL` | `http://localhost:5000` |

> These are **baked in at build time** — in production set them to the deployed API
> (`https://geostack-backend.onrender.com/api/v1` and `https://geostack-backend.onrender.com`)
> and rebuild if you change them.

---

## Local development

```bash
npm install
cp .env.example .env          # point VITE_API_URL at your backend
npm run dev                    # Vite dev server on http://localhost:5173
npm run build                  # type-check + production build to dist/
```

Requires the [backend](https://github.com/Archit-Chauhan/GeoStack-Backend) running (locally or the
hosted API).

---

## Deployment (Vercel)

- **Framework preset:** Vite · **Root Directory:** blank · **Build:** `npm run build` · **Output:** `dist`
- **Environment variables:** `VITE_API_URL`, `VITE_SOCKET_URL` → the deployed backend.
- **SPA routing:** a `vercel.json` rewrite (`/(.*) → /index.html`) is committed so client-side
  routes like `/login` and `/dashboard` don't 404.
- On the backend, set `CLIENT_URL` to this app's origin so CORS + the refresh cookie work.

Deployed at **https://geo-stack-five.vercel.app**.
