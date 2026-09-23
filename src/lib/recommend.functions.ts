import { createServerFn } from "@tanstack/react-start";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, Output } from "ai";
import { z } from "zod";
import { courses } from "./site-content";

const Input = z.object({ goals: z.string().trim().min(10).max(1500) });

const Schema = z.object({
  summary: z.string(),
  recommendations: z.array(z.object({ slug: z.string(), reason: z.string() })),
});

export const recommendCourses = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI service is not configured.");
    const lovable = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey: key,
      headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });
    const catalog = courses
      .map((c) => `${c.slug} | ${c.title} | ${c.category} | ${c.duration} | ${c.mode} | ${c.price} | ${c.summary.slice(0, 160)}`)
      .join("\n");
    try {
      const result = streamText({
        model: lovable.responses("openai/gpt-6-astra"),
        output: Output.object({ schema: Schema }),
        system:
          "You are a friendly course advisor for SOQ International Academy in Singapore. Recommend 3 to 5 courses from the catalog ONLY, using exact slugs. Give a one-sentence summary of the learner's needs and a short, specific reason (under 40 words) per course. Never invent courses.\n\nCatalog (slug | title | category | duration | mode | price | summary):\n" +
          catalog,
        prompt: `Learner goals: ${data.goals}`,
        providerOptions: {
          openai: { forceReasoning: true, reasoningEffort: "low", store: false, include: ["reasoning.encrypted_content"] },
        },
      });
      const out = await result.output;
      const valid = new Set(courses.map((c) => c.slug));
      return {
        summary: out.summary,
        recommendations: out.recommendations.filter((r) => valid.has(r.slug)).slice(0, 5),
      };
    } catch (e: unknown) {
      const status = (e as { statusCode?: number })?.statusCode;
      if (status === 429) throw new Error("Too many requests right now — please try again in a moment.");
      if (status === 402) throw new Error("AI recommendations are temporarily unavailable. Please contact us on WhatsApp.");
      throw new Error("We couldn't generate recommendations. Please try again.");
    }
  });
