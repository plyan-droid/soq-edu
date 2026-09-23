import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Info, X } from "lucide-react";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import logo from "@/assets/soq-logo.png.asset.json";

const starters = ["How do I know if I'm ready?", "I'm switching careers, where should I start?", "Can I use SkillsFuture Credit?"];

export function CourseChat({ slug, title, onClose }: { slug: string; title: string; onClose?: () => void }) {
  const [notice, setNotice] = useState(true);
  const { messages, sendMessage, status, error, stop } = useChat({
    id: `course-${slug}`,
    transport: new DefaultChatTransport({ api: "/api/course-chat", body: { slug } }),
  });
  const busy = status === "submitted" || status === "streaming";
  const send = (text: string) => { if (text.trim() && !busy) sendMessage({ text: text.trim() }); };

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2"><img src={logo.url} alt="SOQ" className="size-7 object-contain" /><span className="text-sm font-semibold text-primary">SOQ Course Adviser</span></div>
        {onClose && <button onClick={onClose} aria-label="Close adviser" className="rounded p-1 text-muted-foreground hover:text-primary"><X className="size-4" /></button>}
      </div>
      <Conversation className="flex-1">
        <ConversationContent className="gap-5 p-4">
          {notice && (
            <div className="rounded-lg bg-secondary p-4 text-sm">
              <p className="flex gap-2 font-semibold text-primary"><Info className="mt-0.5 size-4 shrink-0" />Your privacy and this chat</p>
              <p className="mt-1 text-muted-foreground">This chat isn't saved. Don't share NRIC or other sensitive details.</p>
              <button onClick={() => setNotice(false)} className="mt-3 rounded-md bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground">Got it</button>
            </div>
          )}
          {messages.length === 0 && (
            <div>
              <h3 className="font-serif text-2xl text-primary">Is this right for me?</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Tell me your goal or current role and I'll give you an honest view on whether "{title}" fits.</p>
              <div className="mt-4 flex flex-col items-start gap-2">
                {starters.map((s) => <button key={s} onClick={() => send(s)} className="rounded-md border border-border px-3 py-2 text-left text-sm hover:border-primary hover:text-primary">{s}</button>)}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <Message key={m.id} from={m.role}>
              <MessageContent className={m.role === "user" ? "bg-primary text-primary-foreground" : "bg-transparent p-0"}>
                {m.parts.map((p, i) => p.type === "text" ? (m.role === "assistant" ? <MessageResponse key={i}>{p.text}</MessageResponse> : <span key={i}>{p.text}</span>) : null)}
              </MessageContent>
            </Message>
          ))}
          {status === "submitted" && <Shimmer className="text-sm">Thinking...</Shimmer>}
          {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">Sorry, the adviser couldn't answer just now. Please try again or message us on WhatsApp.</p>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="border-t border-border p-3">
        <PromptInput onSubmit={({ text }) => send(text ?? "")}>
          <PromptInputTextarea placeholder="Ask anything..." autoFocus />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} onStop={stop} />
          </PromptInputFooter>
        </PromptInput>
        <p className="mt-2 text-[11px] leading-4 text-muted-foreground">AI-powered, so check important details with an adviser.</p>
      </div>
    </div>
  );
}
