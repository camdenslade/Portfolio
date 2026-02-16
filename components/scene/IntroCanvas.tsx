'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { IntroScene } from './IntroScene';

export default function IntroCanvas() {
  return (
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
        <IntroScene />
      </Suspense>
    </Canvas>
  );
}
