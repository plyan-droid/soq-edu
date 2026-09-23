CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_slug text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  title text NOT NULL,
  body text,
  video_url text,
  file_url text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enrolled students, trainers and staff read lessons" ON public.lessons FOR SELECT TO authenticated USING (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'trainer')
  OR EXISTS (SELECT 1 FROM public.enrollments e WHERE e.student_id = auth.uid() AND e.course_slug = lessons.course_slug));
CREATE POLICY "Trainers and staff add lessons" ON public.lessons FOR INSERT TO authenticated WITH CHECK (
  (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'trainer')) AND created_by = auth.uid());
CREATE POLICY "Own lessons or staff edit" ON public.lessons FOR UPDATE TO authenticated USING (created_by = auth.uid() OR has_role(auth.uid(),'admin')) WITH CHECK (created_by = auth.uid() OR has_role(auth.uid(),'admin'));
CREATE POLICY "Own lessons or staff delete" ON public.lessons FOR DELETE TO authenticated USING (created_by = auth.uid() OR has_role(auth.uid(),'admin'));

CREATE TABLE public.lesson_progress (
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);
GRANT SELECT, INSERT, DELETE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own lesson progress" ON public.lesson_progress FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.course_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'ai-business',
  summary text NOT NULL DEFAULT '',
  duration text,
  mode text,
  price text,
  outcomes text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',
  staff_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_drafts TO authenticated;
GRANT ALL ON public.course_drafts TO service_role;
ALTER TABLE public.course_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trainer sees own drafts, staff all" ON public.course_drafts FOR SELECT TO authenticated USING (trainer_id = auth.uid() OR has_role(auth.uid(),'admin'));
CREATE POLICY "Trainers create drafts" ON public.course_drafts FOR INSERT TO authenticated WITH CHECK (trainer_id = auth.uid() AND has_role(auth.uid(),'trainer') AND status IN ('draft','submitted') AND staff_note IS NULL);
CREATE POLICY "Trainer edits unapproved drafts" ON public.course_drafts FOR UPDATE TO authenticated USING (trainer_id = auth.uid() AND status IN ('draft','submitted','rejected')) WITH CHECK (trainer_id = auth.uid() AND status IN ('draft','submitted'));
CREATE POLICY "Staff review drafts" ON public.course_drafts FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Trainer deletes own draft or staff" ON public.course_drafts FOR DELETE TO authenticated USING ((trainer_id = auth.uid() AND status <> 'approved') OR has_role(auth.uid(),'admin'));

CREATE TABLE public.live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_slug text NOT NULL,
  trainer_id uuid NOT NULL,
  title text NOT NULL,
  starts_at timestamptz NOT NULL,
  duration_min integer NOT NULL DEFAULT 60,
  meeting_url text,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.live_sessions TO authenticated;
GRANT ALL ON public.live_sessions TO service_role;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enrolled, owner trainer or staff see live classes" ON public.live_sessions FOR SELECT TO authenticated USING (
  trainer_id = auth.uid() OR has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.enrollments e WHERE e.student_id = auth.uid() AND e.course_slug = live_sessions.course_slug));
CREATE POLICY "Trainers schedule live classes" ON public.live_sessions FOR INSERT TO authenticated WITH CHECK (trainer_id = auth.uid() AND (has_role(auth.uid(),'trainer') OR has_role(auth.uid(),'admin')));
CREATE POLICY "Owner or staff edit live classes" ON public.live_sessions FOR UPDATE TO authenticated USING (trainer_id = auth.uid() OR has_role(auth.uid(),'admin')) WITH CHECK (trainer_id = auth.uid() OR has_role(auth.uid(),'admin'));
CREATE POLICY "Owner or staff delete live classes" ON public.live_sessions FOR DELETE TO authenticated USING (trainer_id = auth.uid() OR has_role(auth.uid(),'admin'));