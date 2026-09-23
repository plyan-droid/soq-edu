CREATE TABLE public.community_livestreams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 150),
  description text NOT NULL DEFAULT '',
  hosts text,
  video_url text NOT NULL,
  starts_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','live','ended')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.community_livestreams TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_livestreams TO authenticated;
GRANT ALL ON public.community_livestreams TO service_role;
ALTER TABLE public.community_livestreams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view livestreams" ON public.community_livestreams FOR SELECT USING (true);
CREATE POLICY "Staff manage livestreams" ON public.community_livestreams FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));