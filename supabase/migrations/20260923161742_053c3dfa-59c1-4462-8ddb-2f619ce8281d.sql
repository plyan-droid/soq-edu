CREATE TABLE public.course_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_slug text NOT NULL CHECK (char_length(course_slug) <= 200),
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
  email text NOT NULL CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND char_length(email) <= 255),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 6 AND 30),
  citizenship text CHECK (citizenship IN ('singapore_citizen','permanent_resident','foreigner')),
  preferred_intake text CHECK (char_length(preferred_intake) <= 100),
  message text CHECK (char_length(message) <= 2000),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','enrolled','closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.course_applications TO anon;
GRANT INSERT, SELECT, UPDATE ON public.course_applications TO authenticated;
GRANT ALL ON public.course_applications TO service_role;
ALTER TABLE public.course_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can apply" ON public.course_applications FOR INSERT TO anon, authenticated WITH CHECK (status = 'new');
CREATE POLICY "Admins view applications" ON public.course_applications FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update applications" ON public.course_applications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));