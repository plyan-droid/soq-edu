ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'mcq' CHECK (kind IN ('mcq','short'));
ALTER TABLE public.quiz_answer_keys ADD COLUMN IF NOT EXISTS accepted text[];
ALTER TABLE public.quiz_answer_keys ALTER COLUMN correct SET DEFAULT 0;
ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'online' CHECK (mode IN ('online','in_person','hybrid'));
ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS topic text;

CREATE OR REPLACE FUNCTION public.submit_quiz(_quiz uuid, _answers jsonb)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE qz quizzes; total int; right_count int; pct int; ok boolean; code text; nm text;
BEGIN
  SELECT * INTO qz FROM quizzes WHERE id=_quiz;
  IF qz.id IS NULL OR NOT in_course(auth.uid(), qz.course_slug) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  SELECT count(*) INTO total FROM quiz_questions WHERE quiz_id=_quiz;
  IF total = 0 THEN RAISE EXCEPTION 'Quiz has no questions'; END IF;
  SELECT count(*) INTO right_count FROM quiz_questions qq JOIN quiz_answer_keys k ON k.question_id=qq.id
    WHERE qq.quiz_id=_quiz AND (
      (qq.kind = 'mcq' AND (_answers ->> qq.id::text) ~ '^[0-9]+$' AND (_answers ->> qq.id::text)::int = k.correct)
      OR (qq.kind = 'short' AND EXISTS (SELECT 1 FROM unnest(coalesce(k.accepted,'{}')) a
            WHERE lower(btrim(a)) = lower(btrim(coalesce(_answers ->> qq.id::text,''))) AND btrim(a) <> ''))
    );
  pct := round(right_count * 100.0 / total); ok := pct >= qz.pass_mark;
  IF ok AND qz.gives_certificate THEN
    SELECT certificate_code INTO code FROM quiz_attempts WHERE quiz_id=_quiz AND student_id=auth.uid() AND certificate_code IS NOT NULL LIMIT 1;
    IF code IS NULL THEN
      code := 'SOQ-' || upper(substr(md5(gen_random_uuid()::text),1,8));
      SELECT coalesce(nullif(full_name,''), email) INTO nm FROM profiles WHERE id=auth.uid();
      INSERT INTO certificates(code, course_slug, student_id, student_name, status) VALUES (code, qz.course_slug, auth.uid(), coalesce(nm,'Student'), 'valid');
    END IF;
  END IF;
  INSERT INTO quiz_attempts(quiz_id, student_id, score, passed, certificate_code) VALUES (_quiz, auth.uid(), pct, ok, code);
  RETURN jsonb_build_object('score', pct, 'passed', ok, 'certificate', code, 'right', right_count, 'total', total);
END $function$;