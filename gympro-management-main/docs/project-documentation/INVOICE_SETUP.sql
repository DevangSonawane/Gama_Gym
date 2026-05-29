-- Create invoices table for GST billing
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments(id) on delete set null,
  member_id uuid references public.members(id) on delete set null,
  invoice_number text unique not null,
  status text not null default 'paid',
  issue_date timestamptz not null default now(),
  due_date timestamptz not null default now(),
  paid_date timestamptz,
  currency text not null default 'INR',
  description text,
  subtotal numeric not null,
  cgst_rate numeric not null,
  sgst_rate numeric not null,
  cgst_amount numeric not null,
  sgst_amount numeric not null,
  total numeric not null,
  gstin text,
  business_name text,
  billing_address text,
  hsn_sac text,
  customer_name text,
  customer_email text,
  logo_url text,
  pdf_url text,
  items jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoices_payment_id_idx on public.invoices (payment_id);
create index if not exists invoices_member_id_idx on public.invoices (member_id);
