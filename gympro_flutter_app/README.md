# gympro_flutter_app

GymPro / GAMA mobile app (Flutter) that mirrors the `gympro-management-main` web dashboard and talks directly to Supabase (Postgres) using the `supabase_flutter` client.

## Getting Started

### 1) Configure Supabase

Copy `.env.example` to `.env` and fill:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `DEFAULT_GYM_ID` (used for inserts into `members.gym_id` / `staff.gym_id`)

### 2) Install deps

```bash
cd gympro_flutter_app
flutter pub get
```

### 3) Run

```bash
flutter run
```

## What’s Implemented (initial)

- Login via `public.users` table (email/phone + SHA-256 password hash, same approach as the web app’s `AuthContext`)
- Dashboard navigation with role-based tabs (members/staff/payments/users gating)
- Members: list + view + create/edit + delete (`members`)
- Staff: list + view + create/edit + delete (`staff`)
- Payments: list + create (`payments`)
- Promo codes: create (`promo_codes`)
- Users (admin-only): list + view + create/edit + delete (`users`)

## Notes

- This app does **not** use Supabase Auth yet; it matches the current web app approach of validating against the custom `users.password_hash`.
- If you have strict RLS policies enabled in Supabase, ensure the anon key has read/write access as needed (or adjust policies accordingly).

A few resources to get you started if this is your first Flutter project:

- [Lab: Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Cookbook: Useful Flutter samples](https://docs.flutter.dev/cookbook)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.
