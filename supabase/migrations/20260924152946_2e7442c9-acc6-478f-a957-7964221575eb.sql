CREATE TABLE public.course_questions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), course_slug text NOT NULL, user_id uuid NOT NULL, author_name text NOT NULL DEFAULT 'Student', body text NOT NULL CHECK (char_length(body) BETWEEN 3 AND 2000), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.course_answers (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), question_id uuid NOT NULL REFERENCES public.course_questions(id) ON DELETE CASCADE, user_id uuid NOT NULL, author_name text NOT NULL DEFAULT 'Student', is_staff boolean NOT NULL DEFAULT false, body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000), created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.course_questions, public.course_answers TO anon;
GRANT SELECT, INSERT, DELETE ON public.course_questions, public.course_answers TO authenticated;
GRANT ALL ON public.course_questions, public.course_answers TO service_role;
ALTER TABLE public.course_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "q read" ON public.course_questions FOR SELECT USING (true);
CREATE POLICY "q insert" ON public.course_questions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "q delete" ON public.course_questions FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "a read" ON public.course_answers FOR SELECT USING (true);
CREATE POLICY "a insert" ON public.course_answers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND (is_staff = false OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer')));
CREATE POLICY "a delete" ON public.course_answers FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.lesson_notes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE, body text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id, lesson_id));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_notes TO authenticated;
GRANT ALL ON public.lesson_notes TO service_role;
ALTER TABLE public.lesson_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notes" ON public.lesson_notes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.in_course(_user uuid, _slug text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM enrollments WHERE student_id=_user AND course_slug=_slug)
      OR EXISTS (SELECT 1 FROM trainer_courses WHERE trainer_id=_user AND course_slug=_slug)
      OR has_role(_user,'admin') $$;

CREATE TABLE public.course_chat_messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), course_slug text NOT NULL, user_id uuid NOT NULL, author_name text NOT NULL DEFAULT 'Student', body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000), created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, DELETE ON public.course_chat_messages TO authenticated;
GRANT ALL ON public.course_chat_messages TO service_role;
ALTER TABLE public.course_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat read" ON public.course_chat_messages FOR SELECT TO authenticated USING (public.in_course(auth.uid(), course_slug));
CREATE POLICY "chat post" ON public.course_chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.in_course(auth.uid(), course_slug));
CREATE POLICY "chat delete" ON public.course_chat_messages FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
ALTER PUBLICATION supabase_realtime ADD TABLE public.course_chat_messages;

CREATE TABLE public.tutor_profiles (user_id uuid PRIMARY KEY, display_name text NOT NULL, bio text NOT NULL DEFAULT '', subjects text[] NOT NULL DEFAULT '{}', days text[] NOT NULL DEFAULT '{}', times text[] NOT NULL DEFAULT '{}', location text NOT NULL DEFAULT 'Anson Road campus', online boolean NOT NULL DEFAULT true, visible boolean NOT NULL DEFAULT true, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.tutor_profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutor_profiles TO authenticated;
GRANT ALL ON public.tutor_profiles TO service_role;
ALTER TABLE public.tutor_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tutor read" ON public.tutor_profiles FOR SELECT USING (visible OR auth.uid() = user_id);
CREATE POLICY "tutor own" ON public.tutor_profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND (public.has_role(auth.uid(),'trainer') OR public.has_role(auth.uid(),'admin')));

CREATE TABLE public.gifts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), buyer_id uuid NOT NULL, course_slug text NOT NULL, recipient_name text NOT NULL, recipient_email text NOT NULL, message text NOT NULL DEFAULT '', send_on date NOT NULL DEFAULT current_date, status text NOT NULL DEFAULT 'scheduled', created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gifts TO authenticated;
GRANT ALL ON public.gifts TO service_role;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gift read" ON public.gifts FOR SELECT TO authenticated USING (auth.uid() = buyer_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "gift insert" ON public.gifts FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "gift update" ON public.gifts FOR UPDATE TO authenticated USING (auth.uid() = buyer_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "gift delete" ON public.gifts FOR DELETE TO authenticated USING (auth.uid() = buyer_id OR public.has_role(auth.uid(),'admin'));