ALTER TABLE public.course_applications DROP CONSTRAINT IF EXISTS course_applications_status_check;
ALTER TABLE public.course_applications ADD CONSTRAINT course_applications_status_check CHECK (status IN ('new','contacted','screening','offer','waitlist','approved','enrolled','closed'));
DROP POLICY IF EXISTS "Anyone can apply" ON public.course_applications;
CREATE POLICY "Anyone can apply" ON public.course_applications FOR INSERT TO anon, authenticated WITH CHECK (status IN ('new','waitlist'));
INSERT INTO public.course_applications (course_slug, full_name, email, phone, status, source, message, created_at)
SELECT w.course_slug, w.name, w.email, coalesce(nullif(w.phone,''), nullif((SELECT p.phone FROM public.profiles p WHERE lower(p.email)=lower(w.email) LIMIT 1),''), 'Not given'), CASE w.status WHEN 'enrolled' THEN 'enrolled' WHEN 'removed' THEN 'closed' WHEN 'offered' THEN 'offer' ELSE 'waitlist' END, 'website', 'Joined the waitlist', w.created_at FROM public.course_waitlist w;