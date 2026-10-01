ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'workshop',
  ADD COLUMN IF NOT EXISTS ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS speaker text,
  ADD COLUMN IF NOT EXISTS speaker_role text,
  ADD COLUMN IF NOT EXISTS image_key text,
  ADD COLUMN IF NOT EXISTS agenda text;

INSERT INTO public.events (title, description, starts_at, ends_at, location, online_url, capacity, created_by, category, speaker, speaker_role, image_key, agenda)
SELECT v.title, v.descr, v.s::timestamptz, v.e::timestamptz, v.loc, v.url, v.cap, u.id, v.cat, v.spk, v.role, v.img, v.agenda
FROM (VALUES
 ('[DEMO] SOQ Open House — Beauty & Wellness', 'Tour our training studios, meet the trainers and try a short hands-on demo. Ask about intakes and SkillsFuture Credit.', '2026-10-17 10:00+08', '2026-10-17 13:00+08', '10 Anson Road, International Plaza, Singapore', NULL, 40, 'open_house', 'Jeff Lim', 'Academic Director', 'diploma-in-professional-make-up', '10:00 Welcome and studio tour
10:45 Live lash and make-up demo
11:30 Funding and intakes Q&A
12:15 One-to-one course advice'),
 ('[DEMO] Generative AI for Small Businesses', 'A practical online talk on using AI tools for marketing, content and customer service.', '2026-10-24 19:30+08', '2026-10-24 21:00+08', 'Online', 'https://meet.example.com/soq-ai', 100, 'talk', '[DEMO] Aisha Rahman', 'Business trainer', 'ai-course-singapore', '19:30 Why AI matters now
20:00 Live tool walkthrough
20:40 Q&A'),
 ('[DEMO] Korean Guasha Taster Workshop', 'Learn the basics of lymphatic guasha in a small-group taster session. Tools provided.', '2026-11-07 14:00+08', '2026-11-07 16:00+08', '10 Anson Road, International Plaza, Singapore', NULL, 12, 'workshop', '[DEMO] Priya Nair', 'Wellness trainer', 'korea-lymph-detoxification-guasha', NULL),
 ('[DEMO] Diploma Graduation Showcase', 'Celebrate our graduates and see their final portfolio work.', '2026-09-12 15:00+08', '2026-09-12 18:00+08', '10 Anson Road, International Plaza, Singapore', NULL, 80, 'showcase', '[DEMO] Marcus Tan', 'Make-up trainer', 'make-up-master-class', NULL)
) AS v(title, descr, s, e, loc, url, cap, cat, spk, role, img, agenda)
CROSS JOIN LATERAL (SELECT user_id AS id FROM public.user_roles WHERE role = 'admin' LIMIT 1) u;