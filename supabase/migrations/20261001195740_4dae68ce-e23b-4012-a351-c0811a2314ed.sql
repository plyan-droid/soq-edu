CREATE TABLE public.classroom_threads (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 course_slug text NOT NULL,
 author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 author_name text NOT NULL,
 title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 160),
 body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classroom_threads TO authenticated;
GRANT ALL ON public.classroom_threads TO service_role;
ALTER TABLE public.classroom_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read course threads" ON public.classroom_threads FOR SELECT TO authenticated USING (public.in_course(auth.uid(), course_slug));
CREATE POLICY "Members create own course threads" ON public.classroom_threads FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND public.in_course(auth.uid(), course_slug));
CREATE POLICY "Authors edit own threads" ON public.classroom_threads FOR UPDATE TO authenticated USING (author_id = auth.uid() AND public.in_course(auth.uid(), course_slug)) WITH CHECK (author_id = auth.uid() AND public.in_course(auth.uid(), course_slug));
CREATE POLICY "Authors and staff remove threads" ON public.classroom_threads FOR DELETE TO authenticated USING ((author_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')) AND public.in_course(auth.uid(), course_slug));
CREATE OR REPLACE FUNCTION public.touch_classroom_thread() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); NEW.course_slug = OLD.course_slug; NEW.author_id = OLD.author_id; NEW.author_name = OLD.author_name; RETURN NEW; END $$;
CREATE TRIGGER classroom_thread_updated BEFORE UPDATE ON public.classroom_threads FOR EACH ROW EXECUTE FUNCTION public.touch_classroom_thread();
CREATE TABLE public.classroom_replies (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 thread_id uuid NOT NULL REFERENCES public.classroom_threads(id) ON DELETE CASCADE,
 author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 author_name text NOT NULL,
 body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 3000),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classroom_replies TO authenticated;
GRANT ALL ON public.classroom_replies TO service_role;
ALTER TABLE public.classroom_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read course replies" ON public.classroom_replies FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.classroom_threads t WHERE t.id = thread_id AND public.in_course(auth.uid(), t.course_slug)));
CREATE POLICY "Members create own course replies" ON public.classroom_replies FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.classroom_threads t WHERE t.id = thread_id AND public.in_course(auth.uid(), t.course_slug)));
CREATE POLICY "Authors edit own replies" ON public.classroom_replies FOR UPDATE TO authenticated USING (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.classroom_threads t WHERE t.id = thread_id AND public.in_course(auth.uid(), t.course_slug))) WITH CHECK (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.classroom_threads t WHERE t.id = thread_id AND public.in_course(auth.uid(), t.course_slug)));
CREATE POLICY "Authors and staff remove replies" ON public.classroom_replies FOR DELETE TO authenticated USING ((author_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')) AND EXISTS (SELECT 1 FROM public.classroom_threads t WHERE t.id = thread_id AND public.in_course(auth.uid(), t.course_slug)));
CREATE OR REPLACE FUNCTION public.touch_classroom_reply() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); NEW.thread_id = OLD.thread_id; NEW.author_id = OLD.author_id; NEW.author_name = OLD.author_name; RETURN NEW; END $$;
CREATE TRIGGER classroom_reply_updated BEFORE UPDATE ON public.classroom_replies FOR EACH ROW EXECUTE FUNCTION public.touch_classroom_reply();