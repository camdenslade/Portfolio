'use client';

import { useEffect, useState } from 'react';

export function shouldBypass3DEnvironment(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Only bypass on coarse-pointer devices (touch-first/mobile).
  // Desktop users should still see the intro model, even in smaller windows.
  return window.matchMedia('(pointer: coarse)').matches;
}

export function useShouldBypass3D(): boolean {
  const [bypass, setBypass] = useState(false);

  useEffect(() => {
    const evaluate = () => setBypass(shouldBypass3DEnvironment());
    evaluate();

    const pointerMedia = window.matchMedia('(pointer: coarse)');
    pointerMedia.addEventListener('change', evaluate);

    return () => {
      pointerMedia.removeEventListener('change', evaluate);
    };
  }, []);

  return bypass;
}
