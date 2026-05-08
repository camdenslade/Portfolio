'use client';

import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { useCallback, useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import type { MutableRefObject } from 'react';
import type { PerspectiveCamera } from 'three';

import { animateCamera, type CameraTarget } from '@/lib/three/cameraAnim';
import { usePrefersReducedMotion } from '@/lib/three/motion';
import type { IntroController } from './useIntroController';
import { IphoneModel, IPHONE_SCREEN_PX } from './IphoneModel';
import { FakeSafariWindow } from '@/components/ui/FakeSafariWindow';

const CAMERA_TARGETS: Record<'FOCUS_SCREEN' | 'ENTER_SCREEN', CameraTarget> = {
  FOCUS_SCREEN: {
    position: { x: -2.5, y: -0.175, z: 0 },
    lookAt: { x: -0.04, y: -0.175, z: 0 },
  },
  ENTER_SCREEN: {
    position: { x: -2.5, y: -0.175, z: 0 },
    lookAt: { x: -0.04, y: -0.175, z: 0 },
  },
};

type Props = {
  controller: IntroController;
  backOutRef: MutableRefObject<(() => void) | null>;
  isBackingOut: boolean;
};

export function IntroSceneMobile({ controller, backOutRef, isBackingOut }: Props) {
  const { camera } = useThree();
  const reducedMotion = usePrefersReducedMotion();
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const browserShellRef = useRef<HTMLDivElement | null>(null);
  const initialTargetRef = useRef<CameraTarget | null>(null);
  const { cameraState, showFakeChrome, startFocusFlow, setCameraState, setShowFakeChrome } = controller;

  useEffect(() => {
    if (initialTargetRef.current) return;
    const perspectiveCamera = camera as PerspectiveCamera;
    const direction = perspectiveCamera.getWorldDirection(new Vector3());
    const lookPoint = perspectiveCamera.position.clone().add(direction.multiplyScalar(1.5));
    initialTargetRef.current = {
      position: { x: perspectiveCamera.position.x, y: perspectiveCamera.position.y, z: perspectiveCamera.position.z },
      lookAt: { x: lookPoint.x, y: lookPoint.y, z: lookPoint.z },
    };
  }, [camera]);

  const handleBackOut = useCallback(() => {
    const perspectiveCamera = camera as PerspectiveCamera;
    const initialTarget = initialTargetRef.current;
    if (!initialTarget) return;
    timelineRef.current?.kill();
    timelineRef.current = animateCamera(perspectiveCamera, initialTarget, reducedMotion, () => {
      setShowFakeChrome(false);
      setCameraState('IDLE');
    });
  }, [camera, reducedMotion, setCameraState, setShowFakeChrome]);

  // Expose handleBackOut to the parent DOM overlay
  useEffect(() => {
    backOutRef.current = handleBackOut;
  }, [handleBackOut, backOutRef]);

  const handleOutsideScreenClick = useCallback(() => {
    if (cameraState !== 'ENTER_SCREEN') return;
    handleBackOut();
  }, [cameraState, handleBackOut]);

  useEffect(() => {
    if (cameraState !== 'FOCUS_SCREEN') return;
    const perspectiveCamera = camera as PerspectiveCamera;
    timelineRef.current?.kill();
    setShowFakeChrome(true);
    timelineRef.current = animateCamera(
      perspectiveCamera,
      CAMERA_TARGETS.FOCUS_SCREEN,
      reducedMotion,
      () => { setCameraState('ENTER_SCREEN'); }
    );

    const rafId = requestAnimationFrame(() => {
      if (!browserShellRef.current || !timelineRef.current) return;
      gsap.killTweensOf(browserShellRef.current);
      gsap.set(browserShellRef.current, { opacity: reducedMotion ? 1 : 0 });
      timelineRef.current.to(browserShellRef.current, {
        opacity: 1,
        duration: reducedMotion ? 0.01 : 0.22,
        ease: 'power2.out',
      }, 0);
    });

    return () => cancelAnimationFrame(rafId);
  }, [camera, cameraState, reducedMotion, setCameraState, setShowFakeChrome]);

  useEffect(() => {
    if (!showFakeChrome || !browserShellRef.current) return;
    gsap.set(browserShellRef.current, { opacity: 1 });
  }, [showFakeChrome]);

  useEffect(() => {
    return () => {
      timelineRef.current?.kill();
      timelineRef.current = null;
    };
  }, []);

  const W = IPHONE_SCREEN_PX.w;
  const H = IPHONE_SCREEN_PX.h;

  // 3D overlay: always visible for visual continuity during zoom-in.
  // In ENTER_SCREEN the native DOM overlay in IntroCanvasMobile sits on top
  // and handles all interaction, so this is non-interactive then.
  const screenOverlay = (
    <div
      style={{
        width: `${W}px`,
        height: `${H}px`,
        pointerEvents: 'none',
        overflow: 'hidden',
        position: 'relative',
        borderRadius: '60px',
      }}
    >
      <div
        ref={browserShellRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: `${W}px`,
          height: `${H}px`,
          overflow: 'hidden',
          borderRadius: '60px',
          clipPath: `path('M0 0 H${W} V${H} H0 Z M231 23 H159 A14 14 0 0 0 145 37 A14 14 0 0 0 159 51 H231 A14 14 0 0 0 245 37 A14 14 0 0 0 231 23 Z')`,
          // Hidden during ENTER_SCREEN so the DOM overlay is the only thing visible;
          // revealed when backing out so it shows through as the DOM overlay shrinks
          visibility: cameraState === 'ENTER_SCREEN' && !isBackingOut ? 'hidden' : 'visible',
        }}
      >
        <FakeSafariWindow onBack={handleBackOut} />
      </div>
    </div>
  );

  return (
    <>
      {cameraState === 'IDLE' && !showFakeChrome && (
        <OrbitControls />
      )}

      <mesh
        position={[0, 0.8, -12]}
        onClick={(event) => {
          event.stopPropagation();
          handleOutsideScreenClick();
        }}
      >
        <planeGeometry args={[40, 24]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} depthTest={false} colorWrite={false} />
      </mesh>

      <IphoneModel
        onScreenClick={startFocusFlow}
        onOutsideScreenClick={cameraState === 'IDLE' ? startFocusFlow : handleOutsideScreenClick}
        screenOverlay={cameraState === 'ENTER_SCREEN' && !isBackingOut ? null : screenOverlay}
        floatEnabled={cameraState === 'IDLE'}
      />
    </>
  );
}
