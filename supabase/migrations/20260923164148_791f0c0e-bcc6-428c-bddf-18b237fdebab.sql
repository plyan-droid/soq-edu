ALTER TABLE public.community_profiles DISABLE TRIGGER guard_profile_verification;
INSERT INTO public.community_profiles (id, username, display_name, bio, member_type, verified, verified_at) VALUES
('00000000-0000-4000-a000-000000000009','wei_builds','Tan Wei Jie','Backend developer. Writes about APIs, testing and shipping small tools.','alumni',false,null),
('00000000-0000-4000-a000-000000000010','ai_with_farah','Farah Iskandar','SOQ AI trainer. Explains AI without the hype.','trainer',true,now()),
('00000000-0000-4000-a000-000000000011','kelvin_switch','Kelvin Lau','Ex-F&B manager, now learning to code at 38.','student',false,null)
ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.community_profiles ENABLE TRIGGER guard_profile_verification;

INSERT INTO public.posts (id, author_id, title, body, tags, created_at) VALUES
('10000000-0000-4000-a000-000000000010','00000000-0000-4000-a000-000000000009','API Performance Testing: How to Design Realistic Tests',
$b$Most load tests lie. They hammer one endpoint with identical requests and call it a day. Real users do not behave like that.

## 1. Model real traffic, not one endpoint

Look at your logs. If 70% of calls are `GET /courses` and 5% are `POST /applications`, your test mix should match.

## 2. Use think time

Real people pause between clicks. Add 1–5 seconds of random wait per virtual user, otherwise you are testing a bot swarm.

## 3. Vary the data

Caches make identical requests look fast. Randomise IDs, search terms and payload sizes.

```js
import http from "k6/http";
import { sleep } from "k6";

export const options = { stages: [
  { duration: "2m", target: 50 },
  { duration: "5m", target: 50 },
  { duration: "1m", target: 0 },
]};

export default function () {
  const id = Math.floor(Math.random() * 39) + 1;
  http.get(`https://api.example.com/courses/${id}`);
  sleep(Math.random() * 4 + 1);
}
```

## 4. Watch percentiles, not averages

- **p50** tells you the normal experience
- **p95 / p99** tell you who is suffering
- Error rate matters more than speed

> An average of 200ms can hide 1 in 20 users waiting 4 seconds.

What tools are you all using: k6, JMeter, Locust?$b$,
ARRAY['api','testing','performance'], now() - interval '3 hours'),

('10000000-0000-4000-a000-000000000011','00000000-0000-4000-a000-000000000010','How AI Actually Calls an API? Tool Calling Explained from Scratch',
$b$People think ChatGPT "goes on the internet". It does not. The model only ever produces text. Tool calling is a clever agreement about what that text looks like.

## The loop

1. You send the model a question plus a list of tools it may use
2. The model replies with JSON saying which tool and which arguments
3. **Your code** runs the tool and sends the result back
4. The model writes the final answer using that result

```json
{
  "tool": "get_course_fee",
  "arguments": { "course": "Certificate in Eyelash Extension" }
}
```

The model never touched your database. Your program did. That is why tool calling is safe to control: you decide which tools exist.

## Video walkthrough

I recorded a 12-minute whiteboard version of this for my class. Search "tool calling explained from scratch" on YouTube for similar walkthroughs, or paste a YouTube link on its own line in any post and it plays right here in the community.

Questions welcome, especially the "but how does it know which tool to pick?" one.$b$,
ARRAY['ai','video','api'], now() - interval '7 hours'),

('10000000-0000-4000-a000-000000000012','00000000-0000-4000-a000-000000000011','You''re not an impostor, you just started from a different line',
$b$I ran restaurants for 14 years. Last month I sat in a room of 22-year-olds learning what a variable is, and I wanted to leave on day one.

Then our trainer said something that stuck:

> Everyone here is at the start line. You just walked further to get to it.

## What I bring that they don't

- I have handled a Saturday dinner rush with two staff missing. A failing test does not scare me.
- I know how to talk to angry customers, which turns out to be most of requirements gathering.
- I show up on time, every time.

## What I am still bad at

Git. Honestly, Git.

If you are switching careers later in life, you are not behind. You are carrying different luggage. Some of it is heavy, but a lot of it is useful.$b$,
ARRAY['careers','motivation'], now() - interval '1 day 2 hours'),

('10000000-0000-4000-a000-000000000013','00000000-0000-4000-a000-000000000009','I got rejected for using AI in an interview. Then I watched the interviewer do it',
$b$Take-home task, 48 hours. I used an AI assistant to scaffold the tests, wrote everything else myself, and said so in my README. I thought honesty would count.

Rejection email: "We are looking for candidates who can work independently of AI tools."

Two weeks later I joined a meetup where the same company demoed their internal workflow. The engineering lead live-coded with an AI assistant for 40 minutes.

## What I took from it

1. Companies have not agreed on the rules yet, and candidates pay for it
2. Ask upfront: "Is AI assistance allowed for this task?"
3. Be ready to explain every line, whether you or a tool wrote it

I am not angry anymore. I got a better offer a month later from a team that asked me to show *how* I use AI.

Have you been through something similar?$b$,
ARRAY['careers','ai','interviews'], now() - interval '2 days 5 hours'),

('10000000-0000-4000-a000-000000000014','00000000-0000-4000-a000-000000000010','Testing your prompts like code: a beginner checklist',
$b$If a prompt runs your business process, treat it like code. Here is the checklist I give every AI class.

- Keep 10 real example inputs in a spreadsheet
- Write down the answer you expect for each
- Re-run all 10 every time you change the prompt
- Track which ones got worse, not just better
- Save each prompt version with a date

It takes 20 minutes to set up and saves you from the "it worked yesterday" panic.$b$,
ARRAY['ai','testing','studytips'], now() - interval '4 days'),

('10000000-0000-4000-a000-000000000015','00000000-0000-4000-a000-000000000003','Video: I built a WhatsApp enquiry bot in one afternoon (no code)',
$b$Following up on my reporting post. This time I connected a form, a spreadsheet and an AI step so new enquiries get a draft reply in under a minute.

## What is in the video

1. Setting up the form fields
2. Writing the AI instruction (with our tone of voice)
3. The approval step, because nothing goes out without a human check

I will add the YouTube link here once it is uploaded. Tip for others: paste a YouTube link on its own line and it shows as a player in your post.$b$,
ARRAY['ai','video','business'], now() - interval '5 days'),

('10000000-0000-4000-a000-000000000016','00000000-0000-4000-a000-000000000009','REST vs webhooks, explained with a bubble tea shop',
$b$**Polling (REST):** you walk to the counter every 30 seconds and ask "is my drink ready?"

**Webhook:** they give you a buzzer. It buzzes when your drink is ready.

Polling is simple but wasteful. Webhooks are efficient but you need to be "listening" (a public URL) and you must check the buzzer is really from the shop (verify the signature).

```
POST /api/webhooks/payment
X-Signature: 9f2c...
{ "event": "payment.succeeded", "amount": 21600 }
```

That is 90% of what you need to know for your first integration.$b$,
ARRAY['api','beginners'], now() - interval '6 days');

INSERT INTO public.post_comments (post_id, author_id, body, created_at) VALUES
('10000000-0000-4000-a000-000000000010','00000000-0000-4000-a000-000000000003','The think-time point is gold. Our first load test was basically a DDoS on ourselves.', now() - interval '2 hours'),
('10000000-0000-4000-a000-000000000011','00000000-0000-4000-a000-000000000011','Finally someone explains it without jargon. So the model is just writing a request form?', now() - interval '5 hours'),
('10000000-0000-4000-a000-000000000011','00000000-0000-4000-a000-000000000010','Exactly. A very well-read request form writer.', now() - interval '4 hours'),
('10000000-0000-4000-a000-000000000012','00000000-0000-4000-a000-000000000005','Switched from banking to makeup at 34. This post is for me too.', now() - interval '20 hours'),
('10000000-0000-4000-a000-000000000012','00000000-0000-4000-a000-000000000009','Git is bad for everyone, you are in good company.', now() - interval '18 hours'),
('10000000-0000-4000-a000-000000000013','00000000-0000-4000-a000-000000000010','Point 3 is what I tell every student. Tools are fine, not understanding your own work is not.', now() - interval '2 days');

INSERT INTO public.post_likes (post_id, user_id)
SELECT p.id, u.id FROM public.posts p CROSS JOIN public.community_profiles u
WHERE p.id::text BETWEEN '10000000-0000-4000-a000-000000000010' AND '10000000-0000-4000-a000-000000000016'
  AND u.id::text LIKE '00000000-0000-4000-a000-%' AND u.id <> p.author_id
  AND (abs(hashtext(p.id::text || u.id::text)) % 3) <> 0
ON CONFLICT DO NOTHING;