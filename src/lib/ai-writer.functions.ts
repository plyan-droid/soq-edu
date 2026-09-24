import { createServerFn } from "@tanstack/react-start";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({ kind: z.string().max(60), brief: z.string().trim().min(5).max(2000) });

export const aiWrite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { data: ok } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!ok) throw new Error("Staff only.");
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI service is not configured.");
    const lovable = createOpenAI({ baseURL: "https://ai.gateway.lovable.dev/v1", apiKey: key, headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" } });
    try {
      const r = await generateText({
        model: lovable.responses("openai/gpt-6-astra"),
        system: "You write for SOQ International Academy, a private education institution at 10 Anson Road, International Plaza, Singapore. Warm, professional, clear British/Singapore English. Never invent fees, dates, funding amounts or accreditations — write [confirm] where a fact is needed. Contact: WhatsApp +65 8718 2308, academy@soq.edu.sg. Output only the draft text.",
        prompt: `Write a ${data.kind}. Brief: ${data.brief}`,
        providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", store: false, include: ["reasoning.encrypted_content"] } },
      });
      return { text: r.text };
    } catch (e: unknown) {
      const s = (e as { statusCode?: number })?.statusCode;
      if (s === 429) throw new Error("Too many requests — try again in a moment.");
      if (s === 402) throw new Error("AI credits have run out.");
      throw new Error("Couldn't write a draft. Please try again.");
    }
  });
