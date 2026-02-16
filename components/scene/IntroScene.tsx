'use client';

import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Vector3 } from 'three';
import type { PerspectiveCamera } from 'three';

import { animateCamera, type CameraTarget } from '@/lib/three/cameraAnim';
import { usePrefersReducedMotion } from '@/lib/three/motion';
import { useIntroController } from './useIntroController';
import { ComputerModel } from './ComputerModel';
import { FakeChromeWindow, type ViewState } from '@/components/ui/FakeChromeWindow';

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

export function IntroScene() {
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
  } = useIntroController();

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
        width: '950px',
        height: '620px',
        pointerEvents: cameraState === 'ENTER_SCREEN' ? 'auto' : 'none',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: '950px',
          height: '620px',
          backgroundImage: "url('/wallpaper-tahoe.jpg')",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center 50%',
          backgroundSize: '260% auto',
          borderTopLeftRadius: '18px',
          borderTopRightRadius: '18px',
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      />
      {showFakeChrome && (
        <div
          ref={browserShellRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '950px',
            height: '620px',
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
      <OrbitControls
        enabled={cameraState === 'IDLE' && !showFakeChrome}
        enablePan={false}
        minDistance={2.8}
        maxDistance={4.2}
        minPolarAngle={0.6}
        maxPolarAngle={2.4}
      />

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
      />
    </>
  );
}
