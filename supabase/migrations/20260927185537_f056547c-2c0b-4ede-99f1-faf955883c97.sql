-- Owner-only: site pages writes
DROP POLICY IF EXISTS "Staff write pages" ON public.site_pages;
CREATE POLICY "Owner writes pages" ON public.site_pages
  FOR ALL USING (is_top_admin(auth.uid())) WITH CHECK (is_top_admin(auth.uid()));

-- Owner-only: staff-access request approvals
DROP POLICY IF EXISTS "admin update" ON public.staff_requests;
DROP POLICY IF EXISTS "admin delete" ON public.staff_requests;
CREATE POLICY "Owner updates staff requests" ON public.staff_requests
  FOR UPDATE USING (is_top_admin(auth.uid())) WITH CHECK (is_top_admin(auth.uid()));
CREATE POLICY "Owner deletes staff requests" ON public.staff_requests
  FOR DELETE USING (is_top_admin(auth.uid()));

-- Live class bookings: staff/admin see all and can confirm or decline any request
DROP POLICY IF EXISTS "Students see own bookings" ON public.session_bookings;
CREATE POLICY "Students see own bookings, staff all" ON public.session_bookings
  FOR SELECT TO authenticated
  USING ((student_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Trainer or student updates booking" ON public.session_bookings;
CREATE POLICY "Trainer, student or staff updates booking" ON public.session_bookings
  FOR UPDATE TO authenticated
  USING ((student_id = auth.uid())
         OR has_role(auth.uid(), 'admin'::app_role)
         OR EXISTS (SELECT 1 FROM live_sessions s
                    WHERE s.id = session_bookings.session_id
                      AND ((s.trainer_id = auth.uid()) OR teaches(auth.uid(), s.course_slug))))
  WITH CHECK ((student_id = auth.uid())
         OR has_role(auth.uid(), 'admin'::app_role)
         OR EXISTS (SELECT 1 FROM live_sessions s
                    WHERE s.id = session_bookings.session_id
                      AND ((s.trainer_id = auth.uid()) OR teaches(auth.uid(), s.course_slug))));
GRANT SELECT, UPDATE ON public.session_bookings TO authenticated;

-- Tutor marketplace oversight
CREATE POLICY "Staff read all tutor listings" ON public.tutor_profiles
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Staff manage tutor listings" ON public.tutor_profiles
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
GRANT SELECT, UPDATE ON public.tutor_profiles TO authenticated;

-- Learning oversight reads and grading
CREATE POLICY "Staff read all assignments" ON public.assignments
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Staff read all submissions" ON public.assignment_submissions
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Staff grade submissions" ON public.assignment_submissions
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Staff read all quizzes" ON public.quizzes
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Staff read all attempts" ON public.quiz_attempts
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Staff read all attendance" ON public.attendance
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
GRANT SELECT ON public.assignments, public.quizzes, public.quiz_attempts, public.attendance TO authenticated;
GRANT UPDATE ON public.assignment_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_pages, public.staff_requests TO authenticated;
GRANT ALL ON public.site_pages, public.staff_requests TO service_role;
GRANT ALL ON public.session_bookings, public.tutor_profiles, public.assignments, public.quizzes, public.quiz_attempts, public.attendance TO service_role;