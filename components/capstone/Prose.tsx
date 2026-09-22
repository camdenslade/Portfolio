'use client';

import MathBlock from '@/components/capstone/MathBlock';

// Renders a string that may contain inline math delimited by $...$, e.g.
// "Alice publishes $g^a$ over the open channel." Splits on the delimiter
// and renders each math span through KaTeX inline, everything else as
// plain text. Lets prose in slidesData.ts reference variables like $a$,
// $CK_i$, or $g^{ab}$ and have them actually typeset instead of showing
// up as raw characters in the sentence.
export function Prose({ text }: { text: string }) {
  const parts = text.split(/(\$[^$]+\$)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('$') && part.endsWith('$') && part.length > 1) {
          return <MathBlock key={i} math={part.slice(1, -1)} />;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export default Prose;
