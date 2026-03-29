# GV Project Manager – Gruppo Visconti

Renewable energy project management system for wind, agro-photovoltaic, and BESS development. Built with **Next.js** + **Supabase**.

## Quick Start

### 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run the migrations in order:
   - `sql/01_schema.sql` — Core tables (projects, tasks, payments)
   - `sql/02_land.sql` — Land module (parcels + checks)
   - `sql/03_connection.sql` — Connection module (practices + steps)

### 2. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — enter your Supabase URL and anon key on the setup screen.

### 3. Auto-connect (optional)

Create `.env.local` to skip the setup screen:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 4. Deploy to Vercel

```bash
# Option A: Vercel CLI
npx vercel

# Option B: Push to GitHub → import at vercel.com
```

Add the two `NEXT_PUBLIC_*` environment variables in Vercel's project settings.

## Project Structure

```
gv-project-manager/
├── app/
│   ├── globals.css         ← All styles (design tokens baked in)
│   ├── layout.js           ← Root layout with metadata
│   └── page.js             ← Imports the client component
├── components/
│   └── ProjectManager.jsx  ← Full app ("use client")
├── lib/
│   └── supabase.js         ← Lightweight REST client
├── sql/
│   ├── 01_schema.sql       ← Core schema + seed data
│   ├── 02_land.sql         ← Land parcels + checks
│   └── 03_connection.sql   ← Connection practices + steps
├── package.json
├── next.config.js
└── jsconfig.json
```

## Features

- **Dashboard** — KPI widgets, project table with filters
- **Terreni** — Land parcels with CDU / Usi Civici / Aree Fuoco checks (full CRUD)
- **Connessione** — Terna / E-Distribuzione practices with 6-phase tracker (full CRUD)
- **Aviation** — ENAC / ENAV / Aeronautica Militare clearance tracking
- **Autorizzazione** — Authorization timeline with deadlines
- **Progettazione** — Design deliverables and cost tracking
- **SPV** — Special Purpose Vehicle constitution phases
- **Contabilità** — Accounting documents and fiscal deadlines
- **Task Manager** — Auto-linked tasks across all modules
- **Pagamenti** — Centralized payment register

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase RLS (anon policies for prototype) |
| Hosting | Vercel |
| Styling | Custom CSS (DM Sans + JetBrains Mono) |
