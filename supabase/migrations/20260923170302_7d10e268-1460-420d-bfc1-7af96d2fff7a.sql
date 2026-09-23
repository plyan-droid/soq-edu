CREATE TABLE public.trainer_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
  email text NOT NULL CHECK (char_length(email) BETWEEN 5 AND 200),
  phone text CHECK (char_length(phone) <= 40),
  expertise text NOT NULL CHECK (char_length(expertise) BETWEEN 2 AND 200),
  experience text NOT NULL CHECK (char_length(experience) BETWEEN 10 AND 3000),
  portfolio_url text CHECK (char_length(portfolio_url) <= 300),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  staff_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.trainer_applications TO anon;
GRANT SELECT, INSERT, UPDATE ON public.trainer_applications TO authenticated;
GRANT ALL ON public.trainer_applications TO service_role;
ALTER TABLE public.trainer_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can apply to teach" ON public.trainer_applications FOR INSERT TO anon, authenticated WITH CHECK (status = 'pending' AND staff_note IS NULL AND (user_id IS NULL OR user_id = auth.uid()));
CREATE POLICY "Applicants see own trainer applications" ON public.trainer_applications FOR SELECT TO authenticated USING (user_id = auth.uid() OR lower(email) = lower(auth.jwt() ->> 'email') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Staff review trainer applications" ON public.trainer_applications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE DEFAULT ('SOQ-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  student_id uuid,
  student_name text NOT NULL,
  course_slug text NOT NULL,
  issued_on date NOT NULL DEFAULT current_date,
  status text NOT NULL DEFAULT 'valid' CHECK (status IN ('valid','revoked')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage certificates" ON public.certificates FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Students see own certificates" ON public.certificates FOR SELECT TO authenticated USING (student_id = auth.uid());

CREATE OR REPLACE FUNCTION public.verify_certificate(_code text)
RETURNS TABLE (code text, student_name text, course_slug text, issued_on date, status text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.code, c.student_name, c.course_slug, c.issued_on, c.status FROM public.certificates c WHERE upper(c.code) = upper(trim(_code)) LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.verify_certificate(text) TO anon, authenticated;

CREATE TABLE public.course_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_slug text NOT NULL,
  user_id uuid NOT NULL,
  reviewer_name text NOT NULL CHECK (char_length(reviewer_name) BETWEEN 2 AND 80),
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body text NOT NULL CHECK (char_length(body) BETWEEN 10 AND 2000),
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_slug, user_id)
);
GRANT SELECT ON public.course_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_reviews TO authenticated;
GRANT ALL ON public.course_reviews TO service_role;
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visitors see visible reviews" ON public.course_reviews FOR SELECT TO anon USING (NOT hidden);
CREATE POLICY "Members see visible or own reviews" ON public.course_reviews FOR SELECT TO authenticated USING (NOT hidden OR user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Write own review" ON public.course_reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND hidden = false);
CREATE POLICY "Staff moderate reviews" ON public.course_reviews FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Delete own review or staff" ON public.course_reviews FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
  email text NOT NULL CHECK (char_length(email) BETWEEN 5 AND 200),
  phone text CHECK (char_length(phone) <= 40),
  topic text NOT NULL DEFAULT 'general',
  message text NOT NULL CHECK (char_length(message) BETWEEN 5 AND 5000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
  staff_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.support_tickets TO anon;
GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can send a message" ON public.support_tickets FOR INSERT TO anon, authenticated WITH CHECK (status = 'open' AND staff_note IS NULL AND (user_id IS NULL OR user_id = auth.uid()));
CREATE POLICY "See own tickets or staff" ON public.support_tickets FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Staff handle tickets" ON public.support_tickets FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (char_length(email) BETWEEN 5 AND 200),
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.newsletter_subscribers TO anon;
GRANT SELECT, INSERT, DELETE ON public.newsletter_subscribers TO authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Staff see subscribers" ON public.newsletter_subscribers FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Staff remove subscribers" ON public.newsletter_subscribers FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

GRANT INSERT, DELETE ON public.user_roles TO authenticated;
CREATE POLICY "Staff grant roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Staff remove roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') AND user_id <> auth.uid());