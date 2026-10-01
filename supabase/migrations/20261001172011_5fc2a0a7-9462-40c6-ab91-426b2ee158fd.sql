ALTER TABLE public.trainer_applications
  ADD COLUMN IF NOT EXISTS cv_path text,
  ADD COLUMN IF NOT EXISTS certs_path text,
  ADD COLUMN IF NOT EXISTS years_experience integer,
  ADD COLUMN IF NOT EXISTS qualifications text,
  ADD COLUMN IF NOT EXISTS teaching_mode text,
  ADD COLUMN IF NOT EXISTS availability text,
  ADD COLUMN IF NOT EXISTS languages text,
  ADD COLUMN IF NOT EXISTS courses_interest text;

CREATE POLICY "Anyone can upload trainer CVs" ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'trainer-cvs' AND (storage.foldername(name))[1] = 'applications');
CREATE POLICY "Staff can read trainer CVs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'trainer-cvs' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff')));
CREATE POLICY "Staff can delete trainer CVs" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'trainer-cvs' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff')));