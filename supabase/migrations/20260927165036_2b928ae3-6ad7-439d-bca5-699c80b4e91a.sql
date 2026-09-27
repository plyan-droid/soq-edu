CREATE TABLE public.session_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  student_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','confirmed','declined','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, student_id)
);
GRANT SELECT, INSERT, UPDATE ON public.session_bookings TO authenticated;
GRANT ALL ON public.session_bookings TO service_role;
ALTER TABLE public.session_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students see own bookings" ON public.session_bookings FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.live_sessions s WHERE s.id = session_id AND (s.trainer_id = auth.uid() OR public.teaches(auth.uid(), s.course_slug))));
CREATE POLICY "Enrolled students request a seat" ON public.session_bookings FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() AND status = 'requested' AND EXISTS (SELECT 1 FROM public.live_sessions s WHERE s.id = session_id AND s.status <> 'cancelled' AND s.starts_at > now() AND public.in_course(auth.uid(), s.course_slug)));
CREATE POLICY "Trainer or student updates booking" ON public.session_bookings FOR UPDATE TO authenticated
  USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.live_sessions s WHERE s.id = session_id AND (s.trainer_id = auth.uid() OR public.teaches(auth.uid(), s.course_slug))));

-- Students may only cancel or re-request; trainers decide confirmations.
CREATE OR REPLACE FUNCTION public.guard_session_booking()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE is_trainer boolean;
BEGIN
  SELECT (s.trainer_id = auth.uid() OR public.teaches(auth.uid(), s.course_slug)) INTO is_trainer FROM live_sessions s WHERE s.id = NEW.session_id;
  IF NEW.session_id <> OLD.session_id OR NEW.student_id <> OLD.student_id THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF NOT coalesce(is_trainer, false) AND NEW.status NOT IN ('cancelled','requested') THEN RAISE EXCEPTION 'Only the trainer can confirm'; END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER guard_session_booking BEFORE UPDATE ON public.session_bookings FOR EACH ROW EXECUTE FUNCTION public.guard_session_booking();

ALTER TABLE public.tutor_profiles ADD COLUMN IF NOT EXISTS headline text NOT NULL DEFAULT '';
ALTER TABLE public.tutor_profiles ADD COLUMN IF NOT EXISTS years_experience integer;
ALTER TABLE public.tutor_profiles ADD COLUMN IF NOT EXISTS photo_url text;

GRANT SELECT ON public.tutor_profiles TO anon;
CREATE POLICY "Public sees visible tutors" ON public.tutor_profiles FOR SELECT TO anon USING (visible);
GRANT SELECT (id, trainer_id, trainer_name, topic, starts_at, duration_min, price, booked_by) ON public.meeting_slots TO anon;
CREATE POLICY "Public sees open future slots" ON public.meeting_slots FOR SELECT TO anon USING (booked_by IS NULL AND starts_at > now());