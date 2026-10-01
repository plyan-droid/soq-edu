INSERT INTO public.posts (id, author_id, title, body, tags, created_at, updated_at) VALUES
('10000000-0000-4000-a000-000000000101','00000000-0000-4000-a000-000000000002','[DEMO] How I sanitise lash tweezers between clients','Autoclave if you have one; if not, wash, soak in 70% alcohol for ten minutes and dry on a clean towel. Never just wipe them.','{beauty,hygiene}', now()-interval '6 hours', now()-interval '6 hours'),
('10000000-0000-4000-a000-000000000102','00000000-0000-4000-a000-000000000003','[DEMO] Anyone claimed SkillsFuture for the AI course this month?','I applied last week and the claim is still pending. How long did yours take to be approved?','{skillsfuture,ai}', now()-interval '1 day', now()-interval '1 day'),
('10000000-0000-4000-a000-000000000103','00000000-0000-4000-a000-000000000004','[DEMO] GlowHaus is looking for weekend facial therapists','Two part-time roles at our Tampines outlet. SOQ graduates are welcome to message us with your certificate.','{jobs}', now()-interval '2 days', now()-interval '2 days'),
('10000000-0000-4000-a000-000000000104','00000000-0000-4000-a000-000000000005','[DEMO] My bridal kit checklist for humid outdoor shoots','Primer, setting spray, blotting papers and a mini fan. Here is the full list I bring to every wedding.','{makeup}', now()-interval '3 days', now()-interval '3 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.post_comments (post_id, author_id, body, created_at) VALUES
('10000000-0000-4000-a000-000000000101','00000000-0000-4000-a000-000000000001','[DEMO] Great reminder. I switched to an autoclave last year and never looked back.', now()-interval '4 hours'),
('10000000-0000-4000-a000-000000000101','00000000-0000-4000-a000-000000000008','[DEMO] Is 70% better than 90% alcohol?', now()-interval '3 hours'),
('10000000-0000-4000-a000-000000000102','00000000-0000-4000-a000-000000000011','[DEMO] Mine took about five working days.', now()-interval '20 hours'),
('10000000-0000-4000-a000-000000000102','00000000-0000-4000-a000-000000000010','[DEMO] Check the course reference matches exactly; that usually causes delays.', now()-interval '18 hours'),
('10000000-0000-4000-a000-000000000103','00000000-0000-4000-a000-000000000006','[DEMO] Is the role open to students still finishing their course?', now()-interval '1 day'),
('10000000-0000-4000-a000-000000000104','00000000-0000-4000-a000-000000000009','[DEMO] Saving this for my sister''s wedding, thank you!', now()-interval '2 days');