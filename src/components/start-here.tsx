import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Circle, X, CalendarDays, CreditCard, UsersRound, ClipboardList, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { courses } from "@/lib/site-content";
import { useWorkspaceNavigate } from "@/components/workspace-shell";

export type StartRole = "student" | "trainer" | "business" | "staff";
type Card = { tool: string; title: string; text: string; count?: number | undefined; badge?: string | undefined };
type Step = { label: string; done: boolean; tool: string };
type Home = { cards: Card[]; steps: Step[]; highlights?: { title: string; detail: string; tool: string }[]; metrics?: { label: string; value: string }[]; identity?: string | undefined; panels?: { title: string; empty: string; items: { label: string; detail: string; tool: string; at?: string }[] }[]; breakdown?: { title: string; items: { label: string; count: number }[] }; unavailable?: string };

const head = { count: "exact" as const, head: true };
const n = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;
const title = (slug: string) => courses.find(c => c.slug === slug)?.title ?? slug;
const day = (d: string) => new Date(d).toLocaleDateString("en-SG", { day: "numeric", month: "short" });
const plural = (k: number, w: string) => `${k} ${k === 1 ? w : w.endsWith("enquiry") ? `${w.slice(0, -7)}enquiries` : `${w}s`}`;

async function load(role: StartRole, uid: string, email = "", owner = false): Promise<Home> {
  const now = new Date().toISOString();
  if (role === "trainer") {
    const [reqs, live, slots, profile, lessons, drafts, courseRows] = await Promise.all([
      n(supabase.from("session_bookings").select("id, live_sessions!inner(trainer_id,starts_at)", head).eq("status", "requested").eq("live_sessions.trainer_id", uid).gte("live_sessions.starts_at", now)),
      n(supabase.from("live_sessions").select("id", head).eq("trainer_id", uid)),
      n(supabase.from("meeting_slots").select("id", head).eq("trainer_id", uid)),
      n(supabase.from("tutor_profiles").select("user_id", head).eq("user_id", uid)),
      n(supabase.from("lessons").select("id", head).eq("created_by", uid)),
      n(supabase.from("course_drafts").select("id", head).eq("trainer_id", uid)),
      n(supabase.from("trainer_courses").select("course_slug", head).eq("trainer_id", uid)),
    ]);
    const roster = ((await supabase.rpc("trainer_roster" as never)).data ?? []) as unknown as { progress: number; status: string; course_slug: string }[];
    const upcoming = await supabase.from("live_sessions").select("title,starts_at").eq("trainer_id", uid).neq("status", "cancelled").gte("starts_at", now).order("starts_at").limit(3);
    const slugs = (await supabase.from("trainer_courses").select("course_slug").eq("trainer_id", uid)).data?.map(r => r.course_slug) ?? [];
    const [assignmentResult, questionResult, quizResult, meetingResult, noticeResult, eventResult, sessionsResult] = await Promise.all([
      slugs.length ? supabase.from("assignments").select("id,title,course_slug,due_at,assignment_submissions(id,status,student_name)").in("course_slug", slugs).order("created_at", { ascending: false }).limit(30) : Promise.resolve({ data: [] }),
      slugs.length ? supabase.from("course_questions").select("id,body,author_name,course_slug,created_at,course_answers(id)").in("course_slug", slugs).order("created_at", { ascending: false }).limit(30) : Promise.resolve({ data: [] }),
      slugs.length ? supabase.from("quizzes").select("id,title,course_slug,quiz_attempts(score,passed)").in("course_slug", slugs).limit(40) : Promise.resolve({ data: [] }),
      supabase.from("meeting_slots").select("topic,starts_at,booked_name").eq("trainer_id", uid).not("booked_by", "is", null).gte("starts_at", now).order("starts_at").limit(4),
      supabase.from("site_notices").select("title,body,created_at").order("created_at", { ascending: false }).limit(3),
      supabase.from("events").select("title,starts_at").gte("starts_at", now).order("starts_at").limit(4),
      supabase.from("live_sessions").select("title,starts_at,course_slug").eq("trainer_id", uid).neq("status", "cancelled").gte("starts_at", now).order("starts_at").limit(5),
    ]);
    const assignments = assignmentResult.data ?? [];
    const pending = assignments.flatMap(a => (a.assignment_submissions ?? []).filter(s => s.status !== "graded").map(s => ({ label: a.title, detail: `${s.student_name} · ${title(a.course_slug)}`, tool: "assignments" })));
    const questions = (questionResult.data ?? []).filter(q => !(q.course_answers ?? []).length);
    const quizAttempts = (quizResult.data ?? []).flatMap(q => (q.quiz_attempts ?? []).map(a => ({ ...a, title: q.title, slug: q.course_slug })));
    const courseCounts = slugs.map(slug => ({ label: title(slug), count: roster.filter(r => r.course_slug === slug).length }));
    const behind = roster.filter(r => r.status !== "completed" && r.progress < 30).length;
    return {
      cards: [
        { tool: "live", title: "Confirm seat requests", text: reqs ? "Students are waiting to hear back about a class." : "No one is waiting right now.", count: reqs },
        { tool: "live", title: "Add a class", text: "Schedule a live class with a date, time and meeting link." },
        { tool: "students", title: "Check students", text: behind ? `${plural(behind, "student")} under 30% progress.` : "See everyone's progress at a glance.", count: behind },
        { tool: "assignments", title: "Review submissions", text: pending.length ? `${plural(pending.length, "submission")} to grade.` : "No submissions waiting for grading.", count: pending.length },
        { tool: "overview", title: "Course questions", text: questions.length ? `${plural(questions.length, "question")} without an answer.` : "No unanswered questions in your courses.", count: questions.length },
        { tool: "lessons", title: "Add a lesson", text: "Notes, a video or materials for one of your courses." },
      ],
      metrics: [{ label: "Courses I teach", value: String(courseRows) }, { label: "Students", value: String(roster.length) }, { label: "Upcoming live classes", value: String(upcoming.data?.length ?? 0) }, { label: "Booked 1-to-1 meetings", value: String(meetingResult.data?.length ?? 0) }, { label: "Submissions to grade", value: String(pending.length) }, { label: "Quiz attempts", value: String(quizAttempts.length) }],
      highlights: [
        ...(sessionsResult.data ?? []).map(s => ({ title: s.title, detail: `${title(s.course_slug)} · live class · ${day(s.starts_at)}`, tool: "calendar" })),
        ...(meetingResult.data ?? []).map(s => ({ title: s.topic, detail: `1-to-1 with ${s.booked_name || "learner"} · ${day(s.starts_at)}`, tool: "calendar" })),
      ].slice(0, 6),
      breakdown: { title: "Students by course", items: courseCounts },
      panels: [
        { title: "My courses", empty: "No courses assigned yet.", items: slugs.slice(0, 5).map(slug => ({ label: title(slug), detail: `${roster.filter(r => r.course_slug === slug).length} students · ${roster.filter(r => r.course_slug === slug).length ? Math.round(roster.filter(r => r.course_slug === slug).reduce((sum, r) => sum + r.progress, 0) / roster.filter(r => r.course_slug === slug).length) : 0}% average progress`, tool: "overview" })) },
        { title: "Assignments to review", empty: "No submissions waiting for grading.", items: pending.slice(0, 4) },
        { title: "Course questions", empty: "No unanswered questions.", items: questions.slice(0, 4).map(q => ({ label: q.body.slice(0, 90), detail: `${q.author_name} · ${title(q.course_slug)}`, tool: "overview" })) },
        { title: "Student quiz results", empty: "No quiz attempts yet.", items: quizAttempts.slice(0, 4).map(a => ({ label: a.title, detail: `${title(a.slug)} · ${a.score}% · ${a.passed ? "passed" : "not passed"}`, tool: "quizzes" })) },
        { title: "Noticeboard", empty: "No notices yet.", items: (noticeResult.data ?? []).map(x => ({ label: x.title, detail: x.body.slice(0, 90), tool: "notices" })) },
        { title: "Upcoming events", empty: "No upcoming events.", items: (eventResult.data ?? []).map(x => ({ label: x.title, detail: day(x.starts_at), tool: "calendar" })) },
      ],
      steps: [
        { label: "Fill in your public tutor profile", done: profile > 0, tool: "profile" },
        { label: "Get a course assigned or propose one", done: courseRows + drafts > 0, tool: "drafts" },
        { label: "Add your first lesson", done: lessons > 0, tool: "lessons" },
        { label: "Schedule a live class", done: live > 0, tool: "live" },
        { label: "Offer a 1-to-1 time slot", done: slots > 0, tool: "slots" },
      ],
      unavailable: "Sales, wallet balance, payouts and visitor figures are unavailable because instructor earnings and traffic are not connected to this portal.",
    };
  }
  if (role === "student") {
    const [enr, certs, sfc, inst, prof, org] = await Promise.all([
      supabase.from("enrollments").select("id,course_slug,progress,status").eq("student_id", uid).order("progress", { ascending: false }),
      n(supabase.from("certificates").select("id", head).eq("student_id", uid).eq("status", "valid")),
      n(supabase.from("sfc_claims").select("id", head).eq("user_id", uid)),
      supabase.from("instalments").select("amount,due_date").eq("user_id", uid).eq("paid", false).order("due_date").limit(1),
      supabase.from("profiles").select("full_name").eq("id", uid).maybeSingle(),
      email ? supabase.from("org_members").select("org_id").eq("member_role", "student").ilike("member_email", email).limit(1) : Promise.resolve({ data: [] }),
    ]);
    const orgId = org.data?.[0]?.org_id;
    const orgName = orgId ? (await supabase.from("profiles").select("full_name,email").eq("id", orgId).maybeSingle()).data : null;
    const rows = (enr.data ?? []) as { course_slug: string; progress: number; status: string }[];
    const current = rows.find(r => r.status !== "completed" && r.progress < 100) ?? rows[0];
    const slugs = rows.map(r => r.course_slug);
    const [taskRows, bookingRows] = await Promise.all([
      rows.length ? supabase.from("course_tasks").select("title,kind,due_at,enrollment_id,status").in("enrollment_id", (enr.data ?? []).map(r => r.id)).eq("status", "upcoming").gte("due_at", now).order("due_at").limit(3) : Promise.resolve({ data: [] }),
      supabase.from("session_bookings").select("session_id").eq("student_id", uid).eq("status", "confirmed"),
    ]);
    const bookingIds = (bookingRows.data ?? []).map(b => b.session_id);
    const nextSessions = bookingIds.length ? (await supabase.from("live_sessions").select("title,starts_at").in("id", bookingIds).neq("status", "cancelled").gte("starts_at", now).order("starts_at").limit(3)).data ?? [] : [];
    const next = nextSessions[0];
    const due = inst.data?.[0];
    const [assignments, quizzes] = await Promise.all([
      slugs.length ? supabase.from("assignments").select("title,course_slug,due_at").in("course_slug", slugs).gte("due_at", now).order("due_at").limit(4) : Promise.resolve({ data: [] }),
      slugs.length ? supabase.from("quizzes").select("id,title,course_slug").in("course_slug", slugs).limit(30) : Promise.resolve({ data: [] }),
    ]);
    const progress = rows.filter(r => r.status !== "withdrawn").slice(0, 4).map(r => ({ label: title(r.course_slug), detail: `${r.progress}% complete`, tool: "courses" }));
    return {
      cards: [
        current ? { tool: "courses", title: `Continue ${title(current.course_slug)}`, text: `You're ${current.progress}% through.`, badge: `${current.progress}%` } : { tool: "courses", title: "Find your course", text: "You're not enrolled yet. See your applications here." },
        { tool: "courses", title: next ? `Next booked class · ${day(next.starts_at)}` : "Live classes", text: next ? next.title : "No confirmed class yet. Request a seat from a lesson page." },
        { tool: "certs", title: "Get your certificate", text: certs ? `You have ${plural(certs, "certificate")} ready to download.` : "Finish a course and pass its quiz to earn one." },
        { tool: "pay", title: due ? `Pay instalment due ${day(due.due_date)}` : "Payments", text: due ? `S$${due.amount} by PayNow or bank transfer.` : "Nothing due right now.", count: due ? 1 : 0 },
      ],
      identity: orgName?.full_name || orgName?.email,
       metrics: [{ label: "My courses", value: String(rows.length) }, { label: "Tasks due", value: String((taskRows.data ?? []).length) }, { label: "Certificates", value: String(certs) }, { label: "Available quizzes", value: String(quizzes.data?.length ?? 0) }],
      highlights: [
        ...(taskRows.data ?? []).map(t => ({ title: t.title, detail: `${t.kind} · due ${day(t.due_at)}`, tool: "courses" })),
        ...nextSessions.map(s => ({ title: s.title, detail: `Confirmed class · ${day(s.starts_at)}`, tool: "courses" })),
      ],
      panels: [
        { title: "My course progress", empty: "No courses linked yet.", items: progress },
        { title: "Upcoming assignments", empty: "No assignments due soon.", items: (assignments.data ?? []).map(a => ({ label: a.title, detail: `${title(a.course_slug ?? "")} · due ${a.due_at ? day(a.due_at) : "date pending"}`, tool: "courses" })) },
        { title: "Quizzes", empty: "No quizzes available yet.", items: (quizzes.data ?? []).slice(0, 4).map(q => ({ label: q.title, detail: title(q.course_slug), tool: "courses" })) },
      ],
      steps: [
        { label: "Add your full name to your profile", done: !!prof.data?.full_name, tool: "courses" },
        { label: "Open your first lesson", done: rows.some(r => r.progress > 0), tool: "courses" },
        { label: "Add your SkillsFuture Credit balance", done: sfc > 0, tool: "sfc" },
      ],
    };
  }
  if (role === "business") {
    const [members, pkg, roster, notices, events, sessions] = await Promise.all([
      supabase.from("org_members").select("member_email,member_role").eq("org_id", uid),
      supabase.from("org_packages").select("name,student_seats,instructor_seats,expires_on").eq("org_id", uid).maybeSingle(),
      supabase.rpc("org_roster"),
      supabase.from("site_notices").select("title,body,created_at").order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(4),
      supabase.from("events").select("title,starts_at,location").gte("starts_at", now).order("starts_at").limit(4),
      supabase.from("live_sessions").select("title,course_slug,starts_at").neq("status", "cancelled").gte("starts_at", now).order("starts_at").limit(5),
    ]);
    const memberRows = members.data ?? [];
    const students = memberRows.filter(m => m.member_role === "student").length;
    const instructors = memberRows.filter(m => m.member_role === "instructor").length;
    const left = Math.max(0, (pkg.data?.student_seats ?? 0) - students);
    const linked = (roster.data ?? []).filter(r => r.course_slug);
    const lagging = linked.filter(r => (r.progress ?? 0) < 30 && r.status !== "completed");
    const completed = linked.filter(r => r.status === "completed" || (r.progress ?? 0) >= 100).length;
    const average = linked.length ? Math.round(linked.reduce((sum, r) => sum + (r.progress ?? 0), 0) / linked.length) : 0;
    const byCourse = [...new Set(linked.map(r => r.course_slug).filter((slug): slug is string => !!slug))].map(slug => ({ label: title(slug), count: linked.filter(r => r.course_slug === slug).length }));
    const linkedSlugs = new Set(byCourse.map(row => row.label));
    const relevantSessions = (sessions.data ?? []).filter(session => linkedSlugs.has(title(session.course_slug))).slice(0, 4);
    const expiry = pkg.data?.expires_on ? new Date(`${pkg.data.expires_on}T12:00:00`).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" }) : "No expiry date";
    return {
      cards: [
        { tool: "members", title: "Add employees", text: pkg.data ? `${plural(left, "seat")} left on your package.` : "Give your staff a place on SOQ training.", count: students === 0 ? 1 : 0, badge: pkg.data ? `${left} left` : undefined },
        { tool: "progress", title: "See who's behind", text: lagging.length ? `${plural(lagging.length, "course enrolment")} below 30% progress.` : "Course progress for everyone on your team.", count: lagging.length },
        { tool: "certificates", title: "Team certificates", text: "Verify and download certificates your team has earned." },
        { tool: "instructors", title: "Manage instructors", text: instructors ? `${plural(instructors, "instructor")} linked to your organisation.` : "Add an in-house instructor to your package." },
        { tool: "package", title: pkg.data?.name ?? "Set up your package", text: pkg.data ? `${students} of ${pkg.data.student_seats} learner seats used · ${expiry}.` : "Ask SOQ to assign seats for your team." },
      ],
      metrics: [{ label: "Learners", value: String(students) }, { label: "Instructors", value: String(instructors) }, { label: "Course enrolments", value: String(linked.length) }, { label: "Average progress", value: linked.length ? `${average}%` : "—" }, { label: "Completed enrolments", value: String(completed) }, { label: "Upcoming classes", value: String(relevantSessions.length) }],
      highlights: [
        ...relevantSessions.map(s => ({ title: s.title, detail: `${title(s.course_slug)} · live class · ${day(s.starts_at)}`, tool: "progress" })),
        ...linked.slice(0, 4).map(r => ({ title: r.full_name || r.member_email, detail: `${title(r.course_slug ?? "")} · ${r.progress ?? 0}% complete`, tool: "progress" })),
      ].slice(0, 6),
      breakdown: { title: "Team course overview", items: byCourse },
      panels: [
        { title: "Learner progress", empty: "No learners are linked to courses yet.", items: linked.slice(0, 5).map(r => ({ label: r.full_name || r.member_email, detail: `${title(r.course_slug ?? "")} · ${r.progress ?? 0}% · ${r.status ?? "active"}`, tool: "progress" })) },
        { title: "Noticeboard", empty: "No notices at the moment.", items: (notices.data ?? []).map(notice => ({ label: notice.title, detail: notice.body.slice(0, 100), tool: "start" })) },
        { title: "Upcoming events", empty: "No upcoming events.", items: (events.data ?? []).map(event => ({ label: event.title, detail: `${day(event.starts_at)} · ${event.location}`, tool: "start" })) },
        { title: "Package & seats", empty: "No package has been assigned.", items: pkg.data ? [
          { label: pkg.data.name, detail: `${students}/${pkg.data.student_seats} learner seats · ${instructors}/${pkg.data.instructor_seats} instructor seats`, tool: "package" },
          { label: "Package validity", detail: expiry, tool: "package" },
        ] : [] },
      ],
      steps: [
        { label: "Check your package and seats", done: !!pkg.data, tool: "package" },
        { label: "Add your first employee", done: students > 0, tool: "members" },
        { label: "Ask SOQ to enrol them in a course", done: false, tool: "progress" },
      ],
    };
  }
  const [apps, pays, sfc, tickets, trainers, ownerRequests, reviews, comments, users, orders, recentTickets, recentCourses, sessions, recentComments, bookings, recentUsers, events, draftCount, intakes, courseVisibility] = await Promise.all([
    n(supabase.from("course_applications").select("id", head).eq("status", "new")),
    n(supabase.from("bank_payments").select("id", head).eq("status", "pending")),
    n(supabase.from("sfc_claims").select("id", head).in("status", ["submitted", "approved"])),
    n(supabase.from("support_tickets").select("id", head).eq("status", "open")),
    n(supabase.from("trainer_applications").select("id", head).eq("status", "pending")),
    owner ? n(supabase.from("staff_requests").select("id", head).eq("status", "pending")) : Promise.resolve(0),
    n(supabase.from("course_reviews").select("id", head)),
    n(supabase.from("post_comments").select("id", head).eq("hidden", false)),
    n(supabase.from("profiles").select("id", head)),
    supabase.from("orders").select("total,status,created_at,items").order("created_at", { ascending: false }).limit(500),
    supabase.from("support_tickets").select("topic,created_at,status").order("created_at", { ascending: false }).limit(4),
    supabase.from("course_drafts").select("title,status,created_at").order("created_at", { ascending: false }).limit(4),
    supabase.from("live_sessions").select("title,starts_at").gte("starts_at", now).neq("status", "cancelled").order("starts_at").limit(4),
    supabase.from("post_comments").select("body,created_at").eq("hidden", false).order("created_at", { ascending: false }).limit(4),
    n(supabase.from("session_bookings").select("id", head).eq("status", "requested")),
    supabase.from("profiles").select("full_name,created_at").order("created_at", { ascending: false }).limit(4),
    supabase.from("events").select("title,starts_at").gte("starts_at", now).order("starts_at").limit(4),
    n(supabase.from("course_drafts").select("id", head).eq("status", "submitted")),
    supabase.from("course_intakes").select("course_slug,start_date,status").gte("start_date", now.slice(0, 10)).neq("status", "cancelled").order("start_date").limit(30),
    supabase.from("course_overrides").select("slug,title,hidden,custom"),
  ]);
  const visible = new Map((courseVisibility.data ?? []).map(o => [o.slug, o]));
  const known = new Set(courses.map(c => c.slug));
  const upcomingIntakes = (intakes.data ?? []).filter(i => !visible.get(i.course_slug)?.hidden && (known.has(i.course_slug) || visible.get(i.course_slug)?.custom)).slice(0, 4);
  const paid = (orders.data ?? []).filter(o => o.status === "paid");
  const byMonth = new Map<string, number>();
  paid.forEach(o => { const key = o.created_at.slice(0, 7); byMonth.set(key, (byMonth.get(key) ?? 0) + Number(o.total)); });
  const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - (5 - i)); return { key: d.toISOString().slice(0, 7), label: d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }) }; });
  const money = (rows: typeof paid) => `S$${rows.reduce((sum, o) => sum + Number(o.total), 0).toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const today = now.slice(0, 10);
  const weekStart = new Date(); weekStart.setUTCDate(weekStart.getUTCDate() - 7);
  return {
    cards: [
      { tool: "applications", title: "Approve applications", text: apps ? `${plural(apps, "new application")} to review.` : "All caught up.", count: apps },
      { tool: "payments", title: "Confirm payments", text: pays ? `${plural(pays, "PayNow or bank payment")} to check.` : "No payments waiting.", count: pays },
      { tool: "sfc", title: "Settle SkillsFuture claims", text: sfc ? `${plural(sfc, "claim")} to approve or mark paid out.` : "No claims waiting.", count: sfc },
      { tool: "inbox", title: "Reply to enquiries", text: tickets ? `${plural(tickets, "open enquiry")} to review.` : "No enquiries waiting.", count: tickets },
      { tool: "live-classes", title: "Live-class seat requests", text: bookings ? `${plural(bookings, "request")} awaiting a trainer.` : "No seat requests waiting.", count: bookings },
      { tool: "trainers", title: "Review trainer applications", text: trainers ? `${plural(trainers, "trainer application")} waiting.` : "No applications waiting.", count: trainers },
      { tool: "drafts", title: "Review course proposals", text: draftCount ? `${plural(draftCount, "proposal")} awaiting review.` : "No proposals waiting.", count: draftCount },
      ...(owner ? [{ tool: "users", title: "Review staff access", text: ownerRequests ? `${plural(ownerRequests, "access request")} waiting.` : "Manage owner-only accounts and permissions.", count: ownerRequests }] : []),
    ],
    metrics: [{ label: "Paid orders · today (latest 500)", value: String(paid.filter(o => o.created_at.slice(0, 10) === today).length) }, { label: "Paid orders · last 7 days (latest 500)", value: String(paid.filter(o => new Date(o.created_at) >= weekStart).length) }, { label: "Recorded sales · today (latest 500)", value: money(paid.filter(o => o.created_at.slice(0, 10) === today)) }, { label: "Recorded sales · this month (latest 500)", value: money(paid.filter(o => o.created_at.slice(0, 7) === today.slice(0, 7))) }, { label: "Recorded sales · this year (latest 500)", value: money(paid.filter(o => o.created_at.slice(0, 4) === today.slice(0, 4))) }, { label: "Recorded paid orders · latest 500", value: String(paid.length) }, { label: "Recorded order total · latest 500", value: money(paid) }, { label: "Open enquiries", value: String(tickets) }, { label: "Course proposals awaiting review", value: String(draftCount) }, { label: "Course reviews", value: String(reviews) }, { label: "Community comments", value: String(comments) }, { label: "Registered accounts", value: String(users) }],
    breakdown: { title: "Recorded paid orders · last six months (latest 500)", items: months.map(m => ({ label: m.label, count: byMonth.get(m.key) ?? 0 })) },
    panels: [
       { title: "Recent enquiries", empty: "No enquiries yet.", items: (recentTickets.data ?? []).map(t => ({ label: t.topic, detail: `${t.status} · ${day(t.created_at)}`, tool: "inbox", at: t.created_at })) },
       { title: "Recent community comments", empty: "No comments yet.", items: (recentComments.data ?? []).map(c => ({ label: c.body.slice(0, 100), detail: day(c.created_at), tool: "moderation", at: c.created_at })) },
       { title: "Recent course proposals", empty: "No course proposals yet.", items: (recentCourses.data ?? []).map(c => ({ label: c.title, detail: `${c.status} · ${day(c.created_at)}`, tool: "drafts", at: c.created_at })) },
      { title: "Upcoming live classes", empty: "No live classes scheduled.", items: (sessions.data ?? []).map(s => ({ label: s.title, detail: day(s.starts_at), tool: "live-classes", at: s.starts_at })) },
       { title: "Recent registrations", empty: "No accounts registered yet.", items: (recentUsers.data ?? []).map(u => ({ label: u.full_name || "New learner", detail: day(u.created_at), tool: "students", at: u.created_at })) },
      { title: "Upcoming events", empty: "No events scheduled.", items: (events.data ?? []).map(e => ({ label: e.title, detail: day(e.starts_at), tool: "events", at: e.starts_at })) },
      { title: "Upcoming intakes", empty: "No intakes scheduled.", items: upcomingIntakes.map(i => ({ label: visible.get(i.course_slug)?.title || title(i.course_slug), detail: `${day(i.start_date)} · ${i.status}`, tool: "intakes", at: `${i.start_date}T00:00:00` })) },
    ],
    steps: [],
  };
}

/** A focused operations view; the detailed historical figures remain under Reports. */
function StaffOperationsHome({ data, isPending, greeting, onNavigate }: { data: Home | undefined; isPending: boolean; greeting: string; onNavigate: (tool: string) => void }) {
  const pending = data?.cards.filter(c => (c.count ?? 0) > 0 || c.tool === "payments" || c.tool === "sfc") ?? [];
  const pendingTotal = pending.reduce((sum, c) => sum + (c.count ?? 0), 0);
  const value = (label: string) => data?.metrics?.find(m => m.label === label)?.value ?? "—";
  const figures = [
    { label: "Awaiting action", value: String(pendingTotal), note: "Across active queues", icon: ClipboardList },
    { label: "Paid orders · 7 days", value: value("Paid orders · last 7 days (latest 500)"), note: "Latest 500 orders", icon: CreditCard },
    { label: "Recorded sales · month", value: value("Recorded sales · this month (latest 500)"), note: "Latest 500 orders", icon: CalendarDays },
    { label: "Registered accounts", value: value("Registered accounts"), note: "Total accounts", icon: UsersRound },
  ];
  const recent = (data?.panels ?? []).filter(p => p.title.startsWith("Recent")).flatMap(p => p.items.map(item => ({ ...item, category: p.title.replace("Recent ", "") }))).sort((a, b) => (b.at ?? "").localeCompare(a.at ?? "")).slice(0, 5);
  const coming = (data?.panels ?? []).filter(p => p.title.startsWith("Upcoming")).flatMap(p => p.items.map(item => ({ ...item, category: p.title.replace("Upcoming ", "") }))).sort((a, b) => (a.at ?? "").localeCompare(b.at ?? "")).slice(0, 5);
  return <div className="mx-auto max-w-6xl space-y-6 font-sans">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <div><p className="text-xs font-medium uppercase text-muted-foreground">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p><p className="mt-1 text-sm text-foreground">{greeting}</p></div>
      <span className="rounded-full bg-brand-gold-soft px-3 py-1.5 text-xs font-semibold text-primary">{isPending ? "Checking work…" : pendingTotal ? `${pendingTotal} ${pendingTotal === 1 ? "item" : "items"} awaiting review` : "All caught up"}</span>
    </header>
    <section aria-label="Priority actions">
      <div className="mb-3 flex items-baseline justify-between gap-2"><h2 className="font-workspace text-lg font-semibold text-primary">Priority actions</h2><span className="text-xs text-muted-foreground">Open a queue to take action</span></div>
      {isPending ? <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-24 rounded-md" />)}</div> : <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{pending.map(c => <Button key={c.tool} type="button" variant="outline" onClick={() => onNavigate(c.tool)} className={`group flex h-auto min-h-24 w-full items-start justify-between gap-3 whitespace-normal rounded-md border-l-2 p-4 text-left transition-colors hover:bg-secondary/40 ${(c.count ?? 0) > 0 ? "border-l-brand-gold" : "border-l-border"}`}><span className="min-w-0 flex-1"><span className="block font-semibold text-foreground">{c.title}</span><span className="mt-1 block text-xs font-normal leading-relaxed text-muted-foreground">{c.text}</span></span><span className="flex shrink-0 flex-col items-end gap-2"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${(c.count ?? 0) > 0 ? "bg-brand-gold-soft text-primary" : "bg-muted text-muted-foreground"}`}>{(c.count ?? 0) > 0 ? `${c.count} pending` : "All clear"}</span><ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden="true" /></span></Button>)}</div>}
    </section>
    <section aria-label="Operations at a glance" className="grid grid-cols-2 divide-x divide-y divide-border border-y border-border sm:grid-cols-4 sm:divide-y-0">
      {isPending ? [0, 1, 2, 3].map(i => <Skeleton key={i} className="m-3 h-20" />) : figures.map(f => <div key={f.label} className="min-w-0 px-3 py-4 first:pl-0 sm:px-5 sm:first:pl-0"><div className="flex items-center gap-2 text-xs text-muted-foreground"><f.icon className="size-4 shrink-0 text-brand-gold" aria-hidden="true" /><span>{f.label}</span></div><p className="mt-2 break-words font-workspace text-xl font-semibold tabular-nums text-primary sm:text-2xl">{f.value}</p><p className="text-[11px] text-muted-foreground">{f.note}</p></div>)}
    </section>
    <div className="grid gap-7 lg:grid-cols-2 lg:gap-9">
      <section className="min-w-0"><h2 className="mb-2 font-workspace text-lg font-semibold text-primary">Recent activity</h2>{isPending ? <Skeleton className="h-40" /> : recent.length ? <ul className="divide-y divide-border">{recent.map((item, i) => <li key={`${item.category}-${i}`}><Button variant="ghost" className="group flex h-auto min-h-16 w-full justify-between gap-3 rounded-none px-0 py-3 text-left" onClick={() => onNavigate(item.tool)}><span className="min-w-0 whitespace-normal"><span className="block font-medium text-foreground">{item.label}</span><span className="text-xs text-muted-foreground">{item.category} · {item.detail}</span></span><ArrowRight className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" /></Button></li>)}</ul> : <p className="border-t border-border py-4 text-sm text-muted-foreground">No recent activity yet.</p>}</section>
      <section className="min-w-0"><h2 className="mb-2 font-workspace text-lg font-semibold text-primary">Upcoming schedule & intakes</h2>{isPending ? <Skeleton className="h-40" /> : coming.length ? <ul className="divide-y divide-border">{coming.map((item, i) => <li key={`${item.category}-${i}`}><Button variant="ghost" className="group flex h-auto min-h-16 w-full justify-between gap-3 rounded-none px-0 py-3 text-left" onClick={() => onNavigate(item.tool)}><span className="min-w-0 whitespace-normal"><span className="block font-medium text-foreground">{item.label}</span><span className="text-xs text-muted-foreground">{item.category} · {item.detail}</span></span><ArrowRight className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" /></Button></li>)}</ul> : <p className="border-t border-border py-4 text-sm text-muted-foreground">No classes, events or intakes scheduled.</p>}</section>
    </div>
  </div>;
}

export function StaffOperationsReport({ userId, owner }: { userId: string; owner: boolean }) {
  const { data, isPending } = useQuery({ queryKey: ["start-here", "staff", userId, "", owner], queryFn: () => load("staff", userId, "", owner) });
  return <section className="mt-6 border-t border-border pt-6" aria-label="Operational reporting"><h2 className="font-workspace text-xl font-semibold text-primary">Operational figures</h2><p className="mt-1 text-sm text-muted-foreground">Sales and order figures are calculated from the latest 500 orders.</p>
    {isPending ? <Skeleton className="mt-5 h-36" /> : <><div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{data?.metrics?.map(m => <div key={m.label} className="min-w-0 rounded-md border border-border bg-card p-4"><p className="text-xl font-semibold tabular-nums text-primary">{m.value}</p><p className="mt-1 text-xs text-muted-foreground">{m.label}</p></div>)}</div>
    {data?.breakdown && <div className="mt-7"><h3 className="font-workspace font-semibold text-primary">{data.breakdown.title}</h3><div className="mt-3 grid gap-3">{data.breakdown.items.map(item => { const max = Math.max(1, ...data.breakdown?.items.map(x => x.count) ?? []); return <div key={item.label} className="grid grid-cols-[4rem_1fr_6rem] items-center gap-3 text-sm"><span>{item.label}</span><div className="h-2 bg-muted"><div className="h-full bg-brand-gold" style={{ width: `${item.count / max * 100}%` }} /></div><span className="text-right tabular-nums">S${item.count.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>; })}</div></div>}</>}
  </section>;
}

export function StartHere({ role, userId, email, greeting, onNavigate: fallback, stats, owner = false }: { role: StartRole; userId: string; email?: string; greeting: string; onNavigate: (tool: string) => void; stats?: React.ReactNode; owner?: boolean }) {
  const onNavigate = useWorkspaceNavigate() ?? fallback;
  const { data, isPending } = useQuery({ queryKey: ["start-here", role, userId, email, owner], queryFn: () => load(role, userId, email, owner) });
  const key = `soq-checklist-hidden:${role}:${userId}`;
  const [hidden, setHidden] = useState(false);
  useEffect(() => { setHidden(localStorage.getItem(key) === "1"); }, [key]);
  const hide = (v: boolean) => { setHidden(v); if (v) localStorage.setItem(key, "1"); else localStorage.removeItem(key); };
  if (role === "staff") return <StaffOperationsHome data={data} isPending={isPending} greeting={greeting} onNavigate={onNavigate} />;
  // Urgent cards (with a count) come first.
  const cards = data ? role === "student" ? data.cards : [...data.cards].sort((a, b) => Number(!!b.count) - Number(!!a.count)) : [];
  const steps = data?.steps ?? [];
  const done = steps.filter(s => s.done).length;
  const allDone = steps.length > 0 && done === steps.length;
  const showList = steps.length > 0 && !allDone && !hidden;
  const checklist = showList && (
    <section className="rounded-xl border border-accent/50 bg-secondary/50 p-5" aria-label="Getting started">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0"><h2 className="font-serif text-2xl font-semibold text-primary">Getting started</h2><p className="text-sm text-muted-foreground">{done} of {steps.length} done</p></div>
        <button type="button" onClick={() => hide(true)} className="rounded-md p-1 text-muted-foreground hover:text-foreground" aria-label="Hide checklist"><X className="size-5" /></button>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-accent transition-all" style={{ width: `${(done / steps.length) * 100}%` }} /></div>
      <ul className="mt-4 grid gap-2">{steps.map(s => (
        <li key={s.label}><button type="button" onClick={() => onNavigate(s.tool)} className="flex w-full items-center gap-3 rounded-md bg-background px-3 py-2.5 text-left text-sm hover:bg-card">
          {s.done ? <CheckCircle2 className="size-5 shrink-0 text-accent" aria-label="Done" /> : <Circle className="size-5 shrink-0 text-muted-foreground" aria-label="Not done" />}
          <span className={`min-w-0 ${s.done ? "text-muted-foreground line-through" : "font-medium"}`}>{s.label}</span>
          <ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button></li>))}</ul>
    </section>
  );
  if (role === "trainer") {
    const attention = cards.filter(c => c.count && c.count > 0);
    const summary = (data?.metrics ?? []).filter(m => ["Courses I teach", "Students", "Upcoming live classes", "Booked 1-to-1 meetings"].includes(m.label));
    return <div className="mt-5 max-w-6xl space-y-8">
      <header className="border-b border-border pb-5">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Teaching overview</p>
        <h2 className="mt-2 text-2xl font-semibold text-primary">Today</h2>
        <p className="mt-1 text-sm text-muted-foreground">{greeting}</p>
      </header>
      <section aria-label="Needs attention">
        <div className="mb-3 flex items-baseline justify-between gap-3"><h2 className="text-lg font-semibold text-primary">Needs attention</h2><span className="text-xs text-muted-foreground">{attention.reduce((sum, c) => sum + (c.count ?? 0), 0)} waiting</span></div>
        {isPending ? <div className="grid gap-3 md:grid-cols-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-24" />)}</div>
          : attention.length ? <div className="grid gap-3 md:grid-cols-3">{attention.map(c => <Button key={c.title} variant="outline" onClick={() => onNavigate(c.tool)} className="flex h-auto min-h-24 w-full items-start justify-between gap-3 rounded-md border-border bg-card p-4 text-left shadow-none hover:border-accent"><span className="min-w-0 whitespace-normal"><strong className="block text-sm font-semibold text-primary">{c.title}</strong><span className="mt-1 block text-xs font-normal text-muted-foreground">{c.text}</span></span><span className="shrink-0 rounded bg-secondary px-2 py-0.5 text-sm font-semibold text-primary">{c.count}</span></Button>)}</div>
          : <p className="border-y border-border py-5 text-sm text-muted-foreground">All caught up. No teaching tasks waiting.</p>}
      </section>
      <section aria-label="Teaching at a glance" className="grid grid-cols-2 gap-x-6 gap-y-4 border-y border-border py-5 md:grid-cols-4">
        {isPending ? [0, 1, 2, 3].map(i => <Skeleton key={i} className="h-16" />) : summary.map(m => <div key={m.label} className="min-w-0"><strong className="block text-2xl font-semibold tabular-nums text-primary">{m.value}</strong><span className="text-xs text-muted-foreground">{m.label}</span></div>)}
      </section>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,1fr)]">
        <section aria-label="Upcoming teaching">
          <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold text-primary">Upcoming teaching</h2><Button variant="link" size="sm" className="h-auto p-0" onClick={() => onNavigate("calendar")}>Calendar <ArrowRight className="size-4" /></Button></div>
          {data?.highlights?.length ? <ul className="mt-3 divide-y divide-border border-t border-border">{data.highlights.map((h, i) => <li key={`${h.title}-${i}`}><Button variant="ghost" onClick={() => onNavigate(h.tool)} className="flex h-auto min-h-16 w-full justify-between gap-3 rounded-none px-0 py-3 text-left"><span className="min-w-0 whitespace-normal"><strong className="block text-sm font-medium text-foreground">{h.title}</strong><span className="text-xs font-normal text-muted-foreground">{h.detail}</span></span><ArrowRight className="size-4 shrink-0 text-muted-foreground" /></Button></li>)}</ul>
            : <p className="mt-3 border-t border-border py-4 text-sm text-muted-foreground">No upcoming classes or meetings.</p>}
        </section>
        <section aria-label="Teaching tools">
          <h2 className="text-lg font-semibold text-primary">Teaching tools</h2>
          <div className="mt-3 divide-y divide-border border-t border-border">{[{ title: "Schedule a class", tool: "live" }, { title: "Session plans", tool: "plans" }, { title: "My courses", tool: "overview" }, { title: "1-to-1 availability", tool: "slots" }].map(a => <Button key={a.tool} variant="ghost" onClick={() => onNavigate(a.tool)} className="flex h-11 w-full justify-between rounded-none px-0 text-left text-sm font-medium">{a.title}<ArrowRight className="size-4 text-muted-foreground" /></Button>)}</div>
        </section>
      </div>
      {checklist}
      {steps.length > 0 && !showList && <Button variant="link" className="h-auto p-0 text-sm" onClick={() => hide(false)}>{allDone ? "All set-up steps done ✓" : "Show getting-started checklist"}</Button>}
    </div>;
  }
  return (
    <div className="mt-2 space-y-6">
      <div className="border-b border-border pb-5"><p className="text-xs font-semibold uppercase text-brand-gold">{data?.identity ? `Learning with ${data.identity}` : owner ? "Owner overview" : role === "business" ? "Team learning" : role === "trainer" ? "Teaching today" : role === "student" ? "Your learning" : "Daily operations"}</p><p className="mt-2 max-w-2xl text-muted-foreground">{greeting}</p></div>
      {data?.metrics && <div className="grid grid-cols-2 gap-3 border-b border-border pb-6 sm:grid-cols-3" aria-label="At a glance">{data.metrics.map(m => <div key={m.label} className="border-l-2 border-brand-gold pl-4"><p className="font-serif text-3xl text-primary">{m.value}</p><p className="text-xs text-muted-foreground">{m.label}</p></div>)}</div>}
      <section aria-label="Next actions">
        <h2 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">{cards.some(c => c.count) ? "Needs your attention" : "Next steps"}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {isPending ? [0, 1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-md" />) : cards.map(c => (
            <Button key={c.title} variant="outline" type="button" onClick={() => onNavigate(c.tool)} className={`group grid h-auto min-h-28 w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-3 whitespace-normal rounded-md p-5 text-left transition hover:border-accent ${c.count ? "border-accent" : "border-border"}`}>
              <span className="min-w-0">
                <span className="block font-serif text-2xl font-semibold leading-tight text-primary">{c.title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{c.text}</span>
              </span>
              {c.count ? <span className="grid min-w-8 place-items-center rounded-full bg-accent px-2 py-1 text-sm font-bold text-accent-foreground">{c.count}</span>
                : c.badge ? <span className="rounded-full bg-secondary px-2 py-1 text-xs font-semibold text-primary">{c.badge}</span>
                : <ArrowRight className="mt-1 size-5 text-muted-foreground transition group-hover:translate-x-1" aria-hidden="true" />}
            </Button>
          ))}
        </div>
      </section>
      {data?.highlights && <section className="border-t border-border pt-5" aria-label="Coming up"><h2 className="font-serif text-2xl text-primary">{role === "business" ? "Team progress" : role === "student" ? "Tasks & booked classes" : role === "trainer" ? "Upcoming classes & meetings" : "Upcoming classes"}</h2>{data.highlights.length ? <ul className="mt-3 divide-y divide-border">{data.highlights.map((h, i) => <li key={`${h.title}-${i}`}><Button variant="ghost" onClick={() => onNavigate(h.tool)} className="flex h-auto w-full justify-between gap-3 rounded-none px-0 py-3 text-left"><span className="min-w-0 whitespace-normal"><strong className="block font-medium">{h.title}</strong><span className="text-xs text-muted-foreground">{h.detail}</span></span><ArrowRight className="size-4 shrink-0" /></Button></li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">{role === "business" ? "No linked course enrolments yet. Add team members, then ask SOQ to enrol them." : role === "trainer" ? "No upcoming classes or meetings. Schedule one from Classes." : "No tasks or confirmed classes coming up. Open a course to see what’s next."}</p>}</section>}
       {data?.breakdown && <section className="border-t border-border pt-5"><h2 className="font-serif text-2xl text-primary">{data.breakdown.title}</h2>{data.breakdown.items.length ? <div className="mt-4 grid gap-3">{data.breakdown.items.map(item => { const max = Math.max(1, ...(data.breakdown?.items ?? []).map(x => x.count)); return <div key={item.label} className="grid grid-cols-[minmax(7rem,10rem)_1fr_auto] items-center gap-3 text-sm"><span className="truncate" title={item.label}>{item.label}</span><div className="h-3 bg-muted"><div className="h-full bg-brand-gold" style={{ width: `${item.count / max * 100}%` }} /></div><span className="min-w-12 text-right tabular-nums">{item.count}</span></div>; })}</div> : <p className="mt-2 text-sm text-muted-foreground">No records yet.</p>}</section>}
      {data?.panels && <div className="grid gap-x-10 gap-y-7 border-t border-border pt-5 lg:grid-cols-2">{data.panels.map(panel => <section key={panel.title}><h2 className="font-serif text-2xl text-primary">{panel.title}</h2>{panel.items.length ? <ul className="mt-2 divide-y divide-border">{panel.items.map((item, i) => <li key={`${item.label}-${i}`}><Button variant="ghost" className="h-auto w-full justify-between gap-3 rounded-none px-0 py-3 text-left" onClick={() => onNavigate(item.tool)}><span className="min-w-0 whitespace-normal"><span className="block font-medium">{item.label}</span><span className="block text-xs text-muted-foreground">{item.detail}</span></span><ArrowRight className="size-4 shrink-0" /></Button></li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">{panel.empty}</p>}</section>)}</div>}
      {data?.unavailable && <p className="border-t border-border pt-5 text-sm text-muted-foreground">{data.unavailable}</p>}
      {checklist}
      {steps.length > 0 && !showList && <Button variant="link" className="h-auto p-0 text-sm" onClick={() => hide(false)}>{allDone ? "All set-up steps done ✓" : "Show getting-started checklist"}</Button>}
      {stats && <section aria-label="At a glance"><h2 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">At a glance</h2>{stats}</section>}
    </div>
  );
}

/** Grey outline shown while a portal loads, instead of bare "Loading…" text. */
export function PageSkeleton() {
  return <div className="mx-auto max-w-[92rem] px-5 py-10 lg:px-8" aria-busy="true" aria-label="Loading">
    <div className="grid gap-10 lg:grid-cols-[14rem_1fr]">
      <div className="hidden space-y-3 lg:block">{[0, 1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
      <div className="space-y-4"><Skeleton className="h-12 w-2/3" /><div className="grid gap-4 sm:grid-cols-2">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}</div></div>
    </div>
  </div>;
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return <div className="mt-6 space-y-3" aria-busy="true" aria-label="Loading">{Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>;
}

export function DetailSkeleton() {
  return <div className="mx-auto max-w-5xl space-y-4 px-5 py-16" aria-busy="true" aria-label="Loading"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-5 w-2/3" /><Skeleton className="h-64 w-full" /><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-4/5" /></div>;
}

/** Friendly hint + button for an empty list. */
export function EmptyState({ text, action, onAction, icon: Icon }: { text: string; action?: string; onAction?: () => void; icon?: LucideIcon }) {
  return <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-center">
    {Icon && <Icon className="mx-auto mb-2 size-6 text-muted-foreground" aria-hidden="true" />}
    <p className="text-sm text-muted-foreground">{text}</p>
    {action && onAction && <Button size="sm" className="mt-3 rounded-full" onClick={onAction}>{action}</Button>}
  </div>;
}
