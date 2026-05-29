-- Fix RLS Policies for GymPro
-- Run this in your Supabase SQL Editor

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies - Allow all operations (development only!
-- For production, you'd want more restrictive policies based on user roles

-- ============================================
-- MEMBERS TABLE POLICIES
-- ============================================
DROP POLICY IF EXISTS "Allow all selects on members" ON public.members;
DROP POLICY IF EXISTS "Allow all inserts on members" ON public.members;
DROP POLICY IF EXISTS "Allow all updates on members" ON public.members;
DROP POLICY IF EXISTS "Allow all deletes on members" ON public.members;
CREATE POLICY "Allow all selects on members" ON public.members FOR SELECT USING (true);
CREATE POLICY "Allow all inserts on members" ON public.members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates on members" ON public.members FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes on members" ON public.members FOR DELETE USING (true);

-- ============================================
-- USERS TABLE POLICIES
-- ============================================
DROP POLICY IF EXISTS "Allow all selects on users" ON public.users;
DROP POLICY IF EXISTS "Allow all inserts on users" ON public.users;
DROP POLICY IF EXISTS "Allow all updates on users" ON public.users;
DROP POLICY IF EXISTS "Allow all deletes on users" ON public.users;
CREATE POLICY "Allow all selects on users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow all inserts on users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates on users" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes on users" ON public.users FOR DELETE USING (true);

-- ============================================
-- STAFF TABLE POLICIES
-- ============================================
DROP POLICY IF EXISTS "Allow all selects on staff" ON public.staff;
DROP POLICY IF EXISTS "Allow all inserts on staff" ON public.staff;
DROP POLICY IF EXISTS "Allow all updates on staff" ON public.staff;
DROP POLICY IF EXISTS "Allow all deletes on staff" ON public.staff;
CREATE POLICY "Allow all selects on staff" ON public.staff FOR SELECT USING (true);
CREATE POLICY "Allow all inserts on staff" ON public.staff FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates on staff" ON public.staff FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes on staff" ON public.staff FOR DELETE USING (true);

-- ============================================
-- CLASSES TABLE POLICIES
-- ============================================
DROP POLICY IF EXISTS "Allow all selects on classes" ON public.classes;
DROP POLICY IF EXISTS "Allow all inserts on classes" ON public.classes;
DROP POLICY IF EXISTS "Allow all updates on classes" ON public.classes;
DROP POLICY IF EXISTS "Allow all deletes on classes" ON public.classes;
CREATE POLICY "Allow all selects on classes" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Allow all inserts on classes" ON public.classes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates on classes" ON public.classes FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes on classes" ON public.classes FOR DELETE USING (true);

-- ============================================
-- CLASS_SCHEDULES TABLE POLICIES
-- ============================================
DROP POLICY IF EXISTS "Allow all selects on class_schedules" ON public.class_schedules;
DROP POLICY IF EXISTS "Allow all inserts on class_schedules" ON public.class_schedules;
DROP POLICY IF EXISTS "Allow all updates on class_schedules" ON public.class_schedules;
DROP POLICY IF EXISTS "Allow all deletes on class_schedules" ON public.class_schedules;
CREATE POLICY "Allow all selects on class_schedules" ON public.class_schedules FOR SELECT USING (true);
CREATE POLICY "Allow all inserts on class_schedules" ON public.class_schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates on class_schedules" ON public.class_schedules FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes on class_schedules" ON public.class_schedules FOR DELETE USING (true);

-- ============================================
-- BOOKINGS TABLE POLICIES
-- ============================================
DROP POLICY IF EXISTS "Allow all selects on bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow all inserts on bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow all updates on bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow all deletes on bookings" ON public.bookings;
CREATE POLICY "Allow all selects on bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Allow all inserts on bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates on bookings" ON public.bookings FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes on bookings" ON public.bookings FOR DELETE USING (true);

-- ============================================
-- PAYMENTS TABLE POLICIES
-- ============================================
DROP POLICY IF EXISTS "Allow all selects on payments" ON public.payments;
DROP POLICY IF EXISTS "Allow all inserts on payments" ON public.payments;
DROP POLICY IF EXISTS "Allow all updates on payments" ON public.payments;
DROP POLICY IF EXISTS "Allow all deletes on payments" ON public.payments;
CREATE POLICY "Allow all selects on payments" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Allow all inserts on payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates on payments" ON public.payments FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes on payments" ON public.payments FOR DELETE USING (true);

-- ============================================
-- PROMO_CODES TABLE POLICIES
-- ============================================
DROP POLICY IF EXISTS "Allow all selects on promo_codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Allow all inserts on promo_codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Allow all updates on promo_codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Allow all deletes on promo_codes" ON public.promo_codes;
CREATE POLICY "Allow all selects on promo_codes" ON public.promo_codes FOR SELECT USING (true);
CREATE POLICY "Allow all inserts on promo_codes" ON public.promo_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates on promo_codes" ON public.promo_codes FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes on promo_codes" ON public.promo_codes FOR DELETE USING (true);

-- ============================================
-- INVOICES TABLE POLICIES
-- ============================================
DROP POLICY IF EXISTS "Allow all selects on invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow all inserts on invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow all updates on invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow all deletes on invoices" ON public.invoices;
CREATE POLICY "Allow all selects on invoices" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Allow all inserts on invoices" ON public.invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates on invoices" ON public.invoices FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes on invoices" ON public.invoices FOR DELETE USING (true);

-- ============================================
-- ALTERNATIVE: COMPLETELY DISABLE RLS (NOT RECOMMENDED FOR PRODUCTION!)
-- If you want to disable RLS entirely, uncomment the lines below:
-- ============================================
-- ALTER TABLE public.members DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.staff DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.class_schedules DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.promo_codes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;

