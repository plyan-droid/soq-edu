DROP POLICY "Intakes are public" ON public.course_intakes;
CREATE POLICY "Intakes are public" ON public.course_intakes FOR SELECT TO anon, authenticated USING (status <> 'cancelled');