'use client';

import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Vector3 } from 'three';
import type { PerspectiveCamera } from 'three';

import { animateCamera, type CameraTarget } from '@/lib/three/cameraAnim';
import { usePrefersReducedMotion } from '@/lib/three/motion';
import type { IntroController } from './useIntroController';
import { ComputerModel } from './ComputerModel';
import { FakeChromeWindow, type ViewState } from '@/components/ui/FakeChromeWindow';

const SCREEN_W = 950;
const SCREEN_H = 620;

const CAMERA_TARGETS: Record<'FOCUS_SCREEN' | 'ENTER_SCREEN', CameraTarget> = {
  FOCUS_SCREEN: {
    position: { x: 0, y: 0.9, z: 1.78 },
    lookAt: { x: 0, y: 0.33, z: -0.38 },
  },
  ENTER_SCREEN: {
    position: { x: 0, y: 0.9, z: 1.78 },
    lookAt: { x: 0, y: 0.33, z: -0.38 },
  },
};

type Props = {
  controller: IntroController;
  onModelReady?: () => void;
};

export function IntroScene({ controller, onModelReady }: Props) {
  const { camera } = useThree();
  const reducedMotion = usePrefersReducedMotion();
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const browserShellRef = useRef<HTMLDivElement | null>(null);
  const [browserView, setBrowserView] = useState<ViewState>('google');
  const initialTargetRef = useRef<CameraTarget | null>(null);
  const {
    cameraState,
    showFakeChrome,
    startFocusFlow,
    setCameraState,
    setShowFakeChrome,
  } = controller;

  useEffect(() => {
    if (initialTargetRef.current) return;
    const perspectiveCamera = camera as PerspectiveCamera;
    const direction = perspectiveCamera.getWorldDirection(new Vector3());
    const lookPoint = perspectiveCamera.position.clone().add(direction.multiplyScalar(1.5));
    initialTargetRef.current = {
      position: {
        x: perspectiveCamera.position.x,
        y: perspectiveCamera.position.y,
        z: perspectiveCamera.position.z,
      },
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
    if (browserShellRef.current) {
      gsap.killTweensOf(browserShellRef.current);
      timelineRef.current.to(
        browserShellRef.current,
        {
          opacity: 0,
          duration: reducedMotion ? 0.01 : 0.22,
          ease: 'power2.out',
        },
        0
      );
    }
  }, [camera, reducedMotion, setCameraState, setShowFakeChrome]);

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
      () => {
        setCameraState('ENTER_SCREEN');
      }
    );

    const rafId = requestAnimationFrame(() => {
      if (!browserShellRef.current || !timelineRef.current) return;
      gsap.killTweensOf(browserShellRef.current);
      gsap.set(browserShellRef.current, { opacity: reducedMotion ? 1 : 0 });
      timelineRef.current.to(
        browserShellRef.current,
        {
          opacity: 1,
          duration: reducedMotion ? 0.01 : 0.22,
          ease: 'power2.out',
        },
        0
      );
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

  const screenOverlay = (
    <div
      style={{
        width: `${SCREEN_W}px`,
        height: `${SCREEN_H}px`,
        pointerEvents: cameraState === 'ENTER_SCREEN' ? 'auto' : 'none',
        overflow: 'hidden',
        position: 'relative',
        backgroundImage: 'url(/wallpaper-tahoe.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        // Rounded rect CW + notch CCW = nonzero fill punches notch hole
        // Notch: 100px wide centred at 475, 16px tall, bottom corners r=8
        clipPath: `path('M16 0 H934 A16 16 0 0 1 950 16 V620 H0 V16 A16 16 0 0 1 16 0 Z M525 0 H425 V8 A8 8 0 0 0 433 16 H517 A8 8 0 0 0 525 8 V0 Z')`,
      }}
    >
      {showFakeChrome && (
        <div
          ref={browserShellRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: `${SCREEN_W}px`,
            height: `${SCREEN_H}px`,
            pointerEvents: cameraState === 'ENTER_SCREEN' ? 'auto' : 'none',
            overflow: 'hidden',
          }}
        >
          <FakeChromeWindow
            onBack={handleBackOut}
            compact
            initialView={browserView}
            onViewChange={setBrowserView}
          />
        </div>
      )}
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
        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false}
          depthTest={false}
          colorWrite={false}
        />
      </mesh>

      <ComputerModel
        onScreenClick={startFocusFlow}
        onOutsideScreenClick={handleOutsideScreenClick}
        screenOverlay={screenOverlay}
        floatEnabled={cameraState === 'IDLE'}
        onReady={onModelReady}
      />
    </>
  );
}
