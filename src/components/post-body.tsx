import type { ReactNode } from "react";

function youtubeId(line: string): string | null {
  const m = line.trim().match(/^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})\S*$/);
  return m ? m[1] : null;
}

function inline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2)
      return <code key={i} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]">{part.slice(1, -1)}</code>;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>;
    return part;
  });
}

export function PostBody({ body }: { body: string }) {
  const blocks: ReactNode[] = [];
  const parts = body.split(/(```[\s\S]*?```)/g);
  parts.forEach((part, pi) => {
    if (part.startsWith("```")) {
      const code = part.replace(/^```\w*\n?/, "").replace(/```$/, "");
      blocks.push(
        <pre key={`c${pi}`} className="overflow-x-auto rounded-xl bg-primary p-4 font-mono text-sm leading-6 text-primary-foreground"><code>{code}</code></pre>,
      );
      return;
    }
    part.split(/\n{2,}/).forEach((para, i) => {
      const p = para.trim();
      if (!p) return;
      const key = `${pi}-${i}`;
      const vid = youtubeId(p);
      if (vid) {
        blocks.push(
          <div key={key} className="aspect-video overflow-hidden rounded-xl border border-border">
            <iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${vid}`} title="YouTube video" allowFullScreen loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture" />
          </div>,
        );
      } else if (p.startsWith("## ")) {
        blocks.push(<h2 key={key} className="mt-4 font-serif text-3xl text-foreground">{inline(p.slice(3))}</h2>);
      } else if (p.startsWith("> ")) {
        blocks.push(<blockquote key={key} className="border-l-4 border-accent pl-4 italic text-muted-foreground">{inline(p.replace(/^> /gm, ""))}</blockquote>);
      } else if (p.split("\n").every((l) => /^(- |\d+\. )/.test(l))) {
        const ordered = /^\d+\. /.test(p);
        const items = p.split("\n").map((l, li) => <li key={li}>{inline(l.replace(/^(- |\d+\. )/, ""))}</li>);
        blocks.push(ordered ? <ol key={key} className="list-decimal space-y-1 pl-6">{items}</ol> : <ul key={key} className="list-disc space-y-1 pl-6">{items}</ul>);
      } else {
        blocks.push(<p key={key} className="whitespace-pre-line">{inline(p)}</p>);
      }
    });
  });
  return <div className="mt-8 grid gap-5 text-lg leading-8">{blocks}</div>;
}
