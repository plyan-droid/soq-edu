CREATE TABLE public.course_intakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_slug text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  apply_by date,
  session_time text,
  status text NOT NULL DEFAULT 'tentative' CHECK (status IN ('tentative','confirmed','full','cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.course_intakes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_intakes TO authenticated;
GRANT ALL ON public.course_intakes TO service_role;
ALTER TABLE public.course_intakes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Intakes are public" ON public.course_intakes FOR SELECT TO anon, authenticated USING (status <> 'cancelled' OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage intakes" ON public.course_intakes FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.course_intakes (course_slug, start_date, end_date, apply_by, session_time, status) VALUES
('certificate-in-eyelash-extension','2026-10-12','2026-10-14','2026-10-02','9.30am - 4.30pm','tentative'),
('certificate-in-eyelash-extension','2026-11-16','2026-11-18','2026-11-06','9.30am - 4.30pm','tentative'),
('certificate-in-eyebrow-embroidery','2026-10-26','2026-10-28','2026-10-16','9.30am - 4.30pm','tentative'),
('make-up-master-class','2026-10-19','2026-11-27','2026-10-09','9.30am - 12.30pm','tentative'),
('keratin-lash-lift','2026-10-08','2026-10-09','2026-09-30','1.30pm - 5.30pm','tentative'),
('fundamental-of-foot-massage','2026-11-02','2026-11-05','2026-10-23','9.30am - 12.30pm','tentative'),
('infant-massage','2026-11-10','2026-11-11','2026-10-30','1.30pm - 5.30pm','tentative'),
('dementia-care-and-person-centred-practices','2026-12-01','2026-12-02','2026-11-20','9.30am - 12.30pm','tentative'),
('ai-course-singapore','2026-10-21','2026-10-22','2026-10-12',NULL,'tentative'),
('ai-course-singapore','2026-12-09','2026-12-10','2026-11-30',NULL,'tentative'),
('healthy-face-meridian-bojin','2026-11-23','2026-11-24','2026-11-13','9.30am - 12.30pm','tentative'),
('diploma-in-professional-make-up','2027-01-11',NULL,'2026-12-18',NULL,'tentative');