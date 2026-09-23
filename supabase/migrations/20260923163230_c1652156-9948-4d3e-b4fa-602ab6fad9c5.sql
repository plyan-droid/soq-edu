CREATE TABLE public.course_overrides (
  slug text PRIMARY KEY,
  title text,
  summary text,
  price text,
  duration text,
  mode text,
  badge text,
  outcomes text[],
  sections jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT ON public.course_overrides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_overrides TO authenticated;
GRANT ALL ON public.course_overrides TO service_role;
ALTER TABLE public.course_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Course edits are public" ON public.course_overrides FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins edit courses" ON public.course_overrides FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.touch_course_override() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); NEW.updated_by := auth.uid(); RETURN NEW; END $$;
CREATE TRIGGER touch_course_override BEFORE INSERT OR UPDATE ON public.course_overrides FOR EACH ROW EXECUTE FUNCTION public.touch_course_override();