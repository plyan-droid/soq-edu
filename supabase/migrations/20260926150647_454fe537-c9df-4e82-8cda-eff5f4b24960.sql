CREATE OR REPLACE FUNCTION public.issue_completed_certificate(_student_id uuid, _course_slug text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.certificates; p public.profiles; existing_code text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Staff access required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.enrollments e WHERE e.student_id = _student_id AND e.course_slug = _course_slug AND (e.progress >= 100 OR e.status = 'completed')) THEN
    RAISE EXCEPTION 'Course completion has not been recorded';
  END IF;
  SELECT * INTO p FROM public.profiles WHERE id = _student_id;
  IF p.id IS NULL OR nullif(trim(p.full_name), '') IS NULL THEN RAISE EXCEPTION 'Learner name is required'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(_student_id::text || ':' || _course_slug, 0));
  SELECT code INTO existing_code FROM public.certificates WHERE student_id = _student_id AND course_slug = _course_slug LIMIT 1;
  IF existing_code IS NOT NULL THEN RAISE EXCEPTION 'Certificate already exists for this learner and course'; END IF;
  INSERT INTO public.certificates (student_id, student_name, course_slug, issued_on)
  VALUES (_student_id, p.full_name, _course_slug, current_date) RETURNING * INTO c;
  RETURN jsonb_build_object('code', c.code, 'name', c.student_name, 'course_slug', c.course_slug, 'date', c.issued_on);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.issue_completed_certificate(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.issue_completed_certificate(uuid,text) TO authenticated;