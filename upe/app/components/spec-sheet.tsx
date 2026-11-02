import type { ReactNode } from 'react';

const SECTIONS = [
  { tag: 'ROLE', label: 'Role', hint: 'Who the AI should act as' },
  { tag: 'CONTEXT', label: 'Context', hint: 'What this is, who it’s for, what success looks like' },
  { tag: 'TASK', label: 'Task', hint: 'Exactly what to build or write' },
  { tag: 'CONSTRAINTS', label: 'Constraints', hint: 'The hard rules to follow' },
  { tag: 'OUTPUT FORMAT', label: 'Output format', hint: 'How the answer should be structured' },
] as const;

const SECTION_TAG = /^[ \t]*[#*_]*\s*\[(ROLE|CONTEXT|TASK|CONSTRAINTS|OUTPUT FORMAT)\][*_]*:?[*_]*[ \t]*/gim;

/**
 * Splits a master prompt into its labeled sections for display. Returns null
 * when the text has no section tags, so the caller can show it unchanged.
 * Copying always uses the original text, not this parsed form.
 */
function parseMasterPrompt(text: string) {
  const matches = [...text.matchAll(SECTION_TAG)];
  if (matches.length === 0) return null;

  const bodies: Record<string, string> = {};
  matches.forEach((match, i) => {
    const start = match.index + match[0].length;
    const end = matches[i + 1]?.index ?? text.length;
    const tag = match[1].toUpperCase();
    // While streaming, the next tag can arrive half-written, like "[OUTP".
    const body = text.slice(start, end).replace(/\n\s*\[[A-Z ]*$/, '').trim();
    bodies[tag] = bodies[tag] ? `${bodies[tag]}\n\n${body}` : body;
  });

  return { preamble: text.slice(0, matches[0].index).trim(), bodies };
}

type SpecSheetProps = {
  /** The master prompt. Leave empty to show the blank sheet. */
  text?: string | null;
  /** Shown at the right of the sheet's title row. */
  aside?: ReactNode;
};

export function SpecSheet({ text, aside }: SpecSheetProps) {
  const parsed = text ? parseMasterPrompt(text) : null;
  const unparsed = text && !parsed ? text : null;
  const preamble = parsed?.preamble || unparsed;

  return (
    <section className="spec" aria-label="Master prompt">
      <div className="spec-head">
        <h2 className="spec-title">Master prompt</h2>
        {aside}
      </div>

      {preamble && <p className="spec-raw">{preamble}</p>}

      {!unparsed && (
        <dl className="spec-rows">
          {SECTIONS.map(({ tag, label, hint }) => {
            const body = parsed?.bodies[tag];
            return (
              <div className="spec-row" data-filled={body ? 'true' : undefined} key={tag}>
                <dt className="spec-label">{label}</dt>
                <dd className="spec-body">{body || <span className="spec-hint">{hint}</span>}</dd>
              </div>
            );
          })}
        </dl>
      )}
    </section>
  );
}
