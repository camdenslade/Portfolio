'use client';

import { useCallback, useState } from 'react';
import type { CameraState } from '@/lib/three/cameraStates';

export type IntroController = {
  cameraState: CameraState;
  showFakeChrome: boolean;
  startFocusFlow: () => void;
  setCameraState: (state: CameraState) => void;
  setShowFakeChrome: (value: boolean) => void;
};

export function useIntroController(): IntroController {
  const [cameraState, setCameraState] = useState<CameraState>('IDLE');
  const [showFakeChrome, setShowFakeChrome] = useState(false);

  const startFocusFlow = useCallback(() => {
    if (cameraState !== 'IDLE') return;
    setCameraState('FOCUS_SCREEN');
  }, [cameraState]);

  return {
    cameraState,
    showFakeChrome,
    startFocusFlow,
    setCameraState,
    setShowFakeChrome,
  };
}
