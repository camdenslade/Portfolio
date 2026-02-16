'use client';

import { Html, useGLTF } from '@react-three/drei';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Group, Mesh, MeshStandardMaterial, Object3D } from 'three';
import { Euler, Vector3 } from 'three';
import { configureDraco } from '@/lib/three/gltf';
import { ScreenHotspot } from './ScreenHotspot';
import type { ReactNode } from 'react';

const MODEL_PATH = '/models/computer-placeholder.glb';
const LOADED_MODEL_SCALE = 0.06;
const LOADED_SCREEN_OVERLAY = {
  // Tuned for the current MacBook GLB in model-local space.
  position: [0, 11.75, -16.94] as [number, number, number],
  rotation: [-0.345, 0, 0] as [number, number, number],
  width: 1375,
};
const SCREEN_PREVIEW_WIDTH = 950;
const SCREEN_PREVIEW_HEIGHT = 620;

type ComputerModelProps = {
  onScreenClick: () => void;
  onOutsideScreenClick?: () => void;
  screenOverlay?: ReactNode;
  floatEnabled?: boolean;
};
const FLOAT_AMPLITUDE = 0.035;
const FLOAT_SPEED = 1.15;

function useScreenFrontFacing(
  groupRef: React.RefObject<Group>,
  position: [number, number, number],
  rotation: [number, number, number]
) {
  const { camera } = useThree();
  const [isFrontFacing, setIsFrontFacing] = useState(true);
  const visibleRef = useRef(true);
  const localNormal = useMemo(
    () => new Vector3(0, 0, 1).applyEuler(new Euler(rotation[0], rotation[1], rotation[2])).normalize(),
    [rotation]
  );

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    const worldPoint = group.localToWorld(new Vector3(position[0], position[1], position[2]));
    const worldNormal = localNormal.clone().transformDirection(group.matrixWorld).normalize();
    const toCamera = camera.position.clone().sub(worldPoint).normalize();
    // Prevent screen overlay from rendering when viewing from beneath the laptop.
    const aboveScreen = camera.position.y >= worldPoint.y - 0.02;
    const facing = worldNormal.dot(toCamera) > 0 && aboveScreen;

    if (visibleRef.current !== facing) {
      visibleRef.current = facing;
      setIsFrontFacing(facing);
    }
  });

  return isFrontFacing;
}

function isScreenLike(meshName: string, material: MeshStandardMaterial): boolean {
  const meshLabel = meshName.toLowerCase();
  const matLabel = (material.name ?? '').toLowerCase();
  return (
    meshLabel.includes('screen') ||
    meshLabel.includes('display') ||
    meshLabel.includes('monitor') ||
    matLabel.includes('screen') ||
    matLabel.includes('display') ||
    matLabel.includes('monitor') ||
    material.emissiveMap !== null
  );
}

function useFloatingGroup(groupRef: React.RefObject<Group>, baseY: number, enabled: boolean) {
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = enabled
      ? baseY + Math.sin(clock.getElapsedTime() * FLOAT_SPEED) * FLOAT_AMPLITUDE
      : baseY;
  });
}

