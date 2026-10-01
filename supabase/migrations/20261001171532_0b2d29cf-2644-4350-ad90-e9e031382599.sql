ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;
DROP POLICY IF EXISTS "ev read" ON public.events;
CREATE POLICY "ev read public" ON public.events FOR SELECT USING (is_private = false);
CREATE POLICY "ev read private staff" ON public.events FOR SELECT TO authenticated USING (created_by = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));