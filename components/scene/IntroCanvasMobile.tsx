'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { IntroSceneMobile } from './IntroSceneMobile';
import { useIntroController } from './useIntroController';
import { FakeSafariWindow } from '@/components/ui/FakeSafariWindow';

export default function IntroCanvasMobile() {
  const controller = useIntroController();
  const backOutRef = useRef<(() => void) | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [isBackingOut, setIsBackingOut] = useState(false);

  // Lock body scroll while in the zoomed phone view
  useEffect(() => {
    if (controller.cameraState !== 'ENTER_SCREEN') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [controller.cameraState]);

  // Zoom in when overlay mounts
  useEffect(() => {
    if (controller.cameraState !== 'ENTER_SCREEN') return;
    const el = overlayRef.current;
    if (!el) return;
    gsap.fromTo(el,
      { scale: 1.15, opacity: 0 },
      { scale: 1.0, opacity: 1, duration: 0.3, ease: 'power2.out' }
    );
  }, [controller.cameraState]);

  const handleBackOut = useCallback(() => {
    setIsBackingOut(true); // reveal 3D overlay behind DOM overlay
    const el = overlayRef.current;
    if (el) {
      gsap.to(el, {
        opacity: 0,
        duration: 0.3,
        ease: 'power1.in',
        onComplete: () => {
          controller.setShowFakeChrome(false);
          controller.setCameraState('IDLE');
          setIsBackingOut(false);
        },
      });
    }
    backOutRef.current?.();
  }, [controller]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100dvh' }}>
      <Canvas
        camera={{ position: [-3.5, 0.2, 0], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, toneMappingExposure: 1.2 }}
        style={{ width: '100%', height: '100%' }}
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

      {/* Full-screen native DOM overlay in ENTER_SCREEN — no CSS 3D transform, so touch scroll works */}
      {controller.cameraState === 'ENTER_SCREEN' && (
        <div
          ref={overlayRef}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            overflow: 'hidden',
          }}
        >
          <FakeSafariWindow onBack={handleBackOut} />
        </div>
      )}
    </div>
  );
}
