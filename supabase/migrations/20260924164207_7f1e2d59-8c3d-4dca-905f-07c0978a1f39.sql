DROP POLICY "Settings are public" ON public.site_settings;
CREATE POLICY "Settings are public" ON public.site_settings FOR SELECT TO anon, authenticated USING (key <> 'maintenance_key');
CREATE POLICY "Staff read maintenance key" ON public.site_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));