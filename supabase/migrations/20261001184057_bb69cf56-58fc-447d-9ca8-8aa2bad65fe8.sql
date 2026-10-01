WITH f AS (
  INSERT INTO public.custom_forms (slug, title, intro, fields, active)
  VALUES ('open-house-demo', 'SOQ Open House RSVP [DEMO]', 'Join us for a tour of our studios, meet our trainers and try a mini class. Sample form for illustration.',
  '[{"label":"Full name","type":"text","required":true},{"label":"Email","type":"email","required":true},{"label":"Preferred session","type":"select","required":true,"options":"Saturday morning, Saturday afternoon, Sunday morning"},{"label":"Courses you are interested in","type":"textarea","required":false}]'::jsonb, true)
  ON CONFLICT (slug) DO NOTHING
  RETURNING id
)
INSERT INTO public.form_responses (form_id, data, created_at)
SELECT f.id, r.data::jsonb, now() - r.ago::interval FROM f, (VALUES
 ('{"Full name":"[DEMO] Rachel Lim","Email":"rachel.demo@example.com","Preferred session":"Saturday morning","Courses you are interested in":"Lash extensions and brow shaping"}','2 hours'),
 ('{"Full name":"[DEMO] David Tan","Email":"david.demo@example.com","Preferred session":"Sunday morning","Courses you are interested in":"AI course for business owners"}','1 day'),
 ('{"Full name":"[DEMO] Priya Nair","Email":"priya.demo@example.com","Preferred session":"Saturday afternoon","Courses you are interested in":"Digital marketing with generative AI"}','2 days'),
 ('{"Full name":"[DEMO] Siti Aminah","Email":"siti.demo@example.com","Preferred session":"Saturday morning","Courses you are interested in":""}','3 days')
) AS r(data, ago);