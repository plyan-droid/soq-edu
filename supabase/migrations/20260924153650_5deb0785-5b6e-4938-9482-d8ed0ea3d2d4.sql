CREATE OR REPLACE FUNCTION public.teaches(_user uuid, _slug text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM trainer_courses WHERE trainer_id=_user AND course_slug=_slug) OR has_role(_user,'admin') $$;
REVOKE EXECUTE ON FUNCTION public.teaches(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.teaches(uuid,text) TO authenticated;

ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS unlock_at timestamptz;

-- Quizzes
CREATE TABLE public.quizzes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), course_slug text NOT NULL, title text NOT NULL, pass_mark int NOT NULL DEFAULT 70 CHECK (pass_mark BETWEEN 1 AND 100), gives_certificate boolean NOT NULL DEFAULT false, created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.quiz_questions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE, prompt text NOT NULL, options text[] NOT NULL, position int NOT NULL DEFAULT 0);
CREATE TABLE public.quiz_answer_keys (question_id uuid PRIMARY KEY REFERENCES public.quiz_questions(id) ON DELETE CASCADE, correct int NOT NULL);
CREATE TABLE public.quiz_attempts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE, student_id uuid NOT NULL, score int NOT NULL, passed boolean NOT NULL, certificate_code text, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes, public.quiz_questions, public.quiz_answer_keys TO authenticated;
GRANT SELECT ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quizzes, public.quiz_questions, public.quiz_answer_keys, public.quiz_attempts TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answer_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quiz read" ON public.quizzes FOR SELECT TO authenticated USING (public.in_course(auth.uid(), course_slug));
CREATE POLICY "quiz write" ON public.quizzes FOR ALL TO authenticated USING (public.teaches(auth.uid(), course_slug)) WITH CHECK (public.teaches(auth.uid(), course_slug));
CREATE POLICY "qq read" ON public.quiz_questions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id=quiz_id AND public.in_course(auth.uid(), q.course_slug)));
CREATE POLICY "qq write" ON public.quiz_questions FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id=quiz_id AND public.teaches(auth.uid(), q.course_slug))) WITH CHECK (EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id=quiz_id AND public.teaches(auth.uid(), q.course_slug)));
CREATE POLICY "key write" ON public.quiz_answer_keys FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.quiz_questions qq JOIN public.quizzes q ON q.id=qq.quiz_id WHERE qq.id=question_id AND public.teaches(auth.uid(), q.course_slug))) WITH CHECK (EXISTS (SELECT 1 FROM public.quiz_questions qq JOIN public.quizzes q ON q.id=qq.quiz_id WHERE qq.id=question_id AND public.teaches(auth.uid(), q.course_slug)));
CREATE POLICY "attempt read" ON public.quiz_attempts FOR SELECT TO authenticated USING (student_id=auth.uid() OR EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id=quiz_id AND public.teaches(auth.uid(), q.course_slug)));

CREATE OR REPLACE FUNCTION public.submit_quiz(_quiz uuid, _answers jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE qz quizzes; total int; right_count int; pct int; ok boolean; code text; nm text;
BEGIN
  SELECT * INTO qz FROM quizzes WHERE id=_quiz;
  IF qz.id IS NULL OR NOT in_course(auth.uid(), qz.course_slug) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  SELECT count(*) INTO total FROM quiz_questions WHERE quiz_id=_quiz;
  IF total = 0 THEN RAISE EXCEPTION 'Quiz has no questions'; END IF;
  SELECT count(*) INTO right_count FROM quiz_questions qq JOIN quiz_answer_keys k ON k.question_id=qq.id
    WHERE qq.quiz_id=_quiz AND (_answers ->> qq.id::text) ~ '^[0-9]+$' AND (_answers ->> qq.id::text)::int = k.correct;
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
END $$;
REVOKE EXECUTE ON FUNCTION public.submit_quiz(uuid,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_quiz(uuid,jsonb) TO authenticated;

-- Assignments
CREATE TABLE public.assignments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), course_slug text NOT NULL, title text NOT NULL, instructions text NOT NULL DEFAULT '', due_at timestamptz, max_score int NOT NULL DEFAULT 100, created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.assignment_submissions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE, student_id uuid NOT NULL, student_name text NOT NULL DEFAULT 'Student', body text NOT NULL DEFAULT '', link text, score int, feedback text, status text NOT NULL DEFAULT 'submitted', created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(assignment_id, student_id));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments, public.assignment_submissions TO authenticated;
GRANT ALL ON public.assignments, public.assignment_submissions TO service_role;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "asg read" ON public.assignments FOR SELECT TO authenticated USING (public.in_course(auth.uid(), course_slug));
CREATE POLICY "asg write" ON public.assignments FOR ALL TO authenticated USING (public.teaches(auth.uid(), course_slug)) WITH CHECK (public.teaches(auth.uid(), course_slug));
CREATE POLICY "sub read" ON public.assignment_submissions FOR SELECT TO authenticated USING (student_id=auth.uid() OR EXISTS (SELECT 1 FROM public.assignments a WHERE a.id=assignment_id AND public.teaches(auth.uid(), a.course_slug)));
CREATE POLICY "sub insert" ON public.assignment_submissions FOR INSERT TO authenticated WITH CHECK (student_id=auth.uid() AND score IS NULL AND EXISTS (SELECT 1 FROM public.assignments a WHERE a.id=assignment_id AND public.in_course(auth.uid(), a.course_slug)));
CREATE POLICY "sub grade" ON public.assignment_submissions FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.assignments a WHERE a.id=assignment_id AND public.teaches(auth.uid(), a.course_slug)));
CREATE POLICY "sub delete" ON public.assignment_submissions FOR DELETE TO authenticated USING ((student_id=auth.uid() AND score IS NULL) OR public.has_role(auth.uid(),'admin'));

