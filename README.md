# Mentrodex — Next.js (Phase 1)

Next.js App Router port of the static mentorship site in `../shopify-course`.

## Quick start

```bash
cd c:\Users\Ahmed\Documents\code\20-nov\mentrodex-website
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — routes: `/`, `/pay`, `/contact`.

## Environment (Supabase)

Copy env template values into `.env.local` (create the file if it does not exist):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Health check: [http://localhost:3000/api/health](http://localhost:3000/api/health)

Run SQL in Supabase SQL editor (in order):

1. `supabase/migrations/003_orders.sql` — `orders` table
2. `supabase/migrations/004_orders_image_upload.sql` — `image_upload` column
3. `supabase/migrations/005_storage_payment_screenshots.sql` — `payment-screenshots` bucket (server upload only)
4. `supabase/migrations/006_orders_insert_policy.sql` — grants + INSERT-only RLS (no anon SELECT)
5. `supabase/migrations/007_orders_country_and_value.sql` — `country` + `value` columns (if upgrading an older project)
6. `supabase/migrations/008_orders_meta_tracking.sql` — Meta attribution columns on `orders`
7. `supabase/migrations/009_lms_portal.sql` — LMS tables (Version-1 student portal)
8. `supabase/migrations/010_lms_revoke_client_roles.sql` — revoke anon/authenticated on LMS tables
9. `supabase/migrations/011_security_harden_orders_storage.sql` — drop anon SELECT on orders + payment storage policies (upgrade from old 006)

Do not run legacy `FIX_ORDERS_PERMISSIONS.sql` if it still included `allow_anon_select_orders`; use `011` instead.

**`orders` columns:** `order_id`, `city`, `country`, `currency`, `value` (default `4500`), `first_name`, `last_name`, `phone_number`, `event_name`, `image_upload`, `created_at`

Payment screenshots are uploaded server-side to Storage bucket **`payment-screenshots`**; `image_upload` stores the public URL. If uploads fail with permission errors, add **`SUPABASE_SERVICE_ROLE_KEY`** to `.env.local` (Dashboard → Settings → API → service_role, server-only).

## Phase 1 scope (done)

- UI from `index.html`, `pay.html`, `contact.html` with legacy CSS in `public/styles/`
- Dual mobile/desktop home layout (`HomeLegacyMarkup`, regenerated via `scripts/convert-home-body.mjs`)
- Simplified desktop hero (`desktop-hero-fallback.css`) — **not** the `hero-studio` Vite embed
- Pay flow: 3 steps + `POST /api/enroll-stub` (multipart) → Storage + `orders` row
- Contact: quiz accordion (React state) + stub `POST /api/contact-stub`
- Supabase client helpers: `src/lib/supabase/`

## Intentionally skipped (Phase 2+)

- GTM, gtag, Facebook pixel
- `js/home.js`, analytics, Bunny/YouTube players (static thumbs + play icon only on home)
- Google Apps Script / Make webhooks
- Full `hero-studio` animated desktop hero
- Contact leads → Supabase (optional); tighten Storage RLS / private bucket + signed URLs

## Phase 2 checklist

- [ ] Port `hero-studio/` into a Next client component for desktop hero
- [ ] Carousel + video embeds (Bunny)
- [ ] Wire `/pay` and `/contact` to Supabase tables + Storage
- [ ] Service-role API routes or RLS policies for public insert
- [ ] Analytics (if desired)
- [ ] Run `npm run build:perf` on static repo if you need production CSS bundles

## Assets

Static images should live under `public/img/`. If images are missing in git, copy the full `img/` folder from your live static deployment or local copy of `shopify-course`.

**Referenced in HTML but not in the trimmed repo workspace** (copy when available):

- `hero-mentor.webp`, `hero-mentor.png`
- `logo.png`, `logo white.png`
- `testi-01-thumb.png`, `testi-02-thumb.png`, `testi-03-thumb.jpg`
- `lecture-01-thumb.png` … `lecture-04-thumb.png`
- `hero-bg-full.png` (desktop hero CSS)
- `heroimg.png` (legacy desktop styles)

SVG icons from `shopify-course/img/` are copied when present.

## Regenerating home markup

After editing `../shopify-course/index.html`:

```bash
node scripts/convert-home-body.mjs
```