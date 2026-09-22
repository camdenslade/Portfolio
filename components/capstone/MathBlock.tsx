'use client';

import { useEffect, useRef } from 'react';
import katex from 'katex';

interface MathBlockProps {
  math: string;
  block?: boolean;
  className?: string;
}

// client-side KaTeX rendering component
export const MathBlock: React.FC<MathBlockProps> = ({
  math,
  block = false,
  className = '',
}) => {
  // ref poitning at the target span/div container
  const containerRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    // ensure the DOM container exists first
    if (!containerRef.current) return;

    try {
      // render rae LaTeX expression directly into the container node
      katex.render(math, containerRef.current, {
        // block mode centers equation on it's own line
        displayMode: block,
        throwOnError: false,
      });
    } catch (error) {
      // log any unrecoverable syntax parse error
      console.log('KaTeX rendering error:', error);
    }
  }, [math, block]);

  // render wrapper element carrying the target ref
  return (
    <span
      ref={containerRef}
      className={`inline-block font-serif ${block ? 'my-2 block w-full text-center overflow-x-auto py-1' : ''} ${className}`}
      />
  );
};

export default MathBlock;