function LoadedComputer({
  onScreenClick,
  onOutsideScreenClick,
  screenOverlay,
  floatEnabled = true,
}: ComputerModelProps) {
  const gltf = useGLTF(
    MODEL_PATH,
    true,
    true,
    (loader) => configureDraco(loader)
  );

  const scene = useMemo(() => gltf.scene.clone(), [gltf.scene]);
  const [screenMeshNames, setScreenMeshNames] = useState<Set<string>>(new Set());
  const groupRef = useRef<Group>(null);
  useFloatingGroup(groupRef, -0.42, floatEnabled);
  const isFrontFacing = useScreenFrontFacing(
    groupRef,
    LOADED_SCREEN_OVERLAY.position,
    LOADED_SCREEN_OVERLAY.rotation
  );

  const handleModelClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      const clickedName = event.object?.name?.toLowerCase() ?? '';
      if (!screenMeshNames.has(clickedName)) {
        event.stopPropagation();
        onOutsideScreenClick?.();
        return;
      }
      event.stopPropagation();
      onScreenClick();
    },
    [onOutsideScreenClick, onScreenClick, screenMeshNames]
  );

  useEffect(() => {
    const detected = new Set<string>();

    scene.traverse((object: Object3D) => {
      if (!('isMesh' in object) || !object.isMesh) return;
      const mesh = object as Mesh;
      const meshName = (mesh.name ?? '').toLowerCase();
      const material = mesh.material as MeshStandardMaterial | MeshStandardMaterial[];
      const materials = Array.isArray(material) ? material : [material];

      for (const mat of materials) {
        if (!mat || !('isMeshStandardMaterial' in mat) || !mat.isMeshStandardMaterial) continue;
        mat.roughness = 0.42;
        mat.metalness = 0.62;
        if (isScreenLike(meshName, mat)) {
          detected.add(meshName);
          mat.color.set('#ffffff');
          mat.emissive.set('#ffffff');
          mat.emissiveIntensity = 0.3;
        } else {
          mat.emissive.set('#000000');
          mat.emissiveIntensity = 0;
        }
      }
    });
    setScreenMeshNames(detected);
  }, [scene]);

  const htmlScale = LOADED_SCREEN_OVERLAY.width / 950;

  return (
    <group ref={groupRef} position={[0, -0.42, 0]} scale={[LOADED_MODEL_SCALE, LOADED_MODEL_SCALE, LOADED_MODEL_SCALE]}>
      <primitive object={scene} onClick={handleModelClick} />
      {screenOverlay && isFrontFacing && (
        <Html
          position={LOADED_SCREEN_OVERLAY.position}
          rotation={LOADED_SCREEN_OVERLAY.rotation}
          transform
          scale={[htmlScale, htmlScale, htmlScale]}
          occlude={false}
          center
        >
          <div style={{ backfaceVisibility: 'hidden' }}>{screenOverlay}</div>
        </Html>
      )}
      <ScreenHotspot
        onActivate={onScreenClick}
        position={LOADED_SCREEN_OVERLAY.position}
        rotation={LOADED_SCREEN_OVERLAY.rotation}
        size={[SCREEN_PREVIEW_WIDTH, SCREEN_PREVIEW_HEIGHT]}
        scale={[htmlScale, htmlScale, htmlScale]}
      />
    </group>
  );
}

function PrimitiveComputer({
  onScreenClick,
  onOutsideScreenClick,
  screenOverlay,
  floatEnabled = true,
}: ComputerModelProps) {
  // Screen box is at [0, 1.0, -0.42] with size [1.6, 1.0]
  const screenScale = 1.6 / 950;
  const groupRef = useRef<Group>(null);
  useFloatingGroup(groupRef, -0.45, floatEnabled);
  const isFrontFacing = useScreenFrontFacing(groupRef, [0, 1.0, -0.38], [0, 0, 0]);

  return (
    <group
      ref={groupRef}
      position={[0, -0.45, 0]}
      onClick={(event) => {
        event.stopPropagation();
        onOutsideScreenClick?.();
      }}
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <circleGeometry args={[1.9, 48]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[2.2, 0.08, 1.4]} />
        <meshStandardMaterial color="#3a3a3a" />
      </mesh>

      <mesh position={[0, 0.5, -0.33]}>
        <boxGeometry args={[0.14, 0.9, 0.1]} />
        <meshStandardMaterial color="#343434" />
      </mesh>

      <mesh position={[0, 1.0, -0.42]}>
        <boxGeometry args={[1.6, 1.0, 0.08]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
      </mesh>

      {screenOverlay && isFrontFacing && (
        <Html
          position={[0, 1.0, -0.38]}
          transform
          scale={[screenScale, screenScale, screenScale]}
          occlude={false}
          center
        >
          <div style={{ backfaceVisibility: 'hidden' }}>{screenOverlay}</div>
        </Html>
      )}

      <ScreenHotspot onActivate={onScreenClick} />
    </group>
  );
}

export function ComputerModel({
  onScreenClick,
  onOutsideScreenClick,
  screenOverlay,
  floatEnabled = true,
}: ComputerModelProps) {
  const [shouldLoadModel, setShouldLoadModel] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    const checkModel = async () => {
      try {
        const response = await fetch(MODEL_PATH, { method: 'HEAD' });
        if (active) setShouldLoadModel(response.ok);
      } catch {
        if (active) setShouldLoadModel(false);
      }
    };

    void checkModel();

    return () => {
      active = false;
    };
  }, []);

  if (shouldLoadModel === null) {
    return null;
  }

  if (shouldLoadModel) {
    return (
      <LoadedComputer
        onScreenClick={onScreenClick}
        onOutsideScreenClick={onOutsideScreenClick}
        screenOverlay={screenOverlay}
        floatEnabled={floatEnabled}
      />
    );
  }

  return (
    <PrimitiveComputer
      onScreenClick={onScreenClick}
      onOutsideScreenClick={onOutsideScreenClick}
      screenOverlay={screenOverlay}
      floatEnabled={floatEnabled}
    />
  );
}
