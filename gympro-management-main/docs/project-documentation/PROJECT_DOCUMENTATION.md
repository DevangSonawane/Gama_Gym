# GymPro / GAMA Dashboard � Project Documentation (Simple Words)

This document explains the whole project in simple words. It covers what the app does, the main pages, the data flow, and where to find key files.

---

## 1) What this project is

GymPro (also called GAMA � Gym Admin Management By Asynk) is a web dashboard for gym owners and staff. It helps manage members, classes, staff, payments, analytics, and system users. The UI is modern and animated, and data is stored in Supabase.

---

## 2) Tech stack (tools used)

- Frontend: React + TypeScript (Vite)
- Styling/UI: Tailwind CSS + shadcn/ui (Radix)
- Animation: framer-motion
- Data: Supabase, React Query
- Icons: lucide-react
- Notifications: sonner toasts

---

## 3) How the app starts

Entry and root files:
- `src/main.tsx` � app entry point
- `src/App.tsx` � wraps providers + routes

Global providers:
- QueryClientProvider (React Query)
- TooltipProvider
- Toaster (Sonner)
- AuthProvider
- BrowserRouter (routing)

---

## 4) App routes (pages)

Public page:
- `/login` ? Login page

Protected pages (require login):
- `/dashboard` ? Main dashboard
- `/profile` ? User profile
- `/users` ? User list (Admin only)
- `/users/new` ? Create user
- `/users/:id` ? View user
- `/users/:id/edit` ? Edit user
- `/members/new` ? Create member
- `/members/:id` ? View member
- `/members/:id/edit` ? Edit member
- `/classes/new` ? Create class
- `/staff/new` ? Create staff
- `/staff/:id` ? View staff
- `/staff/:id/edit` ? Edit staff
- `/payments/new` ? Create payment
- `/promocodes/new` ? Create promo code
- `/settings` ? Application settings

Default redirect:
- `/` ? goes to `/dashboard` if logged in, else `/login`

---

## 5) Authentication (simple explanation)

Auth files:
- `src/contexts/AuthContext.tsx`
- `src/lib/auth.ts`
- `src/lib/auth-utils.ts`

How it works:
- User logs in with email or phone + password.
- Supabase `users` table is checked.
- User role is stored in localStorage.
- Role decides what pages and tabs they can see.

Roles:
- ADMIN
- MANAGER
- TRAINER
- STAFF
- MEMBER

Important security note:
- Password hashing is SHA-256 right now (dev only). Use bcrypt for production.

---

## 6) Dashboard (main page)

File: `src/pages/Dashboard.tsx`

- Uses URL query param `tab` for navigation.
- Example: `/dashboard?tab=members`.
- Layout uses Sidebar + Topbar.
- Tabs show different features based on user role.

Tabs:
- `overview` � dashboard summary cards
- `members` � member management
- `classes` � class booking
- `staff` � staff management
- `payments` � payment system
- `analytics` � analytics dashboard

## 7) Feature modules (what each part does)

### Members
- File: `src/components/members/MemberManagement.tsx`
- Uses Supabase `members` table
- Functions: list, search, filter, add, view, edit, delete
- Bulk upload supported

### Classes
- File: `src/components/classes/ClassBooking.tsx`
- Uses Supabase `classes`, `class_schedules`, `bookings`
- Functions: list classes, filter, book a class

### Staff
- File: `src/components/staff/StaffManagement.tsx`
- Uses Supabase `staff` table
- Functions: list staff, view details, manager actions

### Payments
- File: `src/components/payments/PaymentSystem.tsx`
- Uses Supabase `payments`, `promo_codes`, `invoices`
- Functions: payment history, invoices, promo codes

### Analytics
- File: `src/components/analytics/AnalyticsDashboard.tsx`
- Pulls stats from Supabase and shows charts

### Users (Admin only)
- Pages:
  - `src/pages/UserManagement.tsx`
  - `src/pages/UserCreate.tsx`
  - `src/pages/UserEdit.tsx`
  - `src/pages/UserView.tsx`
- Uses Supabase `users` table
- Functions: create, edit, view, delete users

### Settings
- Page: `src/pages/Settings.tsx`
- Functions: Configure application preferences (currently UI only)

---

## 8) Layout components

- Sidebar: `src/components/layout/Sidebar.tsx`
  - Left navigation
  - Collapsible
  - Role-based menu
- Topbar: `src/components/layout/Topbar.tsx`
  - Header bar
  - Search placeholder, notifications, profile dropdown

---

## 9) UI system

Reusable components are in `src/components/ui/`.
These include:
- Button, Card, Input, Select, Table, Dialog, Tabs, Badge, Avatar, Toast, etc.

Styling pattern:
- Glassmorphism look
- Rounded corners
- Blue/green accent theme

---

## 10) Data and Supabase

Supabase config:
- `src/lib/supabase.ts`

Important notes:
- The app reads and writes data directly from Supabase.
- Default gym ID is stored in `DEFAULT_GYM_ID`.

Supabase status:
- Members, staff, classes, payments, analytics are fully integrated.

---

## 11) API client (optional)

File: `src/lib/api.ts`

A REST API client exists, but most features use Supabase directly. It can be used later if you want a separate backend.

---

## 12) Project structure (important folders)

- `src/pages/` � all page routes
- `src/components/` � features and layout
- `src/components/ui/` � reusable UI
- `src/contexts/` � global app state
- `src/hooks/` � custom hooks
- `src/lib/` � helpers, Supabase, auth
- `src/types/` � TypeScript types
- `docs/` � documentation files

---

## 13) How to run the project

Install dependencies:
```
pnpm i
```

Start dev server:
```
pnpm run dev
```

Build:
```
pnpm run build
```

Preview:
```
pnpm run preview
```

---

## 14) Known TODOs / placeholders

- Profile save and password change are UI only (no API yet)
- ClassCreate uses a simulated API call (toast only)
- Password hashing uses SHA-256 (not production safe)

---

## 15) Quick navigation (for users)

- Login: `/login`
- Dashboard: `/dashboard`
- Members tab: `/dashboard?tab=members`
- Classes tab: `/dashboard?tab=classes`
- Staff tab: `/dashboard?tab=staff`
- Payments tab: `/dashboard?tab=payments`
- Analytics tab: `/dashboard?tab=analytics`
- Settings: `/settings`
- User management (Admin): `/users`

---

End of document.
