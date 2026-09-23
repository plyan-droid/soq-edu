CREATE TABLE public.trainer_courses (
  trainer_id uuid NOT NULL,
  course_slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (trainer_id, course_slug)
);
GRANT SELECT, INSERT, DELETE ON public.trainer_courses TO authenticated;
GRANT ALL ON public.trainer_courses TO service_role;
ALTER TABLE public.trainer_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trainers see own courses, staff all" ON public.trainer_courses FOR SELECT TO authenticated USING (trainer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Trainers add own courses" ON public.trainer_courses FOR INSERT TO authenticated WITH CHECK ((trainer_id = auth.uid() AND public.has_role(auth.uid(),'trainer')) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Trainers remove own courses" ON public.trainer_courses FOR DELETE TO authenticated USING (trainer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.trainer_roster()
RETURNS TABLE(enrollment_id uuid, course_slug text, student_name text, student_email text, progress integer, status text, start_date date, end_date date, lessons_done bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT e.id, e.course_slug, coalesce(p.full_name, split_part(p.email,'@',1)), p.email, e.progress, e.status, e.start_date, e.end_date,
    (SELECT count(*) FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id WHERE lp.user_id = e.student_id AND l.course_slug = e.course_slug)
  FROM enrollments e JOIN profiles p ON p.id = e.student_id
  WHERE e.course_slug IN (SELECT tc.course_slug FROM trainer_courses tc WHERE tc.trainer_id = auth.uid())
  ORDER BY e.course_slug, 3
$$;
REVOKE EXECUTE ON FUNCTION public.trainer_roster() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.trainer_roster() TO authenticated;

CREATE OR REPLACE FUNCTION public.trainer_lesson_stats()
RETURNS TABLE(lesson_id uuid, completions bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT l.id, count(lp.user_id) FROM lessons l LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id
  WHERE l.created_by = auth.uid() OR l.course_slug IN (SELECT course_slug FROM trainer_courses WHERE trainer_id = auth.uid())
  GROUP BY l.id
$$;
REVOKE EXECUTE ON FUNCTION public.trainer_lesson_stats() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.trainer_lesson_stats() TO authenticated;