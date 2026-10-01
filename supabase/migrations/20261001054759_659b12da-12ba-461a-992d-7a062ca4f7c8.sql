ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS citizenship text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS emergency_name text,
  ADD COLUMN IF NOT EXISTS emergency_phone text,
  ADD COLUMN IF NOT EXISTS referral_source text;

DROP POLICY IF EXISTS "Staff can update profiles" ON public.profiles;
CREATE POLICY "Staff can update profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));