-- Attendance
CREATE TABLE public.attendance (session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE, student_id uuid NOT NULL, status text NOT NULL CHECK (status IN ('present','absent','late')), marked_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (session_id, student_id));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "att read" ON public.attendance FOR SELECT TO authenticated USING (student_id=auth.uid() OR EXISTS (SELECT 1 FROM public.live_sessions s WHERE s.id=session_id AND (s.trainer_id=auth.uid() OR public.teaches(auth.uid(), s.course_slug))));
CREATE POLICY "att write" ON public.attendance FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.live_sessions s WHERE s.id=session_id AND (s.trainer_id=auth.uid() OR public.teaches(auth.uid(), s.course_slug)))) WITH CHECK (EXISTS (SELECT 1 FROM public.live_sessions s WHERE s.id=session_id AND (s.trainer_id=auth.uid() OR public.teaches(auth.uid(), s.course_slug))));

-- Course notices
CREATE TABLE public.course_notices (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), course_slug text NOT NULL, title text NOT NULL, body text NOT NULL DEFAULT '', color text NOT NULL DEFAULT 'gold' CHECK (color IN ('gold','navy','red','green')), created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_notices TO authenticated;
GRANT ALL ON public.course_notices TO service_role;
ALTER TABLE public.course_notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cn read" ON public.course_notices FOR SELECT TO authenticated USING (public.in_course(auth.uid(), course_slug));
CREATE POLICY "cn write" ON public.course_notices FOR ALL TO authenticated USING (public.teaches(auth.uid(), course_slug)) WITH CHECK (public.teaches(auth.uid(), course_slug));

-- Meeting booking
CREATE TABLE public.meeting_slots (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), trainer_id uuid NOT NULL, trainer_name text NOT NULL DEFAULT 'SOQ trainer', topic text NOT NULL DEFAULT '1-to-1 session', starts_at timestamptz NOT NULL, duration_min int NOT NULL DEFAULT 30, price numeric NOT NULL DEFAULT 0, meeting_url text, booked_by uuid, booked_name text, booked_note text, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_slots TO authenticated;
GRANT ALL ON public.meeting_slots TO service_role;
ALTER TABLE public.meeting_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "slot read" ON public.meeting_slots FOR SELECT TO authenticated USING (booked_by IS NULL OR booked_by=auth.uid() OR trainer_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "slot own" ON public.meeting_slots FOR ALL TO authenticated USING (trainer_id=auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK ((trainer_id=auth.uid() AND (public.has_role(auth.uid(),'trainer') OR public.has_role(auth.uid(),'admin'))) OR public.has_role(auth.uid(),'admin'));
CREATE OR REPLACE FUNCTION public.book_slot(_slot uuid, _note text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE nm text;
BEGIN
  SELECT coalesce(nullif(full_name,''), email) INTO nm FROM profiles WHERE id=auth.uid();
  UPDATE meeting_slots SET booked_by=auth.uid(), booked_name=coalesce(nm,'Student'), booked_note=left(coalesce(_note,''),500)
   WHERE id=_slot AND booked_by IS NULL AND starts_at > now();
  IF NOT FOUND THEN RAISE EXCEPTION 'This slot is no longer available'; END IF;
END $$;
CREATE OR REPLACE FUNCTION public.cancel_booking(_slot uuid) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE meeting_slots SET booked_by=NULL, booked_name=NULL, booked_note=NULL WHERE id=_slot AND booked_by=auth.uid() $$;
REVOKE EXECUTE ON FUNCTION public.book_slot(uuid,text), public.cancel_booking(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.book_slot(uuid,text), public.cancel_booking(uuid) TO authenticated;

-- Events
CREATE TABLE public.events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, description text NOT NULL DEFAULT '', starts_at timestamptz NOT NULL, location text NOT NULL DEFAULT '10 Anson Road, Singapore', online_url text, capacity int NOT NULL DEFAULT 30, created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.event_signups (event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE, user_id uuid NOT NULL, name text NOT NULL DEFAULT 'Guest', created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (event_id, user_id));
GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events, public.event_signups TO authenticated;
GRANT ALL ON public.events, public.event_signups TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ev read" ON public.events FOR SELECT USING (true);
CREATE POLICY "ev write" ON public.events FOR ALL TO authenticated USING (created_by=auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'trainer') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "es read" ON public.event_signups FOR SELECT TO authenticated USING (user_id=auth.uid() OR EXISTS (SELECT 1 FROM public.events e WHERE e.id=event_id AND (e.created_by=auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "es join" ON public.event_signups FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid());
CREATE POLICY "es leave" ON public.event_signups FOR DELETE TO authenticated USING (user_id=auth.uid());
CREATE OR REPLACE FUNCTION public.event_counts() RETURNS TABLE(event_id uuid, n bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT event_id, count(*) FROM event_signups GROUP BY event_id $$;
GRANT EXECUTE ON FUNCTION public.event_counts() TO anon, authenticated;

-- Course follows
CREATE TABLE public.course_follows (user_id uuid NOT NULL, course_slug text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (user_id, course_slug));
GRANT SELECT, INSERT, DELETE ON public.course_follows TO authenticated;
GRANT ALL ON public.course_follows TO service_role;
ALTER TABLE public.course_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cf own" ON public.course_follows FOR ALL TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id=auth.uid());