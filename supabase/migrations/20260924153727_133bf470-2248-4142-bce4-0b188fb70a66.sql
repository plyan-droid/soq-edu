CREATE OR REPLACE FUNCTION public.session_roster(_session uuid) RETURNS TABLE(student_id uuid, student_name text, student_email text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT e.student_id, coalesce(nullif(p.full_name,''), p.email), p.email
  FROM live_sessions s JOIN enrollments e ON e.course_slug = s.course_slug LEFT JOIN profiles p ON p.id = e.student_id
  WHERE s.id = _session AND (s.trainer_id = auth.uid() OR teaches(auth.uid(), s.course_slug))
  ORDER BY 2 $$;
REVOKE EXECUTE ON FUNCTION public.session_roster(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.session_roster(uuid) TO authenticated;