// Renders announcement text with light formatting: **bold**, *italic*, __underline__, ~~strike~~, line breaks.
import type { ReactNode } from "react";

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|\*[^*]+\*)/g;
  let last = 0, m: RegExpExecArray | null, k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    const inner = t.slice(2, -2);
    if (t.startsWith("**")) out.push(<strong key={`${keyBase}-${k++}`}>{inner}</strong>);
    else if (t.startsWith("__")) out.push(<u key={`${keyBase}-${k++}`}>{inner}</u>);
    else if (t.startsWith("~~")) out.push(<s key={`${keyBase}-${k++}`}>{inner}</s>);
    else out.push(<em key={`${keyBase}-${k++}`}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function NoticeBody({ text, className = "" }: { text: string; className?: string }) {
  const lines = text.split("\n");
  return (
    <div className={className}>
      {lines.map((line, i) => {
        const bullet = line.trimStart().startsWith("- ");
        const content = bullet ? line.trimStart().slice(2) : line;
        return (
          <p key={i} className={bullet ? "pl-4 before:mr-2 before:content-['•']" : i > 0 ? "mt-1" : ""}>
            {inline(content, `l${i}`)}
          </p>
        );
      })}
    </div>
  );
}
