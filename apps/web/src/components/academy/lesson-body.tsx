import * as React from "react";

// ── Randare mini-markdown pentru corpul lecțiilor ───────────────────────────
// Suportă: paragrafe (\n\n), **bold**, bullet list (linii care încep cu "- ").

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-zinc-100">
        {part}
      </strong>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

export function LessonBody({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);

  return (
    <div className="space-y-4">
      {blocks.map((block, bi) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        const isList = lines.every((l) => l.startsWith("- "));

        if (isList) {
          return (
            <ul key={bi} className="space-y-2">
              {lines.map((l, li) => (
                <li key={li} className="flex gap-2.5 text-sm leading-relaxed text-zinc-400">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500/70" />
                  <span>{renderInline(l.slice(2))}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={bi} className="text-sm leading-relaxed text-zinc-400">
            {renderInline(block)}
          </p>
        );
      })}
    </div>
  );
}
