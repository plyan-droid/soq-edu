ALTER TABLE public.community_profiles DROP CONSTRAINT community_profiles_id_fkey;
ALTER TABLE public.post_likes DROP CONSTRAINT post_likes_user_id_fkey;
ALTER TABLE public.community_profiles DISABLE TRIGGER guard_profile_verification;

INSERT INTO public.community_profiles (id, username, display_name, bio, member_type, verified, verified_at) VALUES
('00000000-0000-4000-a000-000000000001','mei_lashes','Mei Ling Tan','Lash artist, SOQ Eyelash Extension alumni. Running a home studio in Tampines.','alumni',false,null),
('00000000-0000-4000-a000-000000000002','coach_rachel','Rachel Goh','SOQ beauty trainer. 12 years in skincare and spa therapy.','trainer',true,now()),
('00000000-0000-4000-a000-000000000003','daniel_ai','Daniel Koh','Ops manager learning generative AI for small business workflows.','student',false,null),
('00000000-0000-4000-a000-000000000004','glowhaus_sg','GlowHaus Studio','Boutique beauty studio in Orchard. Hiring certified therapists.','business',true,now()),
('00000000-0000-4000-a000-000000000005','priya_mua','Priya Nair','Bridal makeup artist. Part-time, weekends only.','alumni',false,null),
('00000000-0000-4000-a000-000000000006','ahmad_retail','Ahmad Rahman','Retail supervisor upskilling in customer service.','student',false,null),
('00000000-0000-4000-a000-000000000007','serene_spa','Serene Lim','Wellness trainer. Aromatherapy and massage.','trainer',true,now()),
('00000000-0000-4000-a000-000000000008','nailedit_joy','Joy Wong','Just started the nail course. Asking lots of questions!','member',false,null);

ALTER TABLE public.community_profiles ENABLE TRIGGER guard_profile_verification;

INSERT INTO public.posts (id, author_id, title, body, tags, created_at) VALUES
('10000000-0000-4000-a000-000000000001','00000000-0000-4000-a000-000000000001','How I turned my lash certificate into a home studio in 6 months','When I finished the eyelash extension course I had no clients and a lot of nerves. Here is exactly what I did: practised on 20 friends for free, took before/after photos in natural light, and opened bookings on Instagram only after I could do a full set in under two hours. Month three was the turning point: repeat refills. Happy to answer questions below.',ARRAY['lashes','beauty','business'], now() - interval '2 days'),
('10000000-0000-4000-a000-000000000002','00000000-0000-4000-a000-000000000002','5 hygiene mistakes I see in every new beauty therapist','1. Reusing tweezers between clients without sterilising. 2. Skipping the patch test. 3. Touching your phone mid-treatment. 4. Not recording client allergies. 5. Storing adhesives in a hot room. Clients notice these things, and so do assessors. Build the habits now and they become automatic.',ARRAY['beauty','studytips','wellness'], now() - interval '3 days'),
('10000000-0000-4000-a000-000000000003','00000000-0000-4000-a000-000000000003','I used ChatGPT to cut our weekly reporting from 4 hours to 30 minutes','After the AI course I finally understood prompting properly. The trick was giving the model our report template and three past examples, then asking it to fill in from a pasted spreadsheet. I still check every number, but the first draft is instant. Sharing my prompt template in the comments if useful.',ARRAY['ai','business','careers'], now() - interval '1 day'),
('10000000-0000-4000-a000-000000000004','00000000-0000-4000-a000-000000000004','We are hiring 2 certified facial therapists (Orchard)','GlowHaus is looking for two therapists with a recognised facial or skincare certificate. Full-time or part-time, training on our devices provided. Fresh graduates welcome, we care more about attitude and hygiene than years of experience. Message us through our website.',ARRAY['jobs','beauty','careers'], now() - interval '5 hours'),
('10000000-0000-4000-a000-000000000005','00000000-0000-4000-a000-000000000005','Bridal makeup that survives a Singapore outdoor wedding','Heat and humidity are the enemy. My kit: mattifying primer, long-wear foundation applied thin, setting spray between layers, and blotting papers handed to the bride. Waterproof everything for the eyes. Do a trial at the actual venue time of day if you can.',ARRAY['makeup','beauty'], now() - interval '4 days'),
('10000000-0000-4000-a000-000000000006','00000000-0000-4000-a000-000000000006','Using SkillsFuture Credit: what I wish I knew before signing up','Check your balance on the MySkillsFuture portal first, then confirm the course is eligible before paying anything. The funding is applied at registration, not refunded later. Also, you need 75% attendance or you may have to repay. Ask the SOQ advisers, they walked me through it in ten minutes.',ARRAY['funding','studytips'], now() - interval '6 days'),
('10000000-0000-4000-a000-000000000007','00000000-0000-4000-a000-000000000007','Aromatherapy basics: 3 oils every beginner should know','Lavender for relaxation, peppermint for tension headaches, eucalyptus for congestion. Always dilute in a carrier oil and ask about pregnancy and allergies before use. In class we go much deeper into blending, but these three will cover most first client requests.',ARRAY['wellness','beauty'], now() - interval '8 days'),
('10000000-0000-4000-a000-000000000008','00000000-0000-4000-a000-000000000008','First week of nail class: is it normal to be this slow?','Took me almost 90 minutes to do a basic gel manicure on a practice hand. Everyone else seemed faster. Does it get better? Any tips for cuticle work?',ARRAY['beauty','studytips'], now() - interval '10 hours'),
('10000000-0000-4000-a000-000000000009','00000000-0000-4000-a000-000000000006','Handling angry customers: the phrase that changed everything','"I understand why that is frustrating, let me fix it." Acknowledge first, solve second. The customer service course role-plays were awkward at the time but I used this line three times last week and every situation calmed down.',ARRAY['retail','careers'], now() - interval '12 days');

INSERT INTO public.post_comments (post_id, author_id, body, created_at) VALUES
('10000000-0000-4000-a000-000000000001','00000000-0000-4000-a000-000000000008','This is so encouraging. How did you price your first sets?', now() - interval '1 day'),
('10000000-0000-4000-a000-000000000001','00000000-0000-4000-a000-000000000001','Started at half my target price for the first 10 clients, then raised it once I had reviews.', now() - interval '20 hours'),
('10000000-0000-4000-a000-000000000002','00000000-0000-4000-a000-000000000005','Number 3 is so real. Saving this.', now() - interval '2 days'),
('10000000-0000-4000-a000-000000000003','00000000-0000-4000-a000-000000000006','Please share the template!', now() - interval '12 hours'),
('10000000-0000-4000-a000-000000000008','00000000-0000-4000-a000-000000000002','Completely normal. Speed comes from repetition. Focus on clean cuticles first, and push back gently after soaking.', now() - interval '6 hours'),
('10000000-0000-4000-a000-000000000008','00000000-0000-4000-a000-000000000001','I was the slowest in my lash class too. You will get there.', now() - interval '5 hours'),
('10000000-0000-4000-a000-000000000004','00000000-0000-4000-a000-000000000001','Do you accept part-time on weekends only?', now() - interval '3 hours'),
('10000000-0000-4000-a000-000000000006','00000000-0000-4000-a000-000000000003','Good tip on the attendance rule, did not know that.', now() - interval '5 days');

INSERT INTO public.post_likes (post_id, user_id)
SELECT p.id, u.id FROM public.posts p CROSS JOIN public.community_profiles u
WHERE p.id::text LIKE '10000000-%' AND u.id::text LIKE '00000000-0000-4000-a000-%' AND u.id <> p.author_id
  AND (abs(hashtext(p.id::text || u.id::text)) % 3) <> 0;