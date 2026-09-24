CREATE TABLE public.staff_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_requests TO authenticated;
GRANT ALL ON public.staff_requests TO service_role;
ALTER TABLE public.staff_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own requests view" ON public.staff_requests FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own requests insert" ON public.staff_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending');
CREATE POLICY "admin update" ON public.staff_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete" ON public.staff_requests FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));