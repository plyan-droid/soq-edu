import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { courses, contact } from "@/lib/site-content";

export const Route = createFileRoute("/api/course-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { messages?: unknown; slug?: string };
        if (!Array.isArray(body.messages)) return new Response("Messages are required", { status: 400 });
        const course = courses.find((c) => c.slug === body.slug);
        if (!course) return new Response("Unknown course", { status: 400 });
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("AI is not configured", { status: 500 });

        const lovable = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey: key,
          headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
        });
        const others = courses.map((c) => `${c.slug} | ${c.title} | ${c.category} | ${c.duration} | ${c.price}`).join("\n");
        const system = `You are SOQ International Academy's friendly course adviser in Singapore. The visitor is viewing this course:
Title: ${course.title}
Category: ${course.category}
Certification: ${course.badge}
Duration: ${course.duration}
Mode: ${course.mode}
Fee: ${course.price}
Summary: ${course.summary}
Outcomes: ${course.outcomes.join("; ")}

 Help them decide honestly whether it fits their goal or current role. Write in British English. Keep answers short (under 120 words), warm and practical, using markdown bullets where useful. Many SOQ courses may be eligible for SkillsFuture Credit and WSQ funding up to 70%; say an adviser will confirm. If another course fits better, suggest it from this catalogue and link it as [Title](/courses/slug). Never invent courses, dates or prices. For schedules, suggest WhatsApp ${contact.whatsapp} or the Apply form on the page.

Catalogue (slug | title | category | duration | fee):
${others}`;

        try {
          const result = streamText({
            model: lovable.responses("openai/gpt-6-astra"),
            system,
            messages: await convertToModelMessages(body.messages as UIMessage[]),
            abortSignal: request.signal,
            providerOptions: {
              openai: { forceReasoning: true, reasoningEffort: "low", store: false, include: ["reasoning.encrypted_content"] },
            },
          });
          return result.toUIMessageStreamResponse({ originalMessages: body.messages as UIMessage[] });
        } catch (e) {
          if ((e as Error)?.name === "AbortError") return new Response(null, { status: 499 });
          throw e;
        }
      },
    },
  },
});
