# API / Backend Integration Guide

## Current Architecture: Supabase

The project currently uses **Supabase** as the backend-as-a-service (BaaS). This means the frontend communicates directly with the Supabase PostgreSQL database using the `@supabase/supabase-js` client.

### Data Flow
1. **Frontend**: React components trigger actions (e.g., creating a member).
2. **Supabase Client**: `src/lib/supabase.ts` provides the configured client.
3. **Database**: Supabase handles data storage, authentication, and Row Level Security (RLS).

### Integration Status
For the status of Supabase integration for each feature, please refer to **[SUPABASE_INTEGRATION_STATUS.md](../SUPABASE_INTEGRATION_STATUS.md)**.

## Legacy / Alternative: REST API

A REST API client structure is provided in `src/lib/api.ts` for cases where a custom backend server (Node.js/Express, Python/Django, etc.) is preferred over Supabase, or for integrating with external third-party APIs.

### `src/lib/api.ts`
This file contains a class-based `ApiClient` that handles:
- Base URL configuration (`VITE_API_URL`)
- Authentication headers (Bearer token)
- Standard CRUD methods (GET, POST, PUT, DELETE)
- Type-safe responses

### Switching to REST API
If you decide to move away from Supabase to a custom REST API:
1. Update `VITE_API_URL` in `.env`.
2. Implement the backend endpoints matching the methods in `ApiClient`.
3. Replace `supabase.from(...).select(...)` calls in components with `api.get...()` calls.
4. Update `src/contexts/AuthContext.tsx` to use `api.login()` instead of `supabase.auth.signInWithPassword()`.
