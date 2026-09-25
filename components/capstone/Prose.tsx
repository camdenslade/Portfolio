'use client';

import MathBlock from '@/components/capstone/MathBlock';

// Renders a string that may contain inline math delimited by $...$, e.g.
// "Alice publishes $g^a$ over the open channel." Splits on the delimiter
// and renders each math span through KaTeX inline, everything else as
// plain text. Lets prose in slidesData.ts reference variables like $a$,
// $CK_i$, or $g^{ab}$ and have them actually typeset instead of showing
// up as raw characters in the sentence.
export function Prose({ text }: { text: string }) {
  const rawParts = text.split(/(\$[^$]+\$)/g);

  // Pull any punctuation immediately following a math span (", ", ". ",
  // etc.) out of the next text part and glue it to the math span itself,
  // so the browser can't break the line between an equation and its comma.
  const parts = rawParts.map((part, i) => {
    if (!(part.startsWith('$') && part.endsWith('$') && part.length > 1)) return part;
    const next = rawParts[i + 1];
    const match = next?.match(/^[,.;:)]+/);
    if (!match) return part;
    rawParts[i + 1] = next.slice(match[0].length);
    return part + match[0];
  });

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('$')) {
          const closingIdx = part.lastIndexOf('$');
          const math = part.slice(1, closingIdx);
          const trailing = part.slice(closingIdx + 1);
          return (
            <span key={i} className="inline-block whitespace-nowrap">
              <MathBlock math={math} />
              {trailing}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export default Prose;
