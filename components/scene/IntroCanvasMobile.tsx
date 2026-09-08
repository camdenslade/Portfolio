'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { IntroSceneMobile } from './IntroSceneMobile';
import { useIntroController } from './useIntroController';
import { FakeSafariWindow } from '@/components/ui/FakeSafariWindow';

export default function IntroCanvasMobile() {
  const controller = useIntroController();
  const backOutRef = useRef<(() => void) | null>(null);
  const [isBackingOut, setIsBackingOut] = useState(false);

  // Lock body scroll while overlay is open
  useEffect(() => {
    if (controller.cameraState !== 'ENTER_SCREEN') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [controller.cameraState]);

  const handleBackOut = useCallback(() => {
    setIsBackingOut(true);
    backOutRef.current?.();
    // setCameraState('IDLE') comes from the camera animation onComplete in IntroSceneMobile
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100dvh' }}>
      <Canvas
        camera={{ position: [-3.5, 0.2, 0], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, toneMappingExposure: 1.2 }}
        style={{ width: '100%', height: '100%', pointerEvents: controller.cameraState === 'ENTER_SCREEN' ? 'none' : 'auto' }}
      >
        <color attach="background" args={['#ffffff']} />
        <ambientLight intensity={0.8} color="#ffffff" />
        <hemisphereLight intensity={0.7} groundColor="#ffffff" color="#ffffff" />
        <directionalLight position={[-2.8, 3.2, 2.4]} intensity={1.1} color="#ffffff" />
        <directionalLight position={[2.4, 2.3, 1.8]} intensity={0.7} color="#ffffff" />
        <Suspense fallback={null}>
          <IntroSceneMobile controller={controller} backOutRef={backOutRef} isBackingOut={isBackingOut} />
        </Suspense>
      </Canvas>

      {/* Tap hint, visible only when idle */}
      {controller.cameraState === 'IDLE' && (
        <div style={{
          position: 'absolute', bottom: '14%', left: 0, right: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          pointerEvents: 'none',
          animation: 'fadeInUp 0.6s ease forwards',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.4 }}>
            <path d="M9 11V6a3 3 0 0 1 6 0v5" stroke="#333" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 11h14l-1.5 9H6.5L5 11z" stroke="#333" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.35)', letterSpacing: '0.02em' }}>tap the screen</span>
        </div>
      )}

      {/* Full-screen native DOM overlay: no animations, no inline styles, clean hit testing */}
      {controller.cameraState === 'ENTER_SCREEN' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
          <FakeSafariWindow onBack={handleBackOut} />
        </div>
      )}
    </div>
  );
}
