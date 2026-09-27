import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { MessageCircle, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/soq-logo.png.asset.json";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";

export type PortalThread = { id: string; title: string; messages: UIMessage[] };

function ThreadChat({
  thread,
  onSave,
}: {
  thread: PortalThread;
  onSave: (id: string, messages: UIMessage[]) => void;
}) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const transport = useRef(
    new DefaultChatTransport({
      api: "/api/portal-agent",
      fetch: async (input, init) => {
        const { data } = await supabase.auth.getSession();
        const headers = new Headers(init?.headers);
        if (data.session?.access_token)
          headers.set("Authorization", `Bearer ${data.session.access_token}`);
        const response = await fetch(input, { ...init, headers });
        if (!response.ok) throw new Error(await response.text());
        return response;
      },
    }),
  );
  const { messages, sendMessage, status, error, stop } = useChat({
    id: thread.id,
    messages: thread.messages,
    transport: transport.current,
  });
  useEffect(() => {
    onSave(thread.id, messages);
  }, [thread.id, messages, onSave]);
  useEffect(() => {
    textarea.current?.focus();
  }, [thread.id, status]);
  const busy = status === "submitted" || status === "streaming";
  const send = (value: string) => {
    if (!busy && value.trim()) void sendMessage({ text: value.trim() });
  };
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="gap-4 p-4">
          {messages.length === 0 && (
            <div className="py-8 text-center">
              <img src={logo.url} alt="SOQ" className="mx-auto size-14 object-contain" />
              <h3 className="mt-3 font-serif text-2xl text-primary">How can I help?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                 Ask about courses, funding, your learning, or where to go next.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                 {["What is the attendance requirement?", "What does the AI course cover?", "Show my progress"].map(
                  (s) => (
                    <Button key={s} variant="outline" size="sm" onClick={() => send(s)}>
                      {s}
                    </Button>
                  ),
                )}
              </div>
            </div>
          )}
          {messages.map((message) => (
            <Message key={message.id} from={message.role}>
              <MessageContent
                className={
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent p-0"
                }
              >
                {message.parts.map((part, i) => {
                  if (part.type === "text")
                    return message.role === "assistant" ? (
                      <MessageResponse key={i}>{part.text}</MessageResponse>
                    ) : (
                      <span key={i}>{part.text}</span>
                    );
                  if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
                    const item = part as import("ai").ToolUIPart | import("ai").DynamicToolUIPart;
                    return (
                      <Tool key={i} defaultOpen={false}>
                        <ToolHeader
                          type={item.type as "dynamic-tool"}
                          toolName={
                            item.type === "dynamic-tool" ? item.toolName : item.type.slice(5)
                          }
                          state={item.state}
                        />
                        <ToolContent>
                          <ToolInput input={item.input} />
                          <ToolOutput output={item.output} errorText={item.errorText} />
                        </ToolContent>
                      </Tool>
                    );
                  }
                  return null;
                })}
              </MessageContent>
            </Message>
          ))}
          {status === "submitted" && <Shimmer className="text-sm">Thinking...</Shimmer>}
          {error && (
            <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error.message}
            </p>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="border-t border-border bg-background p-3">
        <PromptInput onSubmit={({ text }) => send(text ?? "")}>
          <PromptInputTextarea ref={textarea} placeholder="Ask SOQ assistant…" autoFocus />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} onStop={stop} />
          </PromptInputFooter>
        </PromptInput>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Chats clear when you refresh. Check important details with SOQ staff.
        </p>
      </div>
    </div>
  );
}

export function PortalAssistant() {
  const [open, setOpen] = useState(false);
  const [threads, setThreads] = useState<PortalThread[]>([]);
  const [active, setActive] = useState("");
  useEffect(() => {
    if (threads.length === 0) {
      const id = crypto.randomUUID();
      setThreads([{ id, title: "New conversation", messages: [] }]);
      setActive(id);
    }
  }, [threads.length]);
  const save = useCallback(
    (id: string, messages: UIMessage[]) =>
      setThreads((prev) => {
        if (prev.find((t) => t.id === id)?.messages === messages) return prev;
        return prev.map((t) =>
          t.id === id
            ? {
                ...t,
                messages,
                title:
                  messages
                    .find((m) => m.role === "user")
                    ?.parts.filter((p) => p.type === "text")
                    .map((p) => p.text)
                    .join(" ")
                    .slice(0, 36) || t.title,
              }
            : t,
        );
      }),
    [],
  );
  const current = threads.find((t) => t.id === active) ?? threads[0];
  const create = () => {
    const id = crypto.randomUUID();
    setThreads((prev) => [...prev, { id, title: "New conversation", messages: [] }]);
    setActive(id);
  };
  return (
    <div className="fixed bottom-5 right-5 z-50 sm:bottom-6 sm:right-6 [[data-workspace]_&]:bottom-20 lg:[[data-workspace]_&]:bottom-6">
      {open && (
        <section
          role="dialog"
          aria-label="SOQ portal assistant"
          className="mb-3 flex h-[min(620px,calc(100dvh-6.5rem))] w-[min(410px,calc(100vw-2rem))] flex-col overflow-hidden rounded-md border border-border bg-background shadow-xl"
        >
          <header className="flex items-center justify-between border-b border-border bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <img src={logo.url} alt="SOQ" className="size-8 object-contain" />
              <strong className="text-sm">SOQ portal assistant</strong>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:text-primary"
              title="Close assistant"
              aria-label="Close assistant"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </header>
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <select
              aria-label="Conversation"
              className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm"
              value={active}
              onChange={(e) => setActive(e.target.value)}
            >
              {threads.map((thread, i) => (
                <option value={thread.id} key={thread.id}>
                  {i + 1}. {thread.title}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="icon"
              title="New conversation"
              aria-label="New conversation"
              onClick={create}
            >
              <Plus className="size-4" />
            </Button>
          </div>
          {current && <ThreadChat key={current.id} thread={current} onSave={save} />}
        </section>
      )}
      <div className="flex justify-end">
        <Button
          className="size-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
          aria-label={open ? "Close portal assistant" : "Open portal assistant"}
          title="Ask SOQ assistant"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
        </Button>
      </div>
    </div>
  );
}
