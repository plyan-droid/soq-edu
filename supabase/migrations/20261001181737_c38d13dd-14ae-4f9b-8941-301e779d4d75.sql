CREATE TABLE public.session_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL UNIQUE REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  trainer_id uuid NOT NULL,
  objectives text NOT NULL DEFAULT '',
  activities text NOT NULL DEFAULT '',
  materials text NOT NULL DEFAULT '',
  assessment text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','approved','changes')),
  staff_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_plans TO authenticated;
GRANT ALL ON public.session_plans TO service_role;
ALTER TABLE public.session_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trainers read own plans, staff read all" ON public.session_plans FOR SELECT TO authenticated
  USING (trainer_id = auth.uid() OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'staff'));
CREATE POLICY "Trainers create plans for own sessions" ON public.session_plans FOR INSERT TO authenticated
  WITH CHECK (trainer_id = auth.uid() AND status IN ('draft','submitted') AND staff_note IS NULL
    AND EXISTS (SELECT 1 FROM public.live_sessions s WHERE s.id = session_id AND s.trainer_id = auth.uid()));
CREATE POLICY "Trainers edit own plans, staff review" ON public.session_plans FOR UPDATE TO authenticated
  USING (trainer_id = auth.uid() OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'staff'))
  WITH CHECK (trainer_id = auth.uid() OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'staff'));
CREATE POLICY "Trainers delete own plans" ON public.session_plans FOR DELETE TO authenticated USING (trainer_id = auth.uid());

CREATE OR REPLACE FUNCTION public.guard_session_plan() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  IF NOT (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'staff')) THEN
    -- trainers may only draft/submit and cannot write staff notes
    IF NEW.status NOT IN ('draft','submitted') THEN NEW.status := 'submitted'; END IF;
    NEW.staff_note := OLD.staff_note;
    NEW.trainer_id := OLD.trainer_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_session_plan BEFORE UPDATE ON public.session_plans FOR EACH ROW EXECUTE FUNCTION public.guard_session_plan();