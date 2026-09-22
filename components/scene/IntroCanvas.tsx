'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense, useState } from 'react';
import { IntroScene } from './IntroScene';
import { useIntroController } from './useIntroController';

export default function IntroCanvas() {
  const controller = useIntroController();
  const [modelReady, setModelReady] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [0, 1.2, 3.4], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, toneMappingExposure: 1.2 }}
      >
        <color attach="background" args={['#ffffff']} />
        <ambientLight intensity={0.8} color="#ffffff" />
        <hemisphereLight intensity={0.7} groundColor="#ffffff" color="#ffffff" />
        <directionalLight position={[2.8, 3.2, 2.4]} intensity={1.1} color="#ffffff" />
        <directionalLight position={[-2.4, 2.3, 1.8]} intensity={0.7} color="#ffffff" />
        <Suspense fallback={null}>
          <IntroScene controller={controller} onModelReady={() => setModelReady(true)} />
        </Suspense>
      </Canvas>

      {/* Loading spinner (until the model is ready) + tap hint, visible only when idle */}
      {controller.cameraState === 'IDLE' && (
        <div style={{
          position: 'absolute', bottom: '14%', left: 0, right: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
          pointerEvents: 'none',
          animation: 'fadeInUp 0.6s ease forwards',
        }}>
          {!modelReady && (
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                border: '3px solid rgba(0,0,0,0.12)',
                borderTopColor: 'rgba(0,0,0,0.45)',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.4 }}>
              <path d="M9 11V6a3 3 0 0 1 6 0v5" stroke="#333" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 11h14l-1.5 9H6.5L5 11z" stroke="#333" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.35)', letterSpacing: '0.02em' }}>click the screen</span>
          </div>
        </div>
      )}
    </div>
  );
}
